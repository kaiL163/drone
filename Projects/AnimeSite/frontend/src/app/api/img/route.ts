import { NextResponse } from 'next/server';

// GET /api/img?url=https://anilibria.top/storage/...
// Проксирует изображения с Anilibria CDN, обходя их hotlink-защиту
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl || (!imageUrl.startsWith('https://anilibria.top/') && !imageUrl.startsWith('https://shikimori.io/'))) {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    try {
        const isShiki = imageUrl.startsWith('https://shikimori.io/');
        const res = await fetch(imageUrl, {
            headers: {
                // Притворяемся браузером
                'Referer': isShiki ? 'https://shikimori.io/' : 'https://anilibria.top/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
            },
        });

        if (!res.ok) {
            return new NextResponse(null, { status: res.status });
        }

        const blob = await res.arrayBuffer();
        const contentType = res.headers.get('content-type') || 'image/jpeg';

        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // кешируем на сутки
            },
        });
    } catch {
        return new NextResponse('Proxy error', { status: 502 });
    }
}
