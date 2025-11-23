import config from './config.js';

const web_server_url = config.publicUrl;

// Check if URL is M3U8
export function isM3U8(url, contentType) {
    return url.includes('.m3u8') || contentType?.includes('mpegurl') || contentType?.includes('m3u8');
}

// Check if URL is direct media
export function isDirectMedia(url, contentType) {
    const mediaExtensions = ['.mp4', '.webm', '.mp3', '.ts', '.m4s', '.aac', '.m4a'];
    const mediaTypes = ['video/mp4', 'video/webm', 'audio/mpeg', 'video/mp2t', 'audio/mp4', 'audio/aac'];
    return mediaExtensions.some(ext => url.includes(ext)) ||
        mediaTypes.some(type => contentType?.includes(type));
}

// Rewrite M3U8 playlist to proxy all URLs
export function rewriteM3U8(m3u8Content, baseUrl, headers, isMaster = false, endpoint = null) {
    const lines = m3u8Content.split('\n');
    const newLines = [];

    for (const line of lines) {
        if (line.startsWith('#')) {
            // Handle encryption keys
            if (line.startsWith('#EXT-X-KEY:')) {
                const uriMatch = line.match(/URI="([^"]+)"/);
                if (uriMatch) {
                    const keyUrl = resolveUrl(uriMatch[1], baseUrl);
                    const tsEndpoint = endpoint || '/api/ts-proxy';
                    const proxyKeyUrl = `${web_server_url}${tsEndpoint}?url=${encodeURIComponent(keyUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
                    newLines.push(line.replace(uriMatch[1], proxyKeyUrl));
                } else {
                    newLines.push(line);
                }
            }
            // Handle media playlists in master playlist
            else if (line.startsWith('#EXT-X-MEDIA:') && line.includes('URI=')) {
                const uriMatch = line.match(/URI="([^"]+)"/);
                if (uriMatch) {
                    const mediaUrl = resolveUrl(uriMatch[1], baseUrl);
                    const proxyEndpoint = endpoint || '/api/proxy';
                    const proxyMediaUrl = `${web_server_url}${proxyEndpoint}?url=${encodeURIComponent(mediaUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
                    newLines.push(line.replace(uriMatch[1], proxyMediaUrl));
                } else {
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        } else if (line.trim() && !line.startsWith('#')) {
            // Handle segment URLs
            try {
                const segmentUrl = resolveUrl(line.trim(), baseUrl);
                const segmentEndpoint = endpoint || (isMaster ? '/api/proxy' : '/api/ts-proxy');
                const proxyUrl = `${web_server_url}${segmentEndpoint}?url=${encodeURIComponent(segmentUrl)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
                newLines.push(proxyUrl);
            } catch (e) {
                console.error(`Error processing URL: ${line}`, e);
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    }

    return newLines.join('\n');
}

// Resolve relative URLs
export function resolveUrl(url, baseUrl) {
    if (!url) return baseUrl;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    try {
        return new URL(url, baseUrl).href;
    } catch (e) {
        console.error('Error resolving URL:', e);
        return url;
    }
}

// Get content type from URL or headers
export function getContentType(url, headers) {
    if (headers['content-type']) {
        return headers['content-type'];
    }

    if (url.includes('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (url.includes('.mp4')) return 'video/mp4';
    if (url.includes('.webm')) return 'video/webm';
    if (url.includes('.mp3')) return 'audio/mpeg';
    if (url.includes('.ts')) return 'video/mp2t';
    if (url.includes('.m4s')) return 'video/mp4';

    return 'application/octet-stream';
}
