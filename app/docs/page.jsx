import Link from 'next/link';

export const metadata = {
    title: 'Documentation - CORS Proxy',
    description: 'API documentation for the CORS proxy service',
};

export default function DocsPage() {
    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
                    <p className="text-gray-400">Complete guide to using the CORS Proxy API</p>
                </div>

                {/* Main Proxy Endpoint */}
                <section className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">Main Proxy Endpoint</h2>
                    <div className="bg-gray-900 rounded p-4 mb-4 font-mono text-sm overflow-x-auto">
                        <span className="text-green-400">GET</span> /api/proxy?url=<span className="text-yellow-400">[URL]</span>&headers=<span className="text-yellow-400">[HEADERS_JSON]</span>
                    </div>

                    <h3 className="font-bold mb-2">Parameters:</h3>
                    <ul className="space-y-2 mb-4">
                        <li className="bg-gray-900 p-3 rounded">
                            <code className="text-blue-300">url</code> <span className="text-gray-500">(required)</span>
                            <p className="text-sm text-gray-400 mt-1">The URL to proxy. Must be URL-encoded.</p>
                        </li>
                        <li className="bg-gray-900 p-3 rounded">
                            <code className="text-blue-300">headers</code> <span className="text-gray-500">(optional)</span>
                            <p className="text-sm text-gray-400 mt-1">JSON object of custom headers. Must be URL-encoded.</p>
                        </li>
                    </ul>

                    <h3 className="font-bold mb-2">Example:</h3>
                    <div className="bg-gray-900 rounded p-4 font-mono text-xs overflow-x-auto">
                        <pre className="text-gray-300">{`const url = 'https://example.com/video.m3u8';
const headers = { referer: 'https://example.com/' };

const proxyUrl = \`/api/proxy?url=\${encodeURIComponent(url)}&headers=\${encodeURIComponent(JSON.stringify(headers))}\`;

// Use with HLS.js
const hls = new Hls();
hls.loadSource(proxyUrl);
hls.attachMedia(video);`}</pre>
                    </div>
                </section>

                {/* TS Proxy Endpoint */}
                <section className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-purple-400">TS Segment Proxy</h2>
                    <div className="bg-gray-900 rounded p-4 mb-4 font-mono text-sm overflow-x-auto">
                        <span className="text-green-400">GET</span> /api/ts-proxy?url=<span className="text-yellow-400">[URL]</span>&headers=<span className="text-yellow-400">[HEADERS_JSON]</span>
                    </div>

                    <p className="text-gray-400 mb-4">
                        Used internally by the main proxy for streaming TS segments and encryption keys.
                        Generally, you don&apos;t need to call this directly.
                    </p>
                </section>

                {/* Supported Formats */}
                <section className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Supported Formats</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded">
                            <h3 className="font-bold text-blue-400 mb-2">Streaming Formats</h3>
                            <ul className="space-y-1 text-sm text-gray-300">
                                <li>✓ M3U8 / HLS</li>
                                <li>✓ M3U8 Master Playlists</li>
                                <li>✓ TS Segments</li>
                                <li>✓ Encrypted Streams</li>
                            </ul>
                        </div>
                        <div className="bg-gray-900 p-4 rounded">
                            <h3 className="font-bold text-purple-400 mb-2">Direct Media</h3>
                            <ul className="space-y-1 text-sm text-gray-300">
                                <li>✓ MP4</li>
                                <li>✓ WEBM</li>
                                <li>✓ MP3</li>
                                <li>✓ M4S</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Auto Referer */}
                <section className="bg-gray-800 rounded-xl p-6 mb-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Auto Referer Detection</h2>
                    <p className="text-gray-400 mb-4">
                        The proxy automatically adds the correct referer header for popular streaming domains:
                    </p>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-900 p-2 rounded">YouTube</div>
                        <div className="bg-gray-900 p-2 rounded">Watching.onl</div>
                        <div className="bg-gray-900 p-2 rounded">DotStream</div>
                        <div className="bg-gray-900 p-2 rounded">MegaCloud</div>
                        <div className="bg-gray-900 p-2 rounded">StreamWish</div>
                        <div className="bg-gray-900 p-2 rounded">VidWish</div>
                    </div>
                </section>

                {/* CORS Headers */}
                <section className="bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">CORS Headers</h2>
                    <p className="text-gray-400 mb-4">
                        All responses include the following CORS headers:
                    </p>
                    <div className="bg-gray-900 rounded p-4 font-mono text-xs space-y-1">
                        <div><span className="text-blue-300">Access-Control-Allow-Origin:</span> *</div>
                        <div><span className="text-blue-300">Access-Control-Allow-Methods:</span> GET, POST, PUT, DELETE, OPTIONS</div>
                        <div><span className="text-blue-300">Access-Control-Allow-Headers:</span> *</div>
                        <div><span className="text-blue-300">Access-Control-Expose-Headers:</span> *</div>
                    </div>
                </section>
            </div>
        </main>
    );
}
