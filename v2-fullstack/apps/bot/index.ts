import { chromium } from "playwright";
import "dotenv/config";

// Constants from .env
const DISCORD_EMAIL = process.env.DISCORD_EMAIL!;
const DISCORD_PASSWORD = process.env.DISCORD_PASSWORD!;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID!;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;
const DISCORD_CHANNEL_URL = `https://discord.com/channels/${DISCORD_SERVER_ID}/${DISCORD_CHANNEL_ID}`;

async function login(page: any) {
  await page.goto("https://discord.com/login");
  console.log("🔐 Opened Discord login page");

  await page.fill('input[name="email"]', DISCORD_EMAIL);
  await page.fill('input[name="password"]', DISCORD_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForSelector('[aria-label="Servers"]', { timeout: 10000 });
  console.log("✅ Logged in to Discord!");
}

async function getAllMudaeMessages(page: any) {
  const messages = await page.$$('li[class*="messageListItem"]');
  const mudaeMessages = [];

  for (const msg of messages) {
    const text = await msg.innerText();
    if (text.startsWith("Mudae\nAPP\n")) {
      mudaeMessages.push(text);
    }
  }

  return mudaeMessages;
}

async function waitForNewMudaeMessage(page: any, previousMessages: string[]) {
  const timeout = 10000;
  const interval = 500;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const current = await getAllMudaeMessages(page);
    const newOnes = current.filter((msg) => !previousMessages.includes(msg));
    if (newOnes.length > 0) return newOnes.at(-1);

    await page.waitForTimeout(interval);
  }

  return null;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);

  // Navigate to channel
  await page.goto(DISCORD_CHANNEL_URL);
  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });
  console.log("📨 Entered server/channel");

  // Capture current Mudae messages
  const previousMessages = await getAllMudaeMessages(page);

  // Send $tu command
  await page.fill('[role="textbox"]', "$tu");
  await page.keyboard.press("Enter");
  console.log("📤 Sent command: $tu");

  // Wait for new message
  const newMessage = await waitForNewMudaeMessage(page, previousMessages);

  if (newMessage) {
    console.log("📥 Mudae responded:\n", newMessage);
  } else {
    console.log("❌ No new Mudae response found within timeout.");
  }

  await page.waitForTimeout(5000); // Optional pause before closing
  await browser.close();
}

main().catch(console.error);
