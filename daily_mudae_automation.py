# Imports
import os
import platform
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pyvirtualdisplay import Display
import chromedriver_autoinstaller

# Constants
load_dotenv()
DISCORD_EMAIL = os.getenv("DISCORD_EMAIL")
DISCORD_PASS = os.getenv("DISCORD_PASS")
DISCORD_CHANNEL = "https://discord.com/channels/756710284298551346/1225299689994321951"

# Check for OS and set display settings accordingly
headless_mode = platform.system() != "Windows"

if headless_mode:
    # Start Display (for headless mode in Linux or macOS)
    display = Display(visible=0, size=(1200, 800))
    display.start()

# Install Chrome driver
chromedriver_autoinstaller.install()

# Chrome options
options = webdriver.ChromeOptions()
options.add_argument("--headless=new" if headless_mode else "")  # Modern headless mode only for non-Windows systems
options.add_argument("--window-size=1200,800")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")

# Create Chrome driver
driver = webdriver.Chrome(options=options)

try:
    # Open Discord Login Page
    driver.get("https://discord.com/login")

    # Discord Log-in
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email"))).send_keys(DISCORD_EMAIL)
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "password"))).send_keys(DISCORD_PASS)
    submit_button = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div/div/div/form/div[2]/div/div[1]/div[2]/button[2]"))
    )
    submit_button.click()
    print(f"Logged in. Current URL: {driver.current_url}")

    # Wait for page to load and navigate to the channel
    WebDriverWait(driver, 10).until(EC.url_contains("https://discord.com/channels/"))
    driver.get(DISCORD_CHANNEL)

    # Wait for the text input field to become active
    channel_text_field = WebDriverWait(driver, 10).until(EC.element_to_be_clickable(
        (By.XPATH, "//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div[2]/div/div/div/div[2]/div[2]/div/div/div[3]/main/form/div/div/div[2]/div/div[3]/div/div[2]/div")
    ))

    # Send messages
    channel_text_field.send_keys('$tu')
    channel_text_field.send_keys(Keys.ENTER)
    print("Sent: $tu")

    WebDriverWait(driver, 2)  # Wait for the message to be sent
    channel_text_field.send_keys('$daily')
    channel_text_field.send_keys(Keys.ENTER)
    print("Sent: $daily")

    WebDriverWait(driver, 2)  # Wait for the message to be sent
    channel_text_field.send_keys('$dk')
    channel_text_field.send_keys(Keys.ENTER)
    print("Sent: $dk")

finally:
    # Close Browser
    print('Mudae Automation Complete')
    driver.quit()

    # Stop virtual display if headless mode was used
    if headless_mode:
        display.stop()
