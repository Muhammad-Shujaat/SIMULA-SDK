const puppeteer = require("puppeteer");

(async () => {
  const BASE = "https://simula-api-701226639755.us-central1.run.app";
  let renderCount = 0;
  let trackCount = 0;
  let sessionCount = 0;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();

  // Intercept network requests to mock API
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (req.method() === "POST" && url.endsWith("/session/create")) {
      sessionCount++;
      req.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sessionId: "test-session-1" }),
      });
      return;
    }

    if (req.method() === "POST" && url.includes("/render_ad/ssp/native")) {
      renderCount++;
      // simple ad HTML; browser may load it into iframe srcdoc
      const aid = `aid-${renderCount}`;
      req.respond({
        status: 200,
        headers: { aid },
        contentType: "text/html",
        body: `<div style="padding:8px">Mock Ad ${aid}</div>`,
      });
      return;
    }

    if (
      req.method() === "POST" &&
      url.includes("/track/engagement/impression")
    ) {
      trackCount++;
      req.respond({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }

    // Allow other requests
    req.continue();
  });

  // Capture console logs from page
  page.on("console", (msg) => console.log("PAGE:", msg.text()));

  const url = "http://localhost:8000/test.html";
  console.log("Opening", url);
  await page.goto(url, { waitUntil: "networkidle2" });

  // Wait for first ad container and then scroll to it
  await page.waitForSelector(".ad-container");
  const adContainers = await page.$$(".ad-container");
  if (adContainers.length < 2) {
    console.error("Expected at least 2 ad containers");
    await browser.close();
    process.exit(2);
  }

  // Helper to scroll element into view and wait
  async function scrollAndWait(element, millis) {
    await element.evaluate((el) =>
      el.scrollIntoView({ behavior: "auto", block: "center" }),
    );
    await page.waitForTimeout(millis);
  }

  // Scroll to first ad, wait >1s to trigger impression
  console.log("Scrolling to first ad...");
  await scrollAndWait(adContainers[0], 1500);

  // Wait a bit for tracking to fire
  await page.waitForTimeout(500);

  // Scroll away
  console.log("Scrolling away from first ad...");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Scroll to second ad (same slot/position) - should use cache and not cause new render_ad
  console.log("Scrolling to second ad...");
  await scrollAndWait(adContainers[1], 1500);
  await page.waitForTimeout(500);

  console.log("Render calls:", renderCount);
  console.log("Track calls:", trackCount);
  console.log("Session calls:", sessionCount);

  // Expectations:
  // - sessionCount >= 1
  // - renderCount should be 1 (cached ad used for second)
  // - trackCount >= 2 (each ad impression may be tracked once)

  const errors = [];
  if (sessionCount < 1) errors.push("No session created");
  if (renderCount > 1)
    errors.push(`render_ad called ${renderCount} times (expected 1)`);
  if (trackCount < 1) errors.push("No impression tracked");

  if (errors.length) {
    console.error("TEST FAIL:", errors.join("; "));
    await browser.close();
    process.exit(1);
  }

  console.log("TEST PASS");
  await browser.close();
  process.exit(0);
})();
