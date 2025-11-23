// Centralized configuration file - No environment variables needed
// All configuration is hardcoded here for simplicity

const config = {
  // Server configuration
  host: '127.0.0.1',
  port: 8080,
  publicUrl: 'http://127.0.0.1:8080',
  
  // Redis configuration for caching (Upstash)
  redis: {
    url: 'https://easy-dassie-30340.upstash.io',
    token: 'AXaEAAIncDJlNTY5YWM4NWQ5ZGE0Mzg1YTljY2ZiOThiZTA3YzE0MHAyMzAzNDA',
  },
  
  // HiAnime API configuration
  baseurl: 'https://hianime.to',
  
  // Domain-specific referer mappings
  // Automatically adds the correct referer header based on URL patterns
  domainReferers: {
    'megaplay.buzz': 'https://megaplay.buzz/',
    'megacloud.club': 'https://megacloud.club/',
    'vidwish.live': 'https://vidwish.live/',
    'streamwish.to': 'https://streamwish.to/',
    'dotstream.buzz': 'https://dotstream.buzz/',
    'cdn.dotstream.buzz': 'https://dotstream.buzz/',
    'tubeplx.viddsn.cfd': 'https://tubeplx.viddsn.cfd/',
  },
  
  // Allowed domains for proxying
  allowedDomains: [
    'streamwish.to',
    'vidwish.live',
    'megaplay.buzz',
    'megacloud.club',
    'youtube.com',
    'youtu.be',
    'vimeo.com',
    'twitter.com',
    'x.com',
    'tubeplx.viddsn.cfd',
    'dotstream.buzz',
    'cdn.dotstream.buzz'
  ],
  
  // Default placeholder image for video thumbnails
  dataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAgAElEQVR4Xu3dCXwU9d3H8f8e2ZwkJCEQrgCCoKBVQURRq6Lg8aCVVut9tdbbVq21XvWq973rX+69YRQFAURHkvnNgMsmXQYNgUs6WN',
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
    
    // Check for subdomain match (e.g., cdn.dotstream.buzz -> dotstream.buzz)
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
