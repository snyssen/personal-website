import { chromium } from "playwright";

(async () => {
  console.log("Starting resume PDF generation.");

  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    process.env.PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH;
  const args = ["--no-sandbox", "--disable-setuid-sandbox"];

  const browser = await chromium.launch({
    executablePath: executablePath,
    args: args,
  });
  const page = await browser.newPage();

  // Remove deferred loading of plausible script because it is blocked in CI
  await page.route("https://plausible.snyssen.be/**", async (route) => {
    console.debug("Aborting route", route.request().url());
    await route.abort();
  });

  await page.goto("http://localhost:4321/resume", {
    waitUntil: "load",
    timeout: 60 * 1000,
  });

  console.log("Resume page loaded, removing components...");
  const header = page.locator("header");
  await header.evaluate((node) => (node.style.display = "none"));

  const downloadButton = page.locator("a#resume-download");
  await downloadButton.evaluate((node) => (node.style.display = "none"));

  const footer = page.locator("footer");
  await footer.evaluate((node) => (node.style.display = "none"));

  console.log("Generating PDF...");
  await page.pdf({
    path: "dist/client/resume.pdf",
    margin: {
      top: "24px",
      bottom: "24px",
    },
    printBackground: true,
  });

  console.log(
    "Resume PDF generated at dist/client/resume.pdf. Closing Playwright browser..."
  );
  await browser.close();
  console.log("Done!");
})();
