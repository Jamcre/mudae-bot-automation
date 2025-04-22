import { chromium, Page } from "playwright";
import "dotenv/config";

// Load sensitive credentials and channel information from .env, as CONSTANTS
const DISCORD_EMAIL = process.env.DISCORD_EMAIL!;
const DISCORD_PASSWORD = process.env.DISCORD_PASSWORD!;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID!;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID!;
const DISCORD_CHANNEL_URL = `https://discord.com/channels/${DISCORD_SERVER_ID}/${DISCORD_CHANNEL_ID}`;

/**
 * Automates logging into Discord using the provided email and password.
 * Waits until the server list is visible to confirm successful login.
 */
async function login(page: Page) {
  await page.goto("https://discord.com/login");
  console.log("🔐 Opened Discord login page");

  await page.fill('input[name="email"]', DISCORD_EMAIL);
  await page.fill('input[name="password"]', DISCORD_PASSWORD);
  await page.click('button[type="submit"]');

  // Confirm login by waiting for the sidebar with server icons to appear
  await page.waitForSelector('[aria-label="Servers"]', { timeout: 10000 });
  console.log("✅ Logged in to Discord!");
}

/**
 * Scrapes all messages currently loaded in the chat and filters only those
 * that were sent by the Mudae bot, based on message content format.
 *
 * Returns an array of strings representing the full text content of each Mudae message.
 */
async function getAllMudaeMessages(page: Page) {
  const messages = await page.$$('li[class*="messageListItem"]');
  const mudaeMessages = [];

  for (const msg of messages) {
    const text = await msg.innerText();
    // Mudae bot messages always begin with this label
    if (text.startsWith("Mudae\nAPP\n")) {
      mudaeMessages.push(text);
    }
  }

  return mudaeMessages;
}

/**
 * Waits for a new Mudae message to appear by polling at regular intervals.
 * Compares current messages to the list of known previous ones to detect changes.
 *
 * @param page - The active Playwright page instance
 * @param previousMessages - Array of Mudae messages before sending the command
 * @returns The latest new Mudae message (if found), or null if timeout is reached
 */
async function waitForNewMudaeMessage(page: Page, previousMessages: string[]) {
  const timeout = 10000; // Maximum time to wait for a response (in ms)
  const interval = 500; // Time between polling attempts (in ms)
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const current = await getAllMudaeMessages(page);
    // Identify only the messages that were not present before
    const newOnes = current.filter((msg) => !previousMessages.includes(msg));
    if (newOnes.length > 0) {
      return newOnes.at(-1); // Return the most recent new Mudae message
    }
    await page.waitForTimeout(interval); // Pause before checking again
  }

  return null; // No new messages appeared within the timeout window
}

/**
 * Extracts claim-related information from a Mudae message, including whether
 * claiming is possible right now and the claim cooldown period if applicable.
 *
 * @param message - The text content of a Mudae message to parse
 * @returns An object containing the claim status and claim cooldown period (if any)
 */
function parseClaimInfo(message: string) {
  const canClaim = message.includes("you can claim right now!");
  const claimCooldownMatch = message.match(
    /claim (?:reset is in|for another) ([^\n]+)/i
  );
  const claimCooldown = claimCooldownMatch
    ? claimCooldownMatch[1].trim()
    : null;

  return {
    canClaim,
    claimCooldown,
  };
}

/**
 * Extracts roll-related information from a Mudae message, including the number
 * of rolls left and the time remaining until the next roll reset.
 *
 * @param message - The text content of a Mudae message to parse
 * @returns An object containing the number of rolls left and the time of next reset (if any)
 */
function parseRollInfo(message: string) {
  const rollsMatch = message.match(/You have (\d+) rolls? left/i);
  const rollsResetMatch = message.match(/Next rolls reset in (.+?)\./i);

  const rollsLeft = rollsMatch ? parseInt(rollsMatch[1]) : null;
  const rollsReset = rollsResetMatch ? rollsResetMatch[1] : null;

  return {
    rollsLeft,
    rollsReset,
  };
}

/**
 * Main execution function:
 * - Launches a Playwright browser instance
 * - Logs into Discord
 * - Navigates to the specified server and channel
 * - Sends a $tu command to the Mudae bot
 * - Waits for a new Mudae response and logs it
 */
async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-size=1280,720",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
    ],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page);

  // Navigate to the target server and channel
  await page.goto(DISCORD_CHANNEL_URL);
  await page.waitForSelector('[role="textbox"]', { timeout: 15000 });
  console.log("📨 Entered server/channel");

  // Save the list of current Mudae messages before sending the command
  const previousMessages = await getAllMudaeMessages(page);

  // Send the $tu command to get cooldown info
  await page.fill('[role="textbox"]', "$tu");
  await page.keyboard.press("Enter");
  console.log("📤 Sent command: $tu");

  // Wait for a response from Mudae and capture it
  const newMessage = await waitForNewMudaeMessage(page, previousMessages);

  if (newMessage) {
    console.log("📥 Mudae responded:\n", newMessage);

    const claimInfo = parseClaimInfo(newMessage);
    console.log("🔍 Parsed Claim Info:");
    console.log("✅ Can Claim:", claimInfo.canClaim);
    console.log("⏳ Claim Cooldown:", claimInfo.claimCooldown);

    const rollInfo = parseRollInfo(newMessage);
    console.log("\n🎲 Parsed Roll Info:");
    console.log("🎯 Rolls Left:", rollInfo.rollsLeft);
    console.log("⏰ Rolls Reset In:", rollInfo.rollsReset);
  } else {
    console.log("❌ No new Mudae response found within timeout.");
  }
  // Temporary delay to allow inspection before closing the browser
  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(console.error);
