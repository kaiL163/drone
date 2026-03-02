import { NextResponse } from 'next/server';

const BACKEND = 'http://212.119.42.49:8000';

// GET /api/shikimori/rating?title=Название
// Возвращает рейтинг аниме из Shikimori через наш Python бэкенд
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title) {
        return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    try {
        const res = await fetch(
            `${BACKEND}/shikimori/search?title=${encodeURIComponent(title)}`,
            { next: { revalidate: 86400 } } // Кешируем на сутки
        );

        if (!res.ok) {
            return NextResponse.json({ found: false, rating: null });
        }

        const data = await res.json();
        const results: Array<{ title?: string; score?: string | number; shikimori_id?: string; poster?: string }> = data.results || [];

        if (!results.length) {
            return NextResponse.json({ found: false, rating: null });
        }

        const best = results[0];
        const score = parseFloat(String(best.score ?? '0'));

        return NextResponse.json({
            found: true,
            rating: isNaN(score) || score === 0 ? null : score.toFixed(2),
            shikimori_id: best.shikimori_id ?? null,
        });
    } catch {
        return NextResponse.json({ found: false, rating: null });
    }
}
