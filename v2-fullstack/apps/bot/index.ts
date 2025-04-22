import { chromium } from "playwright";
import "dotenv/config";

const EMAIL = process.env.DISCORD_EMAIL!;
const PASSWORD = process.env.DISCORD_PASSWORD!;
const SERVER_ID = process.env.DISCORD_SERVER_ID!;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;

async function main() {
  // Browser preparation
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Discord's login page
  await page.goto("https://discord.com/login");
  console.log("Opened Discord login page");

  // Enter credentials and click submit button
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for server icons to appear (indicates login success)
  await page.waitForSelector('[aria-label="Servers"]', { timeout: 10000 });
  console.log("✅ Logged in to Discord!");

  await page.goto(`https://discord.com/channels/${SERVER_ID}/${CHANNEL_ID}`);

  // Wait for message box to appear
  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });
  console.log("✅ Ready to send commands!");

  // Type and send '$tu', timers up, Mudae command
  await page.fill('[role="textbox"]', "$tu");
  await page.keyboard.press("Enter");
  console.log("📤 Sent command: $tu");

  // Wait to see what's going on before closing (for now)
  await page.waitForTimeout(30000);
  await browser.close();
}

main().catch(console.error);
