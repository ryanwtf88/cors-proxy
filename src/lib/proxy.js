import axios from "axios";
import https from "node:https";
import http from "node:http";
import config, { getRefererForUrl } from "./config.js";

const web_server_url = config.publicUrl;
const ALLOWED_DOMAINS = config.allowedDomains;

function isM3U8(url, contentType) {
  return url.includes('.m3u8') || contentType?.includes('mpegurl') || contentType?.includes('m3u8');
}

function isDirectMedia(url, contentType) {
  const mediaExtensions = ['.mp4', '.webm', '.mp3', '.ts', '.m4s'];
  const mediaTypes = ['video/mp4', 'video/webm', 'audio/mpeg', 'video/mp2t', 'audio/mp4'];
  return mediaExtensions.some(ext => url.includes(ext)) || 
         mediaTypes.some(type => contentType?.includes(type));
}

export default async function proxyM3U8(url, headers, res) {
  if (!url) {
    res.writeHead(400, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    });
    res.end("URL is required");
    return;
  }

  // Set CORS headers immediately
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  // Automatically add referer based on URL if not already present
  const autoReferer = getRefererForUrl(url);
  if (autoReferer && !headers.referer && !headers.Referer) {
    headers.referer = autoReferer;
    console.log(`Auto-added referer: ${autoReferer} for URL: ${url}`);
  }

  // Build request headers
  const requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    ...headers,
  };

  console.log(`Proxying URL: ${url}`);
  console.log(`Request Headers:`, requestHeaders);

  const req = await axios(url, {
    headers: requestHeaders,
    responseType: 'arraybuffer',
    validateStatus: () => true,
    timeout: 30000,
    maxRedirects: 5,
  }).catch((err) => {
    console.error(`Error fetching URL ${url}:`, err.message);
    const errorHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Content-Type': 'application/json'
    };
    res.writeHead(500, errorHeaders);
    res.end(JSON.stringify({
      error: 'Failed to fetch stream',
      message: err.message,
      url: url
    }));
    return null;
  });
  
  if (!req) {
    return;
  }

  // Check for error status codes
  if (req.status >= 400) {
    console.error(`HTTP ${req.status} error for URL: ${url}`);
    const errorHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Content-Type': 'application/json'
    };
    res.writeHead(req.status, errorHeaders);
    res.end(JSON.stringify({
      error: `HTTP ${req.status} error`,
      message: 'Failed to load stream. The source may be unavailable or require different authentication.',
      url: url
    }));
    return;
  }

  const contentType = req.headers['content-type'];
  
  // Log for debugging
  console.log(`Proxying URL: ${url}`);
  console.log(`Content-Type: ${contentType}`);
  
  if (isDirectMedia(url, contentType) && !isM3U8(url, contentType)) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Expose-Headers': '*',
      'Content-Type': contentType || 'application/octet-stream',
    };
    
    if (req.headers['content-length']) {
      corsHeaders['Content-Length'] = req.headers['content-length'];
    }
    if (req.headers['accept-ranges']) {
      corsHeaders['Accept-Ranges'] = req.headers['accept-ranges'];
    }
    if (req.headers['content-range']) {
      corsHeaders['Content-Range'] = req.headers['content-range'];
    }
    
    res.writeHead(req.status || 200, corsHeaders);
    res.end(Buffer.from(req.data));
    return;
  }
  const m3u8Text = Buffer.from(req.data).toString('utf-8');
  const m3u8 = m3u8Text.trim();
  
  // Check if it's a master playlist (contains resolution info)
  if (m3u8.includes("RESOLUTION=") || m3u8.includes("#EXT-X-STREAM-INF")) {
    const lines = m3u8.split("\n");
    const newLines = [];
    for (const line of lines) {
      if (line.startsWith("#")) {
        if (line.startsWith("#EXT-X-KEY:")) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch) {
            const keyUrl = uriMatch[1];
            let finalKeyUrl = keyUrl;
            if (!keyUrl.startsWith('http://') && !keyUrl.startsWith('https://')) {
              const uri = new URL(keyUrl, url);
              finalKeyUrl = uri.href;
            }
            const proxyKeyUrl = `${web_server_url}/ts-proxy?url=${encodeURIComponent(finalKeyUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
            newLines.push(line.replace(uriMatch[1], proxyKeyUrl));
          } else {
            newLines.push(line);
          }
        } else if (line.startsWith("#EXT-X-MEDIA:") && line.includes("URI=")) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch) {
            const mediaUrl = uriMatch[1];
            let finalMediaUrl = mediaUrl;
            if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
              const uri = new URL(mediaUrl, url);
              finalMediaUrl = uri.href;
            }
            const proxyMediaUrl = `${web_server_url}/proxy?url=${encodeURIComponent(finalMediaUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
            newLines.push(line.replace(uriMatch[1], proxyMediaUrl));
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else if (line.trim() && !line.startsWith("#")) {
        // Handle relative and absolute URLs
        let finalUrl;
        try {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
            finalUrl = trimmedLine;
          } else {
            const uri = new URL(trimmedLine, url);
            finalUrl = uri.href;
          }
          newLines.push(
            `${web_server_url}/proxy?url=${encodeURIComponent(finalUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`
          );
        } catch (e) {
          console.error(`Error processing URL: ${line}`, e);
          newLines.push(line); // Keep original if processing fails
        }
      } else {
        newLines.push(line);
      }
    }

    [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Allow-Credentials",
      "Access-Control-Expose-Headers",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "Origin",
      "Vary",
      "Referer",
      "Server",
      "x-cache",
      "via",
      "x-amz-cf-pop",
      "x-amz-cf-id",
    ].map((header) => res.removeHeader(header));

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");

    res.end(newLines.join("\n"));
    return;
  } else {
    const lines = m3u8.split("\n");
    const newLines = [];
    for (const line of lines) {
      if (line.startsWith("#")) {
        if (line.startsWith("#EXT-X-KEY:")) {
          const uriMatch = line.match(/URI="([^"]+)"/);
          if (uriMatch) {
            const keyUrl = uriMatch[1];
            let finalKeyUrl = keyUrl;
            if (!keyUrl.startsWith('http://') && !keyUrl.startsWith('https://')) {
              const uri = new URL(keyUrl, url);
              finalKeyUrl = uri.href;
            }
            const proxyKeyUrl = `${web_server_url}/ts-proxy?url=${encodeURIComponent(finalKeyUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
            newLines.push(line.replace(uriMatch[1], proxyKeyUrl));
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else if (line.trim() && !line.startsWith("#")) {
        // Handle relative and absolute URLs
        let finalUrl;
        try {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
            finalUrl = trimmedLine;
          } else {
            const uri = new URL(trimmedLine, url);
            finalUrl = uri.href;
          }
          newLines.push(
            `${web_server_url}/ts-proxy?url=${encodeURIComponent(finalUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`
          );
        } catch (e) {
          console.error(`Error processing TS URL: ${line}`, e);
          newLines.push(line); // Keep original if processing fails
        }
      } else {
        newLines.push(line);
      }
    }

    [
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Allow-Credentials",
      "Access-Control-Expose-Headers",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "Origin",
      "Vary",
      "Referer",
      "Server",
      "x-cache",
      "via",
      "x-amz-cf-pop",
      "x-amz-cf-id",
    ].map((header) => res.removeHeader(header));

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");

    res.end(newLines.join("\n"));
    return;
  }
}
