# Imports
import os
import time
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def load_secrets():
    """Load environment variables for Discord credentials and channel information."""
    load_dotenv()
    return os.getenv("DISCORD_EMAIL"), os.getenv("DISCORD_PASS"), os.getenv("CHANNEL_URL"), os.getenv("CHANNEL_SELECTOR")

def create_driver():
    """Create and configure a headless Chrome WebDriver instance."""
    options = Options()
    options.add_argument("--headless")  # Run in headless mode (no UI)
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=options)
    return driver
    

def navigate_to_discord_channel(driver, email, password, channel_url, channel_selector):
    """
    Log into Discord, navigate to a specified channel, and return the message input field.

    Args:
        driver (webdriver.Chrome): Selenium WebDriver instance.
        email (str): Discord login email.
        password (str): Discord login password.
        channel_url (str): URL of the Discord channel.
        channel_selector (str): CSS selector for the message input field.

    Returns:
        WebElement: The input field WebElement to send messages to.
    """
    driver.get("https://discord.com/login")
    
    wait = WebDriverWait(driver, 10)  # Explicit wait
    email_field = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    pass_field = driver.find_element(by=By.NAME, value="password")
    submit_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div/div/div/form/div[2]/div/div[1]/div[2]/button[2]")))

    email_field.send_keys(email)
    pass_field.send_keys(password)
    submit_button.click()

    wait.until(EC.url_contains("discord.com/channels"))
    driver.get(channel_url)

    channel_text_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, channel_selector)))
    return channel_text_field

def send_commands(channel_text_field):
    """
    Send a predefined list of commands to the Discord channel input field.

    Args:
        channel_text_field (WebElement): The message input field element.
    """
    commands = ['tu', 'daily', 'dk']
    for command in commands:
        channel_text_field.send_keys(command)
        channel_text_field.send_keys(Keys.ENTER)
        time.sleep(3)  # Delay for Bot to register
    print("Commands Succesfully Sent, Mudae Automation Complete")

def main():
    """Main function to run the Mudae Discord automation."""
    email, password, channel_url, channel_selector = load_secrets()

    driver = create_driver()
    channel_text_field = navigate_to_discord_channel(driver, email, password, channel_url, channel_selector)
    send_commands(channel_text_field)

    driver.quit()

if __name__ == "__main__":
    main()