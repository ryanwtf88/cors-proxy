import { withCORS, createErrorResponse, createSuccessResponse } from '@/lib/corsHeaders';
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
        }

        // Build comprehensive browser-like request headers
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

        console.log(`TS Proxy - Fetching: ${url}`);

        // Fetch the TS segment or encryption key using native Fetch API
        const response = await fetch(url, {
            method: 'GET',
            headers: requestHeaders,
            redirect: 'follow',
        });

        if (!response.ok && response.status >= 400) {
            console.error(`HTTP ${response.status} error for TS URL: ${url}`);
            return createErrorResponse(
                `HTTP ${response.status} error - Failed to load segment`,
                response.status
            );
        }

        const contentType = response.headers.get('content-type') || 'video/mp2t';

        const headers = {
            'Content-Type': contentType,
        };

        // Preserve streaming headers
        const contentLength = response.headers.get('content-length');
        const acceptRanges = response.headers.get('accept-ranges');
        const contentRange = response.headers.get('content-range');

        if (contentLength) headers['Content-Length'] = contentLength;
        if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;
        if (contentRange) headers['Content-Range'] = contentRange;

        // Get response body as ArrayBuffer
        const arrayBuffer = await response.arrayBuffer();

        return createSuccessResponse(arrayBuffer, headers);

    } catch (error) {
        console.error('TS Proxy error:', error);
        return createErrorResponse(
            error.message || 'Failed to fetch TS segment',
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
