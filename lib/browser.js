import playwright from "playwright";

/**
 * Browser manager class for handling Cloudflare-protected requests
 * Maintains a persistent browser instance for better performance
 */
export class BrowserManager {
    constructor() {
        this.browser = undefined;
        this.context = undefined;
    }

    /**
     * Launch or reuse existing browser instance
     * @returns {Promise<{browser: Browser, context: BrowserContext}>}
     */
    async launch() {
        if (!this.browser || !this.context) {
            try {
                const executablePath =
                    process.env.BROWSER_PATH && process.env.BROWSER_PATH.trim() !== ""
                        ? process.env.BROWSER_PATH
                        : undefined;

                const launchOptions = {
                    headless: process.env.HEADLESS !== 'false',
                    args: [
                        "--disable-gpu",
                        "--disable-dev-shm-usage",
                        "--disable-setuid-sandbox",
                        "--no-sandbox",
                        "--no-zygote",
                        "--disable-extensions",
                        "--disable-background-timer-throttling",
                        "--disable-backgrounding-occluded-windows",
                        "--disable-renderer-backgrounding",
                    ],
                };

                if (executablePath) {
                    launchOptions.executablePath = executablePath;
                }

                console.log('Launching browser...');
                this.browser = await playwright.chromium.launch(launchOptions);

                this.context = await this.browser.newContext({
                    userAgent:
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                    viewport: { width: 1920, height: 1080 },
                    locale: 'en-US',
                    timezoneId: 'America/New_York',
                });

                console.log('Browser launched successfully');
            } catch (err) {
                this.browser = undefined;
                this.context = undefined;
                console.error("Failed to launch browser or context", err);
                throw err;
            }
        } else {
            // Check if browser is still connected
            if (this.browser.isConnected() === false) {
                console.warn("Browser is not connected, relaunching...");
                this.browser = undefined;
                this.context = undefined;
                return this.launch();
            }

            // Check if context is still valid
            try {
                this.context.pages();
            } catch {
                console.warn("Context is closed, relaunching...");
                this.browser = undefined;
                this.context = undefined;
                return this.launch();
            }
        }

        return { browser: this.browser, context: this.context };
    }

    /**
     * Fetch a URL using the browser to bypass Cloudflare
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<{status: number, headers: Object, buffer: Buffer, text: string}>}
     */
    async fetch(url, options = {}) {
        const { browser, context } = await this.launch();
        const page = await context.newPage();

        try {
            // Set extra headers if provided
            if (options.headers) {
                await page.setExtraHTTPHeaders(options.headers);
            }

            console.log(`Browser fetching: ${url}`);

            // Navigate to the URL
            const response = await page.goto(url, {
                waitUntil: 'networkidle',
                timeout: options.timeout || 30000,
            });

            if (!response) {
                throw new Error('No response received from page');
            }

            const status = response.status();
            const headers = response.headers();
            const buffer = await response.body();
            const text = buffer.toString('utf-8');

            await page.close();

            return { status, headers, buffer, text };
        } catch (error) {
            await page.close();
            throw error;
        }
    }

    /**
     * Close the browser instance
     */
    async close() {
        if (this.browser) {
            try {
                await this.browser.close();
                console.log('Browser closed');
            } catch (err) {
                console.error('Error closing browser:', err);
            }
            this.browser = undefined;
            this.context = undefined;
        }
    }
}

// Singleton instance
let browserInstance = null;

/**
 * Get the singleton browser instance
 * @returns {BrowserManager}
 */
export function getBrowserInstance() {
    if (!browserInstance) {
        browserInstance = new BrowserManager();
    }
    return browserInstance;
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
    process.on('exit', async () => {
        if (browserInstance) {
            await browserInstance.close();
        }
    });

    process.on('SIGINT', async () => {
        if (browserInstance) {
            await browserInstance.close();
        }
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        if (browserInstance) {
            await browserInstance.close();
        }
        process.exit(0);
    });
}
