# CORS Proxy - Next.js Serverless

Universal CORS proxy for media streaming with full support for M3U8, MP4, WEBM, YouTube, and livestreams. Built with Next.js, React, and Tailwind CSS for serverless deployment on Vercel.

## Features

- 🚀 **Fully Serverless** - Optimized for Vercel Edge Functions
- 🎬 **Universal Support** - M3U8, MP4, WEBM, MP3, YouTube, and more
- 🔒 **Auto Referer** - Automatically adds correct referer headers
- ⚡ **Fast & Reliable** - Edge runtime with zero cold starts
- 🎨 **Modern UI** - Built with React and Tailwind CSS

## Supported Formats

### Streaming
- M3U8 / HLS (including master playlists)
- TS segments
- Encrypted streams
- LiveStreams

### Direct Media
- MP4
- WEBM
- MP3
- M4S

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## API Endpoints

### Main Proxy
```
GET /api/proxy?url=[URL]&headers=[HEADERS_JSON]
```

Proxies any media URL with custom headers. Automatically rewrites M3U8 playlists.

### TS Proxy
```
GET /api/ts-proxy?url=[URL]&headers=[HEADERS_JSON]
```

Proxies TS segments and encryption keys.

## Usage Example

```javascript
const url = 'https://fxpy7.watching.onl/anime/.../master.m3u8';
const headers = { referer: 'https://watching.onl/' };

const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;

// Use with HLS.js
const hls = new Hls();
hls.loadSource(proxyUrl);
hls.attachMedia(video);
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_URL=https://your-domain.vercel.app
```

## Auto Referer Detection

The proxy automatically adds referer headers for:
- YouTube
- Watching.onl
- DotStream
- MegaCloud
- StreamWish
- VidWish

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Edge Functions
- **Styling**: Tailwind CSS
- **Video**: HLS.js
- **HTTP Client**: Axios

## License

MIT