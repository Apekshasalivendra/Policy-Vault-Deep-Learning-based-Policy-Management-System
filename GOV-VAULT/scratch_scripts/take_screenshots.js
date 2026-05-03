const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const screenshotsDir = '../screenshots';
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

    console.log('Capturing Landing Page...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: `${screenshotsDir}/1_landing_page.png`, fullPage: true });

    console.log('Capturing Login Page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: `${screenshotsDir}/2_login_page.png`, fullPage: true });

    console.log('Capturing Register Page...');
    await page.goto('http://localhost:3001/register', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: `${screenshotsDir}/3_register_page.png`, fullPage: true });

    console.log('Logging in as User...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'saigowthampeddinti@gmail.com');
    await page.type('input[type="password"]', 'ap22110010520');
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    console.log('Capturing Dashboard Page...');
    await new Promise(r => setTimeout(r, 2000)); // Wait for data to load
    await page.screenshot({ path: `${screenshotsDir}/4_dashboard_page.png`, fullPage: true });

    console.log('Capturing Apply Page...');
    await page.goto('http://localhost:3001/apply', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: `${screenshotsDir}/5_apply_page.png`, fullPage: true });

    console.log('Capturing Recommendations Page...');
    await page.goto('http://localhost:3001/recommendations', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 5000)); // Wait for AI to fetch
    await page.screenshot({ path: `${screenshotsDir}/6_recommendations_page.png`, fullPage: true });

    console.log('Capturing Claims Page...');
    await page.goto('http://localhost:3001/claims', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `${screenshotsDir}/7_claims_page.png`, fullPage: true });

    console.log('Logging out...');
    const logoutButton = await page.$('button[class*="text-red"]'); // Adjust selector if needed
    if (logoutButton) {
        await Promise.all([
            logoutButton.click(),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    } else {
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    }

    // Try Admin Login (assuming admin123 as a default, ignore if it fails)
    console.log('Trying Admin Login...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@govvault.in');
    await page.type('input[type="password"]', 'admin123'); // Assuming default password
    await page.click('button[type="submit"]');
    
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
        console.log('Capturing Admin Dashboard...');
        await page.screenshot({ path: `${screenshotsDir}/8_admin_dashboard.png`, fullPage: true });
        
        console.log('Capturing Admin Families...');
        await page.goto('http://localhost:3001/admin/families', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: `${screenshotsDir}/9_admin_families.png`, fullPage: true });
    } catch(e) {
        console.log('Admin login failed or timed out, skipping admin screenshots.');
    }

    await browser.close();
    console.log('Done!');
}

run();
