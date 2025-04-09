# Imports
import os
import time
import platform
import chromedriver_autoinstaller
from dotenv import load_dotenv
from selenium import webdriver
from pyvirtualdisplay import Display
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Constants
load_dotenv()
DISCORD_EMAIL = os.getenv("DISCORD_EMAIL")
DISCORD_PASS = os.getenv("DISCORD_PASS")
DISCORD_CHANNEL = "https://discord.com/channels/756710284298551346/1225299689994321951"

# Check for OS and set display settings accordingly
if platform.system() == "Windows":
    headless_mode = False  # No need for virtual display on Windows
else:
    # Start Display (for headless mode in Linux or macOS)
    display = Display(visible=0, size=(1200, 800))
    display.start()
    headless_mode = True
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
time.sleep(2) # Page-Loading delay
email_field = driver.find_element(by=By.NAME, value="email")
pass_field = driver.find_element(by=By.NAME, value="password")
email_field.send_keys(DISCORD_EMAIL)
pass_field.send_keys(DISCORD_PASS)
time.sleep(2) # Page-Loading delay
submit_button = driver.find_element(by= By.XPATH, value="//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div/div/div/form/div[2]/div/div[1]/div[2]/button[2]")
submit_button.click()

# Discord Navigation
time.sleep(2) # Page-Loading delay
driver.get(DISCORD_CHANNEL)

# # Text Input Automation
time.sleep(3) # Page-Loading delay
channel_text_field = driver.find_element(by=By.XPATH, value="//*[@id='app-mount']/div[2]/div[1]/div[1]/div/div[2]/div/div/div/div[2]/div[2]/div/div/div[3]/main/form/div/div/div[2]/div/div[3]/div/div[2]/div")
channel_text_field.send_keys('$tu')
channel_text_field.send_keys(Keys.ENTER)
# time.sleep(2) # Page-Loading delay
# channel_text_field.send_keys('$daily')
# channel_text_field.send_keys(Keys.ENTER)
# time.sleep(2) # Page-Loading delay
# channel_text_field.send_keys('$dk')
# channel_text_field.send_keys(Keys.ENTER)

# Close Browser
time.sleep(2) # Page-Loading delay
print('Mudae Automation Complete')
driver.quit()


