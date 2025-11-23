import { withCORS, createErrorResponse, createSuccessResponse } from '@/lib/corsHeaders';
import { isM3U8, isDirectMedia, rewriteM3U8 } from '@/lib/proxyUtils';
import { getRefererForUrl } from '@/lib/config';

export const runtime = 'edge';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const headersParam = searchParams.get('headers');

        if (!url) {
            return createErrorResponse('URL parameter is required', 400);
        }

        // Parse custom headers
        let customHeaders = {};
        try {
            if (headersParam) {
                customHeaders = JSON.parse(headersParam);
            }
        } catch (e) {
            return createErrorResponse('Invalid headers JSON', 400);
        }

        // Auto-add referer if not present
        const autoReferer = getRefererForUrl(url);
        if (autoReferer && !customHeaders.referer && !customHeaders.Referer) {
            customHeaders.referer = autoReferer;
            console.log(`Auto-added referer: ${autoReferer} for URL: ${url}`);
        }

        // Build comprehensive browser-like request headers to bypass protection
        const urlObj = new URL(url);
        const origin = `${urlObj.protocol}//${urlObj.hostname}`;

        const requestHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Origin': origin,
            'Referer': customHeaders.referer || customHeaders.Referer || origin,
            ...customHeaders,
        };

        console.log(`Proxying URL: ${url}`);

        // Fetch the content using native Fetch API
        const response = await fetch(url, {
            method: 'GET',
            headers: requestHeaders,
            redirect: 'follow',
        });

        // Handle error status codes
        if (!response.ok && response.status >= 400) {
            console.error(`HTTP ${response.status} error for URL: ${url}`);
            return createErrorResponse(
                `HTTP ${response.status} error - Failed to load stream`,
                response.status
            );
        }

        const contentType = response.headers.get('content-type') || '';
        console.log(`Content-Type: ${contentType}`);

        // Get response body as ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        // Handle direct media (MP4, WEBM, MP3, etc.)
        if (isDirectMedia(url, contentType) && !isM3U8(url, contentType)) {
            const headers = {
                'Content-Type': contentType || 'application/octet-stream',
            };

            // Preserve important headers for media streaming
            const contentLength = response.headers.get('content-length');
            const acceptRanges = response.headers.get('accept-ranges');
            const contentRange = response.headers.get('content-range');

            if (contentLength) headers['Content-Length'] = contentLength;
            if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;
            if (contentRange) headers['Content-Range'] = contentRange;

            return createSuccessResponse(arrayBuffer, headers);
        }

        // Handle M3U8 playlists
        const m3u8Text = new TextDecoder('utf-8').decode(arrayBuffer);
        const m3u8 = m3u8Text.trim();

        // Check if it's a master playlist
        const isMaster = m3u8.includes('RESOLUTION=') || m3u8.includes('#EXT-X-STREAM-INF');

        // Rewrite M3U8 to proxy all URLs
        const rewrittenM3U8 = rewriteM3U8(m3u8, url, customHeaders, isMaster);

        return createSuccessResponse(rewrittenM3U8, {
            'Content-Type': 'application/vnd.apple.mpegurl',
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return createErrorResponse(
            error.message || 'Failed to fetch stream',
            500
        );
    }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
    return new Response(null, {
        status: 204,
        headers: withCORS(),
    });
}
