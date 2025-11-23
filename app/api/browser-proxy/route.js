import { withCORS, createErrorResponse, createSuccessResponse } from '@/lib/corsHeaders';
import { isM3U8, isDirectMedia, rewriteM3U8 } from '@/lib/proxyUtils';
import { getRefererForUrl } from '@/lib/config';
import { getBrowserInstance } from '@/lib/browser';

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
        }

        const baseReferer = customHeaders.referer || customHeaders.Referer || autoReferer || '';

        console.log(`Browser Proxy - Fetching: ${url}`);
        console.log(`Using Referer: ${baseReferer}`);

        // Get browser instance and fetch the URL
        const browser = getBrowserInstance();

        const extraHeaders = {};
        if (baseReferer) {
            extraHeaders['Referer'] = baseReferer;
        }

        // Merge custom headers
        Object.assign(extraHeaders, customHeaders);

        const { status, headers, buffer, text } = await browser.fetch(url, {
            headers: extraHeaders,
            timeout: 30000,
        });

        // Handle error status codes
        if (status >= 400) {
            console.error(`HTTP ${status} error for URL: ${url}`);
            return createErrorResponse(
                `HTTP ${status} error - Failed to load stream`,
                status
            );
        }

        const contentType = headers['content-type'] || '';
        console.log(`Content-Type: ${contentType}`);

        // Handle direct media (MP4, WEBM, MP3, etc.)
        if (isDirectMedia(url, contentType) && !isM3U8(url, contentType)) {
            const responseHeaders = {
                'Content-Type': contentType || 'application/octet-stream',
            };

            // Preserve important headers for media streaming
            if (headers['content-length']) responseHeaders['Content-Length'] = headers['content-length'];
            if (headers['accept-ranges']) responseHeaders['Accept-Ranges'] = headers['accept-ranges'];
            if (headers['content-range']) responseHeaders['Content-Range'] = headers['content-range'];

            return createSuccessResponse(buffer, responseHeaders);
        }

        // Handle M3U8 playlists
        const m3u8 = text.trim();

        // Check if it's a master playlist
        const isMaster = m3u8.includes('RESOLUTION=') || m3u8.includes('#EXT-X-STREAM-INF');

        // Rewrite M3U8 to proxy all URLs through browser-proxy
        const rewrittenM3U8 = rewriteM3U8(m3u8, url, customHeaders, isMaster, '/api/browser-proxy');

        return createSuccessResponse(rewrittenM3U8, {
            'Content-Type': 'application/vnd.apple.mpegurl',
        });

    } catch (error) {
        console.error('Browser Proxy error:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to fetch stream via browser';
        let statusCode = 500;

        if (error.name === 'TimeoutError') {
            errorMessage = 'Request timeout - page took too long to load';
            statusCode = 504;
        } else if (error.message.includes('net::')) {
            errorMessage = `Network error: ${error.message}`;
            statusCode = 502;
        } else {
            errorMessage = error.message || errorMessage;
        }

        return createErrorResponse(errorMessage, statusCode);
    }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request) {
    return new Response(null, {
        status: 204,
        headers: withCORS(),
    });
}
