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

# Constants
load_dotenv()
DISCORD_EMAIL = os.getenv("DISCORD_EMAIL")
DISCORD_PASS = os.getenv("DISCORD_PASS")
DISCORD_CHANNEL = os.getenv("DISCORD_CHANNEL")

options = Options()
options.add_argument("--headless")  # Run in headless mode
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=options)
driver.get("https://discord.com/login")

# Discord Log-in
wait = WebDriverWait(driver, 10)  # Explicit wait
email_field = wait.until(EC.presence_of_element_located((By.NAME, "email")))
pass_field = driver.find_element(by=By.NAME, value="password")
email_field.send_keys(DISCORD_EMAIL)
pass_field.send_keys(DISCORD_PASS)

# Wait for submit button to be clickable and click
submit_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div/div/div/form/div[2]/div/div[1]/div[2]/button[2]")))
submit_button.click()

# Discord Navigation
wait.until(EC.url_contains("discord.com/channels"))
driver.get(DISCORD_CHANNEL)

# Text Input Automation
channel_text_field = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[aria-label='Message #mudae-s3']")))

# Commands to send
messages = ['tu', 'daily', 'dk']
# Loop through Commands
for message in messages:
    channel_text_field.send_keys(message)
    channel_text_field.send_keys(Keys.ENTER)
    time.sleep(3)  # Delay for Bot to register

# Close Browser
print('Mudae Automation Complete')
driver.quit()
