import { NextResponse } from 'next/server';

const KODIK_BASE = 'https://kodikapi.com';

/**
 * Token retrieval from kodik-add.com/add-players.min.js — 
 * same method as https://github.com/YaNesyTortiK/AnimeParsers (parser_kodik.py)
 */
async function getKodikToken(): Promise<string | null> {
    try {
        const res = await fetch('https://kodik-add.com/add-players.min.js?v=2', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://kodik.info/',
            },
            next: { revalidate: 3600 }, // cache 1 hour
        });

        if (!res.ok) return null;

        const text = await res.text();
        // Extract token="VALUE" from the minified JS
        const idx = text.indexOf('token="');
        if (idx === -1) return null;
        const start = idx + 7;
        const end = text.indexOf('"', start);
        if (end === -1) return null;
        const token = text.substring(start, end);
        return token.length >= 8 ? token : null;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const limit = searchParams.get('limit') || '24';

    if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const token = await getKodikToken();
    if (!token) {
        return NextResponse.json({ error: 'Could not retrieve Kodik token' }, { status: 500 });
    }

    const params = new URLSearchParams({
        token,
        title,
        types: 'anime-serial,anime',
        with_material_data: 'true',
        limit,
    });

    try {
        const res = await fetch(`${KODIK_BASE}/search?${params.toString()}`, {
            method: 'POST',
            next: { revalidate: 300 },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Kodik API error', status: res.status }, { status: 502 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Failed to reach Kodik' }, { status: 502 });
    }
}
