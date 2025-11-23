// Centralized configuration - uses environment variables with fallbacks
const config = {
    // Server configuration
    publicUrl: process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000',

    // Domain-specific referer mappings
    domainReferers: {
        'megaplay.buzz': 'https://megaplay.buzz/',
        'megacloud.club': 'https://megacloud.club/',
        'vidwish.live': 'https://vidwish.live/',
        'streamwish.to': 'https://streamwish.to/',
        'dotstream.buzz': 'https://dotstream.buzz/',
        'cdn.dotstream.buzz': 'https://dotstream.buzz/',
        'tubeplx.viddsn.cfd': 'https://tubeplx.viddsn.cfd/',
        'youtube.com': 'https://www.youtube.com/',
        'youtu.be': 'https://www.youtube.com/',
        'googlevideo.com': 'https://www.youtube.com/',
        'watching.onl': 'https://watching.onl/',
        'fxpy7.watching.onl': 'https://watching.onl/',
    },

    // Allowed domains for proxying (empty array = allow all)
    allowedDomains: [],
};

// Helper function to get referer for a URL
export function getRefererForUrl(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Check for exact match
        if (config.domainReferers[hostname]) {
            return config.domainReferers[hostname];
        }

        // Check for subdomain match
        for (const [domain, referer] of Object.entries(config.domainReferers)) {
            if (hostname.endsWith(domain) || domain.endsWith(hostname.split('.').slice(-2).join('.'))) {
                return referer;
            }
        }

        return null;
    } catch (error) {
        console.error('Error parsing URL for referer:', error);
        return null;
    }
}

export default config;
