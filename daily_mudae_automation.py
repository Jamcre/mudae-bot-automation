# Imports
import os
import time
import chromedriver_autoinstaller
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Constants
load_dotenv()
DISCORD_EMAIL = os.getenv("DISCORD_EMAIL")
DISCORD_PASS = os.getenv("DISCORD_PASS")
DISCORD_CHANNEL = "https://discord.com/channels/756710284298551346/1225299689994321951"

# Install Chrome driver
chromedriver_autoinstaller.install()

# Chrome options
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")  # Modern headless mode
options.add_argument("--window-size=1200,800")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")

# Create Chrome driver
driver = webdriver.Chrome(options=options)
driver.get("https://discord.com/login")

# Discord Log-in
wait = WebDriverWait(driver, 15)  # Explicit wait increased to 15 seconds

try:
    email_field = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    pass_field = driver.find_element(by=By.NAME, value="password")
    email_field.send_keys(DISCORD_EMAIL)
    pass_field.send_keys(DISCORD_PASS)

    # Wait for submit button to be clickable and click
    submit_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div/div/div/form/div[2]/div/div[1]/div[2]/button[2]")))
    submit_button.click()

    print("Login submitted, waiting for next steps...")

    # Wait for any sign of login success
    try:
        # Look for the profile icon or a page element that signifies being logged in
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[aria-label='User Settings']")))  # Profile icon
        print("Login successful!")
    except Exception as e:
        print("Login failed or took too long. Error:", str(e))
        # Take a screenshot of the failed login attempt for further analysis
        driver.save_screenshot("login_attempt.png")
        print("Screenshot taken after login attempt.")
        # Additional step: Check if there's a CAPTCHA or other issue
        try:
            captcha_element = driver.find_element(By.XPATH, "//*[text()='I am human']")
            print("Captcha detected: Please resolve manually.")
        except:
            print("No CAPTCHA detected, but login still failed.")
        driver.quit()
        exit(1)

except Exception as e:
    print("Error during login process:", str(e))
    # Take a screenshot of the failed login attempt for further analysis
    driver.save_screenshot("login_attempt.png")
    print("Screenshot taken after login attempt.")
    driver.quit()
    exit(1)

# Discord Navigation
driver.get(DISCORD_CHANNEL)

# Text Input Automation
channel_text_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[aria-label='Message #mudae-s3']")))
channel_text_field.send_keys('$tu')
channel_text_field.send_keys(Keys.ENTER)

# Send next messages
channel_text_field.send_keys('$daily')
channel_text_field.send_keys(Keys.ENTER)

channel_text_field.send_keys('$dk')
channel_text_field.send_keys(Keys.ENTER)

# Close Browser
print('Mudae Automation Complete')
driver.quit()
