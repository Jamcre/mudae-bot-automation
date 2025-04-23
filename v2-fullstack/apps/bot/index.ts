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
 * Parses a Mudae message to determine if the daily command ($daily) is available.
 * If it's not available, extracts the cooldown time until it can be used again.
 *
 * @param message - The text content of a Mudae message to parse
 * @returns An object indicating whether $daily can be used and the cooldown time (if any)
 */
function parseDailyInfo(message: string) {
  const dailyAvailableRegex = /\$daily is available!?/i;
  const dailyCooldownRegex = /Next \$daily reset in (.+?)\./i;

  let canUseDaily = false;
  let dailyCooldown: string | null = null;

  if (dailyAvailableRegex.test(message)) {
    canUseDaily = true;
  } else {
    const match = message.match(dailyCooldownRegex);
    if (match) {
      dailyCooldown = match[1];
    }
  }

  return {
    canUseDaily,
    dailyCooldown,
  };
}

/**
 * Parses a Mudae message to check if the $dk command (daily kakera) is ready.
 * If it's on cooldown, extracts the remaining time until it resets.
 *
 * @param message - The text content of a Mudae message to parse
 * @returns An object indicating whether $dk is available and the cooldown time (if any)
 */
function parseDkInfo(message: string) {
  const dkReadyRegex = /\$dk is ready!?/i;
  const dkCooldownRegex = /Next \$dk in (.+?)\./i;

  let canUseDk = false;
  let dkCooldown: string | null = null;

  if (dkReadyRegex.test(message)) {
    canUseDk = true;
  } else {
    const match = message.match(dkCooldownRegex);
    if (match) {
      dkCooldown = match[1];
    }
  }

  return {
    canUseDk,
    dkCooldown,
  };
}

/**
 * Parses a Mudae message to check if the $rt command (react reset timer) is available.
 * If it's on cooldown, extracts the remaining time until it resets.
 *
 * @param message - The text content of a Mudae message to parse
 * @returns An object indicating whether $rt is available and the cooldown time (if any)
 */
function parseRtInfo(message: string) {
  const rtAvailableRegex = /\$rt is available!?/i;
  const rtCooldownRegex =
    /The cooldown of \$rt is not over\. Time left: (.+?) \(\$rtu\)/i;

  let canUseRt = false;
  let rtCooldown: string | null = null;

  if (rtAvailableRegex.test(message)) {
    canUseRt = true;
  } else {
    const match = message.match(rtCooldownRegex);
    if (match) {
      rtCooldown = match[1];
    }
  }

  return {
    canUseRt,
    rtCooldown,
  };
}

/**
 * Parses a Mudae message to determine if voting is currently available.
 * If not, extracts the cooldown time remaining until the next eligible vote.
 *
 * @param message - The text content of a Mudae message to parse
 * @returns An object indicating whether voting is available and the cooldown time (if any)
 */
function parseVoteInfo(message: string) {
  const voteAvailableRegex = /You may vote right now!?/i;
  const voteCooldownRegex = /You may vote again in (.+?)\./i;

  let canVote = false;
  let voteCooldown: string | null = null;

  if (voteAvailableRegex.test(message)) {
    canVote = true;
  } else {
    const match = message.match(voteCooldownRegex);
    if (match) {
      voteCooldown = match[1];
    }
  }

  return {
    canVote,
    voteCooldown,
  };
}

/**
 * Parses all relevant cooldown info from a Mudae message in one call.
 *
 * @param message - The full Mudae response text
 * @returns An object containing cooldown info for claim, rolls, $daily, $dk, $rt, and $vote
 */
function parseAllCooldowns(message: string) {
  return {
    claim: parseClaimInfo(message),
    rolls: parseRollInfo(message),
    daily: parseDailyInfo(message),
    dk: parseDkInfo(message),
    rt: parseRtInfo(message),
    vote: parseVoteInfo(message),
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

    const allCooldowns = parseAllCooldowns(newMessage);

    console.log("\n🧩 Unified Cooldown Info:");
    console.log("\n🔍 Claim Info:");
    console.log("✅ Can Claim:", allCooldowns.claim.canClaim);
    console.log("⏳ Claim Cooldown:", allCooldowns.claim.claimCooldown);

    console.log("\n🎲 Roll Info:");
    console.log("🎯 Rolls Left:", allCooldowns.rolls.rollsLeft);
    console.log("⏰ Rolls Reset In:", allCooldowns.rolls.rollsReset);

    console.log("\n📅 $daily Info:");
    console.log("🔁 Can Use $daily:", allCooldowns.daily.canUseDaily);
    console.log("⏳ Daily Cooldown:", allCooldowns.daily.dailyCooldown);

    console.log("\n🐉 $dk Info:");
    console.log("✅ Can Use $dk:", allCooldowns.dk.canUseDk);
    console.log("⏳ $dk Cooldown:", allCooldowns.dk.dkCooldown);

    console.log("\n⚡ $rt Info:");
    console.log("✅ Can Use $rt:", allCooldowns.rt.canUseRt);
    console.log("⏳ $rt Cooldown:", allCooldowns.rt.rtCooldown);

    console.log("\n🗳️ $vote Info:");
    console.log("✅ Can Vote:", allCooldowns.vote.canVote);
    console.log("⏳ Vote Cooldown:", allCooldowns.vote.voteCooldown);
  } else {
    console.log("❌ No new Mudae response found within timeout.");
  }

  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch(console.error);
