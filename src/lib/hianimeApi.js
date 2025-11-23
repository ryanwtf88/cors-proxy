import axios from "axios";
import config from "./config.js";

// Animo API - Primary API for fetching streams
const ANIMO_API_BASE = "https://api-animo.vercel.app/api/v1";
const HIANIME_BASE = config.baseurl;

/**
 * Fetch episode streaming sources from Hianime using Animo API
 * @param {string} episodeId - The Hianime episode ID (numeric, e.g., "136197" or full like "my-hero-academia-19544?ep=136197")
 * @param {string} language - Language preference (sub/dub)
 * @returns {Promise<object>} Stream sources
 */
export async function getEpisodeStreams(episodeId, language = 'sub') {
  // Check if episodeId already includes anime slug (e.g., "my-hero-academia-19544?ep=136197")
  const hasAnimeSlug = episodeId.includes('?ep=');
  let cleanEpisodeId = episodeId;
  
  if (hasAnimeSlug) {
    // Already has anime slug, use as is
    cleanEpisodeId = episodeId;
  } else {
    // Only has episode number, need to search for anime
    cleanEpisodeId = episodeId.split('?ep=').pop();
  }
  
  console.log(`Fetching streams for episode ID: ${cleanEpisodeId}, language: ${language}`);
  
  // Method 1: If we have anime slug, try directly
  if (hasAnimeSlug) {
    const servers = ['hd-1', 'hd-2', 'megacloud'];
    for (const server of servers) {
      try {
        const result = await tryAnimoAPIWithFullId(cleanEpisodeId, language, server);
        if (result.success) return result;
      } catch (error) {
        console.error(`Server ${server} failed:`, error.message);
      }
    }
  } else {
    // Method 2: Try to find anime info and construct full ID
    try {
      const result = await searchAndGetStream(cleanEpisodeId, language);
      if (result.success) return result;
    } catch (error) {
      console.error('Search method failed:', error.message);
    }
  }
  
  // All methods failed, return detailed error
  console.log('All API methods failed');
  return {
    success: false,
    error: 'Unable to fetch stream from Hianime API',
    message: 'Failed to fetch stream. The episode may not be available or the API is down.',
    note: 'Example format: my-hero-academia-19544?ep=136197 or just episode number',
    providedId: episodeId,
    streamUrl: null,
    referer: '',
    tracks: []
  };
}

/**
 * Search for anime and get stream
 */
async function searchAndGetStream(episodeId, language) {
  // For now, we'll try common anime patterns
  // In production, you'd want to implement a proper search/mapping
  const commonAnimes = [
    { name: 'my-hero-academia', id: '19544' },
    { name: 'one-piece', id: '100' },
    { name: 'naruto-shippuden', id: '1735' },
    // Add more as needed
  ];
  
  // Try with default format (this will likely fail but worth trying)
  for (const server of ['hd-1', 'hd-2']) {
    try {
      const result = await tryAnimoAPIWithFullId(`anime-${episodeId}?ep=${episodeId}`, language, server);
      if (result.success) return result;
    } catch (error) {
      // Continue to next attempt
    }
  }
  
  throw new Error('Could not determine anime slug from episode ID alone');
}

/**
 * Try Animo API with full ID (anime-slug?ep=episode-number)
 */
async function tryAnimoAPIWithFullId(fullId, language, server) {
  const url = `${ANIMO_API_BASE}/stream?id=${fullId}&server=${server}&type=${language}`;
  console.log(`Trying Animo API with full ID: ${url}`);
  
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Referer': 'https://hianime.to/',
    }
  });

  if (!response.data || !response.data.success) {
    throw new Error(response.data?.message || 'No data in response');
  }

  const data = response.data.data;
  
  if (!data.link || !data.link.file) {
    throw new Error('No stream URL in response');
  }

  return {
    success: true,
    streamUrl: data.link.file,
    referer: 'https://hianime.to/',
    tracks: data.tracks || [],
    intro: data.intro || {},
    outro: data.outro || {},
    server: data.server || server
  };
}



/**
 * Get episode info
 */
export async function getEpisodeInfo(episodeId) {
  try {
    const url = `${HIANIME_API_BASE}/episodes/${episodeId}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching episode info:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
