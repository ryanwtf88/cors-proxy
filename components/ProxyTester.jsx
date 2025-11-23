'use client';

import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

export default function ProxyTester() {
    const [url, setUrl] = useState('https://fxpy7.watching.onl/anime/3b5f657f49a25ad6dae77d4e048d1003/147b6d65868586ebe3e3ae92953d4fe3/master.m3u8');
    const [headers, setHeaders] = useState('{"referer": "https://watching.onl/"}');
    const [proxyUrl, setProxyUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const generateProxyUrl = () => {
        try {
            const parsedHeaders = JSON.parse(headers);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            return `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}&headers=${encodeURIComponent(JSON.stringify(parsedHeaders))}`;
        } catch (e) {
            return '';
        }
    };

    const handleCopy = () => {
        const generatedUrl = generateProxyUrl();
        if (generatedUrl) {
            navigator.clipboard.writeText(generatedUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleTest = () => {
        const generatedUrl = generateProxyUrl();
        setProxyUrl(generatedUrl);
    };

    return (
        <div className="w-full max-w-screen-xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Test Proxy</h2>
                <p className="text-sm text-gray-400">Paste your media URL and headers to test the proxy</p>
            </div>

            <div className="space-y-4">
                {/* URL Input */}
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
                        URL
                    </label>
                    <input
                        type="text"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/video.m3u8"
                    />
                </div>

                {/* Headers Input */}
                <div>
                    <label htmlFor="headers" className="block text-sm font-medium text-gray-300 mb-1">
                        Headers (JSON)
                    </label>
                    <textarea
                        id="headers"
                        value={headers}
                        onChange={(e) => setHeaders(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder='{"referer": "https://example.com/"}'
                    />
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleCopy}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            {copied ? (
                                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                            ) : (
                                <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V5H19V19H5V5H7V7Z" />
                            )}
                        </svg>
                        {copied ? 'Copied!' : 'Copy Proxy URL'}
                    </button>
                    <button
                        onClick={handleTest}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                        </svg>
                        Play Stream
                    </button>
                </div>

                {/* Video Player */}
                {proxyUrl && (
                    <div className="mt-6">
                        <VideoPlayer src={proxyUrl} />
                    </div>
                )}
            </div>
        </div>
    );
}
