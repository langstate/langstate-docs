import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repositoryRoot, "apps", "docs");
const configPath = path.join(docsRoot, "docs.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const errors = [];

const expectedVariables = {
  repository: "https://github.com/langstate/langstate",
  commit: "df40bc49bc8e3a51b2bb695b30ff93ef81b2cc4b",
  version: "0.1.0 source alpha",
};

for (const [name, expected] of Object.entries(expectedVariables)) {
  if (config.variables?.[name] !== expected) {
    errors.push(`docs.json variable ${name} must equal ${expected}`);
  }
}

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

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".DS_Store") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(fullPath));
    else result.push(fullPath);
  }
  return result;
}

function hasExactPath(relativePath) {
  const segments = relativePath.split("/").filter(Boolean);
  let current = docsRoot;
  for (const segment of segments) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return false;
    const entries = fs.readdirSync(current);
    if (!entries.includes(segment)) return false;
    current = path.join(current, segment);
  }
  return fs.existsSync(current);
}

function pageFile(page) {
  const candidates = [`${page}.mdx`, `${page}.md`, `${page}/index.mdx`, `${page}/index.md`];
  return candidates.find(hasExactPath);
}

function routeTarget(target) {
  const withoutQuery = target.split(/[?#]/, 1)[0];
  if (!withoutQuery || withoutQuery === "/") return "index.mdx";
  let relative;
  try {
    relative = decodeURIComponent(withoutQuery.replace(/^\/+|\/+$/g, ""));
  } catch {
    return null;
  }
  if (!relative || relative.includes("..")) return null;
  if (path.extname(relative)) return hasExactPath(relative) ? relative : null;
  return pageFile(relative) ?? null;
}

const navigationPages = collectNavigationPages(config.navigation);
const seenPages = new Set();
for (const page of navigationPages) {
  if (seenPages.has(page)) errors.push(`duplicate navigation page: ${page}`);
  seenPages.add(page);
  if (page !== page.toLowerCase()) errors.push(`navigation page is not lowercase: ${page}`);
  if (!pageFile(page)) errors.push(`navigation page does not resolve with exact case: ${page}`);
}

const contentFiles = walk(docsRoot)
  .filter((file) => /\.mdx?$/.test(file))
  .filter((file) => path.basename(file) !== "README.md");

for (const file of contentFiles) {
  const relative = path.relative(docsRoot, file).replace(/\\/g, "/");
  const page = relative.replace(/\.(md|mdx)$/, "");
  if (!seenPages.has(page)) errors.push(`content page is not in navigation: ${relative}`);
}

const retiredNeedles = [
  "https://github.com/agentize/langstate",
  "OpenAPI Plant Store",
  "/api-playground/demo",
  "/auth",
  "/rate-limits",
  "/writing-content/",
  "/path/image.jpg",
  "dashboard.mintlify.com",
];

const allTextFiles = [configPath, ...contentFiles];
for (const file of allTextFiles) {
  const text = fs.readFileSync(file, "utf8");
  const relative = path.relative(repositoryRoot, file);
  for (const needle of retiredNeedles) {
    if (text.includes(needle)) errors.push(`${relative} contains retired target: ${needle}`);
  }
}

function withoutCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]+`/g, "");
}

function checkInternalTarget(target, source) {
  const cleaned = target.trim().replace(/^<|>$/g, "");
  if (
    !cleaned ||
    cleaned.startsWith("#") ||
    cleaned.startsWith("http://") ||
    cleaned.startsWith("https://") ||
    cleaned.startsWith("mailto:") ||
    cleaned.startsWith("tel:") ||
    cleaned.startsWith("{{")
  ) {
    return;
  }
  if (!cleaned.startsWith("/")) {
    errors.push(`${source} uses a non-root-relative internal target: ${cleaned}`);
    return;
  }
  if (!routeTarget(cleaned)) errors.push(`${source} has an unresolved internal target: ${cleaned}`);
}

for (const file of contentFiles) {
  const relative = path.relative(repositoryRoot, file);
  const text = withoutCode(fs.readFileSync(file, "utf8"));
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
  for (const match of text.matchAll(imagePattern)) {
    if (!match[1].trim()) errors.push(`${relative} has an image without alt text: ${match[2]}`);
    checkInternalTarget(match[2], relative);
  }
  const markdownLinkPattern = /(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
  for (const match of text.matchAll(markdownLinkPattern)) checkInternalTarget(match[1], relative);
  const componentTargetPattern = /\b(?:href|src)=["']([^"']+)["']/g;
  for (const match of text.matchAll(componentTargetPattern)) checkInternalTarget(match[1], relative);
}

const redirectSources = new Set();
for (const redirect of config.redirects ?? []) {
  if (redirectSources.has(redirect.source)) errors.push(`duplicate redirect source: ${redirect.source}`);
  redirectSources.add(redirect.source);
  if (redirect.permanent !== true) errors.push(`redirect is not explicitly permanent: ${redirect.source}`);
  if (!routeTarget(redirect.destination)) {
    errors.push(`redirect destination does not resolve: ${redirect.source} -> ${redirect.destination}`);
  }
}

if (config.errors?.["404"]?.redirect !== false) {
  errors.push("errors.404.redirect must be false");
}

const retiredDirectories = ["ai-tools", "api-reference", "essentials", "snippets", "patterns"];
for (const directory of retiredDirectories) {
  const fullPath = path.join(docsRoot, directory);
  if (fs.existsSync(fullPath) && walk(fullPath).length > 0) {
    errors.push(`retired documentation directory still contains files: apps/docs/${directory}`);
  }
}

if (errors.length > 0) {
  console.error(`Documentation structure validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Documentation structure is valid: ${navigationPages.length} exact-case pages, ` +
    `${config.redirects?.length ?? 0} redirects, and ${contentFiles.length} navigable content files.`,
);
