// CORS header utilities for API routes

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Max-Age': '86400',
};

export function withCORS(headers = {}) {
    return {
        ...corsHeaders,
        ...headers,
    };
}

export function createErrorResponse(message, status = 500) {
    return new Response(
        JSON.stringify({ error: message }),
        {
            status,
            headers: withCORS({ 'Content-Type': 'application/json' }),
        }
    );
}

export function createSuccessResponse(data, headers = {}) {
    return new Response(
        data,
        {
            status: 200,
            headers: withCORS(headers),
        }
    );
}
