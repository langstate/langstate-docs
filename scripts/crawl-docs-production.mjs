import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsConfig = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, "apps", "docs", "docs.json"), "utf8"),
);
const positionalArguments = process.argv
  .slice(2)
  .filter((argument) => argument !== "--" && argument !== "--check-external");
const baseUrl = new URL(
  positionalArguments[0] ?? process.env.DOCS_BASE_URL ?? "https://docs.langstate.com",
);
const checkExternal = process.argv.includes("--check-external");
const failures = [];
const visited = new Set();
const queued = new Set();
const queue = [];

function collectNavigationPages(value, pages = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectNavigationPages(item, pages);
    return pages;
  }
  if (!value || typeof value !== "object") return pages;
  if (Array.isArray(value.pages)) {
    for (const page of value.pages) {
      if (typeof page === "string") pages.push(page);
      else collectNavigationPages(page, pages);
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== "pages") collectNavigationPages(child, pages);
  }
  return pages;
}

function enqueue(value, source, expectedStatus = null) {
  let url;
  try {
    url = new URL(value, baseUrl);
  } catch {
    failures.push(`Invalid URL from ${source}: ${value}`);
    return;
  }
  if (url.origin !== baseUrl.origin) return;
  url.hash = "";
  const key = url.href;
  if (queued.has(key) || visited.has(key)) return;
  queued.add(key);
  queue.push({ url, source, expectedStatus });
}

async function request(url, redirect = "follow") {
  return fetch(url, {
    redirect,
    headers: { "user-agent": "langstate-docs-release-check/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
}

function extractHtmlTargets(html) {
  const targets = [];
  const attributePattern = /\b(?:href|src)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributePattern)) targets.push(match[1].replaceAll("&amp;", "&"));
  return targets;
}

function extractLlmsTargets(text) {
  const targets = [];
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) targets.push(match[1]);
  for (const match of text.matchAll(/https?:\/\/[^\s)>]+/g)) targets.push(match[0]);
  return targets;
}

const canonicalRoutes = collectNavigationPages(docsConfig.navigation).map((page) =>
  page === "index" ? "/" : `/${page}`,
);
const canonicalRouteSet = new Set(canonicalRoutes);
for (const route of canonicalRoutes) enqueue(route, "docs.json navigation", 200);
enqueue("/llms.txt", "required index", 200);

for (const redirect of docsConfig.redirects ?? []) {
  const sourcePath = redirect.source.replace(":slug*", "retired-page");
  const sourceUrl = new URL(sourcePath, baseUrl);
  try {
    const response = await request(sourceUrl, "manual");
    if (response.status !== 308) {
      failures.push(`${sourcePath} returned ${response.status}; expected permanent redirect 308`);
      continue;
    }
    const location = response.headers.get("location");
    if (!location) {
      failures.push(`${sourcePath} returned 308 without a Location header`);
      continue;
    }
    const destination = new URL(location, sourceUrl);
    if (destination.pathname !== redirect.destination) {
      failures.push(
        `${sourcePath} redirected to ${destination.pathname}; expected ${redirect.destination}`,
      );
    }
    const finalResponse = await request(destination);
    if (finalResponse.status !== 200) {
      failures.push(`${sourcePath} terminated at ${finalResponse.url} with ${finalResponse.status}`);
    }
  } catch (error) {
    failures.push(`${sourcePath} redirect check failed: ${error.message}`);
  }
}

const maximumTargets = 1_500;
while (queue.length > 0 && visited.size < maximumTargets) {
  const { url, source, expectedStatus } = queue.shift();
  queued.delete(url.href);
  if (visited.has(url.href)) continue;
  visited.add(url.href);

  try {
    const response = await request(url, expectedStatus === null ? "follow" : "manual");
    if (expectedStatus !== null && response.status !== expectedStatus) {
      failures.push(
        `${url.href} returned ${response.status}; expected ${expectedStatus}; linked from ${source}`,
      );
      continue;
    }
    if (response.status >= 400) {
      failures.push(`${url.href} returned ${response.status}; linked from ${source}`);
      continue;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const html = await response.text();
      for (const target of extractHtmlTargets(html)) enqueue(target, response.url);
    } else if (url.pathname === "/llms.txt" || contentType.includes("text/plain")) {
      const text = await response.text();
      const retired = ["OpenAPI Plant Store", "/auth", "/rate-limits", "/writing-content/"];
      for (const needle of retired) {
        if (text.includes(needle)) failures.push(`/llms.txt contains retired content: ${needle}`);
      }
      if (url.pathname === "/llms.txt" && !text.includes("LangState")) {
        failures.push("/llms.txt does not identify LangState");
      }
      for (const target of new Set(extractLlmsTargets(text))) {
        try {
          const targetUrl = new URL(target, response.url);
          if (targetUrl.origin === baseUrl.origin) {
            let documentationPath = targetUrl.pathname.replace(/\/+$/, "") || "/";
            if (documentationPath.endsWith(".md")) {
              documentationPath = documentationPath.slice(0, -3) || "/";
            }
            if (!canonicalRouteSet.has(documentationPath)) {
              failures.push(`/llms.txt links to non-navigation route: ${targetUrl.pathname}`);
            }
          }
        } catch {
          // enqueue() reports malformed targets with their source context.
        }
        enqueue(target, response.url);
      }
    }
  } catch (error) {
    failures.push(`${url.href} could not be fetched; linked from ${source}: ${error.message}`);
  }
}

if (queue.length > 0) failures.push(`Crawler exceeded ${maximumTargets} unique internal targets`);

if (checkExternal) {
  const externalTargets = new Set([
    ...(docsConfig.navbar?.links ?? []).map((link) => link.href),
    docsConfig.navbar?.primary?.href,
    ...Object.values(docsConfig.footer?.socials ?? {}),
  ]);
  for (const target of externalTargets) {
    if (!target) continue;
    try {
      const response = await request(new URL(target));
      if (response.status >= 400) failures.push(`${target} returned ${response.status}`);
    } catch (error) {
      failures.push(`${target} could not be fetched: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Production crawl failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Production crawl passed for ${baseUrl.origin}: ${canonicalRoutes.length} canonical routes, ` +
    `${docsConfig.redirects?.length ?? 0} redirects, and ${visited.size} linked internal targets.`,
);
