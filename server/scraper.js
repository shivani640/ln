const puppeteer = require('puppeteer');

// Function to scrape LinkedIn profile data after logging in
async function scrapeLinkedInProfile(linkedInUrl, linkedInEmail, linkedInPassword) {
  let browser;
  try {
    // Launch a browser (set headless: false for debugging, change to true for production)
    browser = await puppeteer.launch({
      headless: false, // Change to true once confirmed working
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 30000, // Increase timeout for browser launch
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to LinkedIn login page
    console.log('Navigating to LinkedIn login page...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2', timeout: 15000 });

    // Log in to LinkedIn
    console.log('Logging in to LinkedIn...');
    await page.type('#username', linkedInEmail);
    await page.type('#password', linkedInPassword);
    await page.click('[aria-label="Sign in"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    // Check if login was successful
    const errorMessage = await page.$('.error');
    if (errorMessage) {
      throw new Error('Login failed. Please check your LinkedIn email and password.');
    }

    // Navigate to the target profile URL
    console.log('Navigating to target profile URL:', linkedInUrl);
    await page.goto(linkedInUrl, { waitUntil: 'networkidle2', timeout: 15000 });

    // Wait for profile data to load (max 2 seconds for faster scraping)
    await page.waitForSelector('h1.text-heading-xlarge', { timeout: 2000 }).catch(() => {
      console.log('Profile data selector not found within 2 seconds, proceeding with available data.');
    });

    // Extract profile data
    console.log('Extracting profile data...');
    const profileData = await page.evaluate(() => {
      const name = document.querySelector('h1.text-heading-xlarge')?.innerText?.trim() || 'Unknown';
      const headline = document.querySelector('div.text-body-medium.break-words')?.innerText?.trim() || 'No Headline';
      const summary = document.querySelectorAll('div.text-body-medium.break-words')[1]?.innerText?.trim() || 'No Summary';
      const experience = [];
      const skills = [];

      // Extract experience
      document.querySelectorAll('section#experience ~ div > ul > li').forEach(elem => {
        const role = elem.querySelector('span')?.innerText?.trim();
        if (role) experience.push(role);
      });

      // Extract skills
      document.querySelectorAll('section#skills ~ div > ul > li').forEach(elem => {
        const skill = elem.querySelector('span')?.innerText?.trim();
        if (skill) skills.push(skill);
      });

      return {
        name: name || 'Unknown',
        headline: headline || 'No Headline',
        summary: summary || 'No Summary',
        experience: experience.length ? experience : ['None'],
        skills: skills.length ? skills : ['None'],
      };
    });

    // Close the browser immediately after scraping
    console.log('Closing browser...');
    await browser.close();
    return profileData;
  } catch (error) {
    if (browser) await browser.close();
    console.error('Scraping error:', error.message);
    throw new Error(`Failed to scrape profile: ${error.message}. Ensure the LinkedIn email, password, and URL are correct.`);
  }
}

module.exports = { scrapeLinkedInProfile };