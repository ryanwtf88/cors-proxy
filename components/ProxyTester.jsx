'use client';

import { useState } from 'react';
import VideoPlayer from './VideoPlayer';

export default function ProxyTester() {
    const [url, setUrl] = useState('');
    const [headers, setHeaders] = useState('{}');
    const [proxyUrl, setProxyUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'

    const generateProxyUrl = () => {
        try {
            const parsedHeaders = JSON.parse(headers);
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            return `${baseUrl}/api/proxy?url=${encodeURIComponent(url)}&headers=${encodeURIComponent(JSON.stringify(parsedHeaders))}`;
        } catch (e) {
            showMessage('Invalid JSON in headers', 'error');
            return '';
        }
    };

    const showMessage = (msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleCopy = () => {
        const generatedUrl = generateProxyUrl();
        if (generatedUrl) {
            navigator.clipboard.writeText(generatedUrl);
            setCopied(true);
            showMessage('Proxy URL copied to clipboard', 'success');
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    };

    const handleTest = () => {
        if (!url.trim()) {
            showMessage('Please enter a URL', 'error');
            return;
        }

        const generatedUrl = generateProxyUrl();
        if (generatedUrl) {
            setProxyUrl(generatedUrl);
            showMessage('Loading stream...', 'info');
        }
    };

    const handleClear = () => {
        setUrl('');
        setHeaders('{}');
        setProxyUrl('');
        setMessage('');
    };

    return (
        <div className="w-full max-w-screen-xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Stream Proxy Tester</h2>
                <p className="text-sm text-gray-400">
                    Enter any direct streaming URL (M3U8, MP4, TS) to proxy and play
                </p>
            </div>

            <div className="space-y-4">
                {/* URL Input */}
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
                        Stream URL
                        <span className="ml-2 text-xs text-gray-500">
                            (Direct M3U8, MP4, or TS URLs only)
                        </span>
                    </label>
                    <input
                        type="text"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/stream.m3u8"
                    />
                    <div className="mt-2 text-xs text-gray-500">
                        <span className="inline-block px-2 py-1 bg-green-900/30 text-green-400 rounded mr-2">
                            Supported
                        </span>
                        .m3u8 (HLS), .mp4, .webm, .ts segments
                    </div>
                </div>

                {/* Headers Input */}
                <div>
                    <label htmlFor="headers" className="block text-sm font-medium text-gray-300 mb-1">
                        Custom Headers
                        <span className="ml-2 text-xs text-gray-500">(Optional JSON)</span>
                    </label>
                    <textarea
                        id="headers"
                        value={headers}
                        onChange={(e) => setHeaders(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder='{"referer": "https://example.com/"}'
                    />
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`rounded-lg p-3 text-sm border ${messageType === 'success' ? 'bg-green-900/20 border-green-500 text-green-200' :
                        messageType === 'error' ? 'bg-red-900/20 border-red-500 text-red-200' :
                            'bg-blue-900/20 border-blue-500 text-blue-200'
                        }`}>
                        <div className="flex items-center gap-2">
                            {messageType === 'success' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {messageType === 'error' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            )}
                            {messageType === 'info' && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            )}
                            <span>{message}</span>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={handleCopy}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            {copied ? (
                                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                            ) : (
                                <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V5H19V19H5V5H7V7Z" />
                            )}
                        </svg>
                        {copied ? 'Copied' : 'Copy URL'}
                    </button>
                    <button
                        onClick={handleTest}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                        </svg>
                        Play Stream
                    </button>
                    <button
                        onClick={handleClear}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                        </svg>
                        Clear
                    </button>
                </div>

                {/* Generated Proxy URL Display */}
                {proxyUrl && (
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400">Proxied URL:</span>
                            <span className="inline-block px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs">
                                Active
                            </span>
                        </div>
                        <div className="text-xs text-green-400 font-mono break-all bg-gray-800 p-2 rounded">
                            {proxyUrl}
                        </div>
                    </div>
                )}

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
