import { NextResponse } from 'next/server';

const KODIK_BASE = 'https://kodikapi.com';

async function getKodikToken(): Promise<string | null> {
    try {
        const res = await fetch('https://kodik-add.com/add-players.min.js?v=2', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://kodik.info/',
            },
            next: { revalidate: 3600 },
        });

        if (!res.ok) return null;

        const text = await res.text();
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

// GET /api/kodik/iframe?title=Наруто
// Returns available voice-over translations and their iframe links
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';

    if (!title) {
        return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const token = await getKodikToken();
    if (!token) {
        return NextResponse.json({ found: false, translations: [], defaultLink: null, tokenError: true });
    }

    const params = new URLSearchParams({
        token,
        title,
        types: 'anime-serial,anime',
        with_material_data: 'true',
        limit: '50',
    });

    try {
        const res = await fetch(`${KODIK_BASE}/search?${params.toString()}`, {
            method: 'POST',
            next: { revalidate: 600 },
        });

        if (!res.ok) {
            return NextResponse.json({ found: false, translations: [], defaultLink: null });
        }

        const data = await res.json();
        const results: Array<{
            link: string;
            title: string;
            translation: { id?: number; title: string; type: string };
            episodes_count?: number;
        }> = data.results || [];

        // Group by translation id/name — each voice-over is a separate entry in Kodik
        const translationsMap = new Map<string, { link: string; title: string; type: string }>();
        for (const r of results) {
            const key = String(r.translation.id ?? r.translation.title);
            if (!translationsMap.has(key)) {
                translationsMap.set(key, {
                    link: `https:${r.link}`,
                    title: r.translation.title,
                    type: r.translation.type, // 'voice' | 'subtitles'
                });
            }
        }

        const translations = Array.from(translationsMap.values());

        return NextResponse.json({
            found: translations.length > 0,
            translations,
            defaultLink: translations.length > 0 ? translations[0].link : null,
        });
    } catch {
        return NextResponse.json({ found: false, translations: [], defaultLink: null });
    }
}
