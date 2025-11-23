'use client';

import { useEffect, useRef, useState } from 'react';

export default function VideoPlayer({ src, className = '' }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hlsLoaded, setHlsLoaded] = useState(false);

    useEffect(() => {
        // Dynamically import HLS.js only on client side
        import('hls.js').then((module) => {
            const Hls = module.default;
            setHlsLoaded(true);

            if (!src || !videoRef.current) return;

            const video = videoRef.current;
            setLoading(true);
            setError(null);

            console.log('Loading stream:', src);

            // Check if HLS is supported
            if (Hls.isSupported()) {
                console.log('HLS.js is supported');

                // Destroy previous instance if exists
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                }

                const hls = new Hls({
                    debug: true,
                    enableWorker: true,
                    lowLatencyMode: false,
                    backBufferLength: 90,
                    xhrSetup: function (xhr, url) {
                        console.log('XHR Setup for:', url);
                    }
                });

                hlsRef.current = hls;

                hls.loadSource(src);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✓ Stream loaded successfully');
                    setLoading(false);
                    video.play().catch(e => {
                        console.log('Autoplay prevented, click play button');
                    });
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS Error:', event, data);
                    if (data.fatal) {
                        setLoading(false);
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error('Network error details:', data);
                                setError(`Network error: ${data.details}. Check if the URL is accessible.`);
                                // Try to recover
                                setTimeout(() => {
                                    console.log('Attempting to recover from network error');
                                    hls.startLoad();
                                }, 1000);
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error('Media error - attempting recovery');
                                hls.recoverMediaError();
                                break;
                            default:
                                setError(`Fatal error: ${data.details || 'Unknown error'}`);
                                hls.destroy();
                                break;
                        }
                    }
                });

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                console.log('Using native HLS support');
                video.src = src;
                video.addEventListener('loadedmetadata', () => {
                    console.log('✓ Video metadata loaded');
                    setLoading(false);
                    video.play().catch(e => console.log('Autoplay prevented'));
                });
                video.addEventListener('error', (e) => {
                    console.error('Video error:', e);
                    setLoading(false);
                    setError('Failed to load stream');
                });
            } else {
                setLoading(false);
                setError('Your browser does not support HLS playback');
            }

            return () => {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
            };
        }).catch((err) => {
            console.error('Failed to load HLS.js:', err);
            setError('Failed to load video player library');
            setLoading(false);
        });
    }, [src]);

    return (
        <div className={`relative ${className}`}>
            <video
                ref={videoRef}
                controls
                className="w-full rounded-lg aspect-video bg-black"
            />
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-white text-lg">Loading stream...</div>
                </div>
            )}
            {error && (
                <div className="mt-2 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                    <strong>Error:</strong> {error}
                    <div className="mt-2 text-xs opacity-75">
                        Check browser console for more details
                    </div>
                </div>
            )}
        </div>
    );
}
