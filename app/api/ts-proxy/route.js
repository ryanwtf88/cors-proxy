import { withCORS, createErrorResponse, createSuccessResponse } from '@/lib/corsHeaders';
import { getRefererForUrl } from '@/lib/config';
import { checkRateLimit, getClientIP, validateProxyUrl } from '@/lib/rateLimiter';

export const runtime = 'edge';

export async function GET(request) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request);
        if (!checkRateLimit(clientIP)) {
            return createErrorResponse(
                'Rate limit exceeded. Please try again later.',
                429
            );
        }

        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const headersParam = searchParams.get('headers');

        if (!url) {
            return createErrorResponse('URL parameter is required', 400);
        }

        // Validate URL
        const validation = validateProxyUrl(url);
        if (!validation.valid) {
            return createErrorResponse(validation.error, 400);
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
        const targetOrigin = `${urlObj.protocol}//${urlObj.hostname}`;

        // Use the base domain as referer for better compatibility
        const baseReferer = customHeaders.referer || customHeaders.Referer || autoReferer || `${targetOrigin}/`;

        const requestHeaders = {
            // Core browser headers - order matters for fingerprinting
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd',

            // Referer is critical - must come before Sec-Fetch headers
            'Referer': baseReferer,

            // Security and fetch metadata - use cross-site for external domains
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',

            // Additional anti-bot headers
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',

            // Override with custom headers last
            ...customHeaders,
        };

        console.log(`TS Proxy - Fetching: ${url}`);
        console.log(`Using Referer: ${baseReferer}`);

        // Fetch the TS segment or encryption key with enhanced settings
        const response = await fetch(url, {
            method: 'GET',
            headers: requestHeaders,
            redirect: 'follow',
            // Add signal for timeout control
            signal: AbortSignal.timeout(30000), // 30 second timeout
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

        // Provide more specific error messages
        let errorMessage = 'Failed to fetch TS segment';
        let statusCode = 500;

        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            errorMessage = 'Request timeout - segment took too long to respond';
            statusCode = 504;
        } else if (error.message.includes('fetch')) {
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
