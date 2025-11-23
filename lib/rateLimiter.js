// Rate limiting and validation utilities for the proxy

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per IP

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map();

/**
 * Simple rate limiter
 * @param {string} ip - Client IP address
 * @returns {boolean} - Whether request is allowed
 */
export function checkRateLimit(ip) {
    const now = Date.now();
    const key = ip;

    if (!requestCounts.has(key)) {
        requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    const record = requestCounts.get(key);

    // Reset if window expired
    if (now > record.resetTime) {
        requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    // Check if limit exceeded
    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    // Increment count
    record.count++;
    return true;
}

/**
 * Get client IP from request
 * @param {Request} request - Next.js request object
 * @returns {string} - Client IP
 */
export function getClientIP(request) {
    // Check various headers for IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    return 'unknown';
}

/**
 * Validate URL before proxying
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateProxyUrl(url) {
    if (!url) {
        return { valid: false, error: 'URL is required' };
    }

    // Check if it's a valid URL
    try {
        const urlObj = new URL(url);

        // Only allow http and https
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
        }

        // Block localhost and private IPs (prevent SSRF)
        const hostname = urlObj.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '0.0.0.0' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') ||
            hostname.startsWith('172.19.') ||
            hostname.startsWith('172.20.') ||
            hostname.startsWith('172.21.') ||
            hostname.startsWith('172.22.') ||
            hostname.startsWith('172.23.') ||
            hostname.startsWith('172.24.') ||
            hostname.startsWith('172.25.') ||
            hostname.startsWith('172.26.') ||
            hostname.startsWith('172.27.') ||
            hostname.startsWith('172.28.') ||
            hostname.startsWith('172.29.') ||
            hostname.startsWith('172.30.') ||
            hostname.startsWith('172.31.')
        ) {
            return { valid: false, error: 'Private/local URLs are not allowed' };
        }

        return { valid: true };
    } catch (e) {
        return { valid: false, error: 'Invalid URL format' };
    }
}

/**
 * Clean up old rate limit records
 */
export function cleanupRateLimits() {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(key);
        }
    }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
