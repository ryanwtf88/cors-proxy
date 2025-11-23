import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'CORS Proxy - Universal Media Streaming',
    description: 'Stream any media with CORS support - M3U8, MP4, WEBM, YouTube, and more',
    keywords: 'cors proxy, m3u8 proxy, hls streaming, video proxy, youtube proxy',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
