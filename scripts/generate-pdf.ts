import { chromium } from 'playwright';

(async () => {
    console.log('Starting resume PDF generation.');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('http://127.0.0.1:3000/resume', { waitUntil: 'networkidle' });

    console.log('Resume page loaded, removing components...');
    const header = page.locator('header');
    await header.evaluate((node) => (node.style.display = 'none'));

    const downloadButton = page.locator('a#resume-download');
    await downloadButton.evaluate((node) => (node.style.display = 'none'));

    const footer = page.locator('footer');
    await footer.evaluate((node) => (node.style.display = 'none'));

    console.log('Generating PDF...');
    await page.pdf({
        path: 'public/resume.pdf',
        margin: {
            top: '50px',
            bottom: '80px',
        },
        printBackground: true,
    });

    console.log('Resume PDF generated at public/resume.pdf. Closing Playwright browser...');
    await browser.close();
    console.log('Done!');
})();
