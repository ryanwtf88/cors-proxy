import Link from 'next/link';
import ProxyTester from '@/components/ProxyTester';

export default function Home() {
    return (
        <main className="min-h-screen px-4 py-8">
            {/* Header */}
            <div className="max-w-screen-xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl p-8 mb-6 shadow-2xl animate-gradient">
                    <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                        CORS Proxy Player
                    </h1>
                    <p className="text-xl text-blue-50 mb-4">
                        Stream any media with CORS support - M3U8, MP4, WEBM, MP3 & more
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">YouTube</span>
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">M3U8 LiveStreams</span>
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">MP4</span>
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">WEBM</span>
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">Any URL</span>
                    </div>
                </div>

                <div className="mb-6">
                    <Link
                        href="/docs"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-center py-4 rounded-lg font-semibold transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Documentation</span>
                    </Link>
                </div>
            </div>

            {/* Proxy Tester */}
            <ProxyTester />

            {/* Features */}
            <div className="max-w-screen-xl mx-auto mt-12 grid md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                    <svg className="w-12 h-12 mb-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">Fully Serverless</h3>
                    <p className="text-gray-400">Optimized for Vercel with zero cold starts</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                    <svg className="w-12 h-12 mb-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">Universal Support</h3>
                    <p className="text-gray-400">Works with M3U8, MP4, WEBM, YouTube, and livestreams</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                    <svg className="w-12 h-12 mb-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">Auto Referer</h3>
                    <p className="text-gray-400">Automatically adds correct referer headers for popular domains</p>
                </div>
            </div>
        </main>
    );
}
