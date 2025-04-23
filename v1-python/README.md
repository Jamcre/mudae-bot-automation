# 🌀 Daily Mudae Automation

Automate daily Mudae bot interactions on Discord using Selenium.

This script logs into Discord, navigates to a specified channel, and executes daily commands (`$tu`, `$daily`, `$dk`) with logging, execution tracking, and optional Git-based log pushing.

## 📂 Project Structure

## ⚙️ Features

- Headless Chrome automation with Selenium
- Logs into Discord and sends predefined bot commands
- Execution counter to monitor script runs
- Git integration to auto-push logs every 50 executions
- Robust logging for debugging and monitoring

## 🚀 Setup & Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/mudae-automation.git
   cd mudae-automation
   ```

2. **Install dependencies:**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Create a `.env` file with your credentials:**:

   ```env
   DISCORD_EMAIL=[YOUR DISCORD EMAIL]
   DISCORD_PASS=[YOUR DISCORD PASSWORD]
   CHANNEL_URL=[URL OF THE DISCORD CHANNEL WHERE MUDAE IS]
   CHANNEL_SELECTOR="[aria-label='Message {NAME OF THE DISCORD CHANNEL WHERE MUDAE IS}']"
   ```

4. **Run the script:**:

   ```bash
   python daily_mudae_automation.py
   ```

## 📝 Logs & Tracking

- Logs are saved to `mudae_automation.log`.
- Script runs are counted in `execution_count.txt`.
- Every 50 executions, logs and counter are committed and pushed via Git (if repo is initialized and remote is set).

## 🛡️ Security Notes

- Never share your `.env` file or Discord credentials.
- Consider creating a separate Discord account with limited permissions for bot interaction.
- Use a dedicated environment or virtual machine for automation to reduce risk.

## 🛠️ Troubleshooting

- **WebDriver Issues**: Make sure `chromedriver` matches your installed version of Chrome.
- **Login Fails**: Double-check credentials and 2FA status (this script doesn’t handle 2FA).
- **Selector Not Found**: Ensure `CHANNEL_SELECTOR` matches your Discord layout — Discord UI may change.
