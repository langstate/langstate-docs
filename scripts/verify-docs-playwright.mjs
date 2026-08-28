import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromDocs = createRequire(path.join(repositoryRoot, "apps", "docs", "package.json"));
const { chromium, devices } = requireFromDocs("playwright");
const docsConfig = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, "apps", "docs", "docs.json"), "utf8"),
);
const baseUrl = new URL(process.env.DOCS_BASE_URL ?? "https://docs.langstate.com");
const localPreview = ["127.0.0.1", "localhost"].includes(baseUrl.hostname);
const failures = [];
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {},
);

async function inspectPage(route, device = "desktop") {
  const contextOptions =
    device === "mobile"
      ? { ...devices["Pixel 7"] }
      : { viewport: { width: 1440, height: 1000 } };
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const pageFailures = [];

  page.on("console", (message) => {
    if (message.type() === "error") pageFailures.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText === "net::ERR_ABORTED") return;
    if (new URL(request.url()).origin === baseUrl.origin) {
      pageFailures.push(`request failed: ${request.url()} (${request.failure()?.errorText})`);
    }
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === baseUrl.origin && response.status() >= 400) {
      pageFailures.push(`response ${response.status()}: ${response.url()}`);
    }
  });

  const target = new URL(route, baseUrl);
  try {
    const response = await page.goto(target.href, { waitUntil: "networkidle", timeout: 45_000 });
    if (!response || response.status() !== 200) {
      pageFailures.push(`${target.pathname} returned ${response?.status() ?? "no response"}`);
    }
    await page.waitForTimeout(750);
  } catch (error) {
    pageFailures.push(`${target.pathname} navigation failed: ${error.message}`);
  }

  failures.push(...pageFailures.map((failure) => `${device} ${target.pathname}: ${failure}`));
  return { context, page };
}

const desktopHome = await inspectPage("/");
if ((await desktopHome.page.locator("h1").filter({ hasText: "LangState" }).count()) === 0) {
  failures.push("desktop /: LangState heading is not visible");
}
if (
  (await desktopHome.page
    .locator('a[href="https://github.com/langstate/langstate"]')
    .count()) === 0
) {
  failures.push("desktop /: canonical GitHub link is missing");
}
if ((await desktopHome.page.getByText("Getting Started", { exact: true }).count()) === 0) {
  failures.push("desktop /: Getting Started navigation is missing");
}
await desktopHome.context.close();

for (const [route, expectedText] of [
  ["/quickstart", "OpenAPIReader"],
  ["/architecture/orchestrator-contract", "ActionResultData"],
]) {
  const result = await inspectPage(route);
  if ((await result.page.getByText(expectedText, { exact: true }).count()) === 0) {
    failures.push(`desktop ${route}: representative code token ${expectedText} is missing`);
  }
  await result.context.close();
}

const mobileHome = await inspectPage("/", "mobile");
const menuButton = mobileHome.page.getByRole("button", { name: /Navigation/ }).first();
if ((await menuButton.count()) === 0 || !(await menuButton.isVisible())) {
  failures.push("mobile /: navigation menu button is missing");
} else {
  await menuButton.click();
  if ((await mobileHome.page.getByText("Design Notes", { exact: true }).count()) === 0) {
    failures.push("mobile /: Design Notes tab is missing after opening navigation");
  }
}
await mobileHome.context.close();

if (!localPreview) {
  for (const redirect of docsConfig.redirects ?? []) {
    const source = redirect.source.replace(":slug*", "retired-page");
    const sourceUrl = new URL(source, baseUrl);
    try {
      const response = await fetch(sourceUrl, { redirect: "manual" });
      if (response.status !== 308) failures.push(`${source} returned ${response.status}, expected 308`);
      const location = response.headers.get("location");
      if (!location || new URL(location, sourceUrl).pathname !== redirect.destination) {
        failures.push(`${source} did not redirect to ${redirect.destination}`);
      }
      const destination = await fetch(new URL(redirect.destination, baseUrl));
      if (destination.status !== 200) {
        failures.push(`${redirect.destination} returned ${destination.status}`);
      }
    } catch (error) {
      failures.push(`${source} redirect verification failed: ${error.message}`);
    }
  }
}

if (!localPreview) {
  try {
    const response = await fetch(new URL("/llms.txt", baseUrl));
    const body = await response.text();
    if (response.status !== 200) failures.push(`/llms.txt returned ${response.status}`);
    for (const expected of ["LangState", "Implementation status"]) {
      if (!body.includes(expected)) failures.push(`/llms.txt does not contain ${expected}`);
    }
    for (const retired of ["OpenAPI Plant Store", "/auth", "/rate-limits", "/writing-content/"]) {
      if (body.includes(retired)) failures.push(`/llms.txt contains retired content: ${retired}`);
    }
  } catch (error) {
    failures.push(`/llms.txt verification failed: ${error.message}`);
  }
}

await browser.close();

if (failures.length > 0) {
  console.error(`Playwright release verification failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  localPreview
    ? "Playwright local verification passed for desktop, mobile, and browser-network responses."
    : "Playwright release verification passed for desktop, mobile, redirects, and llms.txt.",
);
