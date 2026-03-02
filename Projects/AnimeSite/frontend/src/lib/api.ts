/**
 * API utilities for NekoStream.
 * All anime data comes from the backend Kodik proxy.
 */

export const BACKEND_URL = 'http://212.119.42.49:8000';

export interface KodikCard {
    id: string;
    shikimori_id: string;
    kinopoisk_id: string;
    kodik_id: string;
    title: string;
    title_orig: string;
    year: number | null;
    type: string;
    anime_kind: string;
    anime_status: string;
    episodes_total: number | null;
    episodes_aired: number | null;
    poster: string | null;
    description: string;
    genres: string[];
    shikimori_rating: number | null;
    duration: number | null;
    link: string;
}

export interface KodikTranslation {
    translation_id: string;
    translation_title: string;
    translation_type: string;
    link: string;
}

export interface KodikTitleData {
    found: boolean;
    metadata: {
        shikimori_id: string;
        kinopoisk_id: string;
        title: string;
        title_orig: string;
        year: number | null;
        anime_kind: string;
        anime_status: string;
        episodes_total: number | null;
        episodes_aired: number | null;
        poster: string | null;
        description: string;
        genres: string[];
        shikimori_rating: number | null;
        screenshots: string[];
    } | null;
    translations: KodikTranslation[];
}

export interface ShikimoriAnime {
    id: string;
    name: string;
    russian: string;
    score: number;
    poster: { originalUrl: string } | null;
    episodes: number;
    episodesAired: number;
    status: string;
    kind: string;
    airedOn: { year: number } | null;
}

export interface ShikimoriListResponse {
    results: ShikimoriAnime[];
    has_more: boolean;
}

/** Fetch catalog/list from Shikimori GraphQL Proxy */
export async function fetchShikimoriCatalog(opts: {
    limit?: number;
    page?: number;
    status?: string;
    kind?: string;
    genre?: string;
    order?: string;
    search?: string;
    season?: string;
    strict?: boolean;
    signal?: AbortSignal;
} = {}): Promise<ShikimoriAnime[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/shikimori/catalog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(opts),
            signal: opts.signal,
            next: { revalidate: 300 }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function searchAnime(query: string, limit = 5): Promise<ShikimoriAnime[]> {
    return fetchShikimoriCatalog({ search: query, limit });
}

export async function fetchPopularAnime(limit = 10): Promise<ShikimoriAnime[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/custom/popular?limit=${limit}`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function fetchRandomAnime(limit = 10): Promise<ShikimoriAnime[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/custom/random?limit=${limit}`, {
            next: { revalidate: 0 } // Random should not be heavily cached
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

export async function fetchCalendar(): Promise<any[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/shikimori/calendar`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

const bannerCache: Record<string, string | null> = {};

export async function fetchAniListBanner(title: string): Promise<string | null> {
    if (!title) return null;
    if (bannerCache[title] !== undefined) return bannerCache[title];

    const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        bannerImage
        title { romaji english native }
      }
    }
    `;

    try {
        console.log(`[AniList] Fetching banner for: ${title}`);
        const res = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { search: title }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const banner = json?.data?.Media?.bannerImage || null;

        bannerCache[title] = banner;
        return banner;
    } catch (err) {
        console.warn(`[AniList] Failed for ${title}:`, err);
        bannerCache[title] = null;
        return null;
    }
}

/** Get full anime info by Shikimori ID (for title page) */
export async function fetchTitleByShikimoriId(id: string): Promise<KodikTitleData> {
    try {
        const res = await fetch(`${BACKEND_URL}/kodik/by-shikimori/${id}`, {
            next: { revalidate: 0 }
        });
        if (!res.ok) return { found: false, metadata: null, translations: [] };
        return await res.json();
    } catch {
        return { found: false, metadata: null, translations: [] };
    }
}

/** Human-readable anime kind label */
export function kindLabel(kind: string | null | undefined): string {
    if (!kind) return 'Аниме';
    const map: Record<string, string> = {
        tv: 'ТВ-сериал', tv13: 'ТВ Короткий', tv24: 'ТВ-сериал', tv48: 'ТВ Длинный',
        movie: 'Фильм', ova: 'OVA', ona: 'ONA', special: 'Спешл', music: 'Клип',
    };
    return map[kind] || kind.toUpperCase() || 'Аниме';
}

/** Human-readable status label */
export function statusLabel(status: string): string {
    const map: Record<string, string> = {
        ongoing: 'Онгоинг', released: 'Вышел', anons: 'Анонс',
    };
    return map[status] || status || '';
}

/** Get the current Shikimori season string (e.g. winter_2026) */
export function getCurrentSeason(): string {
    const d = new Date();
    const month = d.getMonth(); // 0-11
    let year = d.getFullYear();
    let season = '';

    // Standard Anime Seasons:
    // Winter: Jan (0), Feb (1), Mar (2)
    // Spring: Apr (3), May (4), Jun (5)
    // Summer: Jul (6), Aug (7), Sep (8)
    // Fall: Oct (9), Nov (10), Dec (11)

    if (month >= 0 && month <= 2) {
        season = 'winter';
    } else if (month >= 3 && month <= 5) {
        season = 'spring';
    } else if (month >= 6 && month <= 8) {
        season = 'summer';
    } else {
        season = 'fall';
    }

    return `${season}_${year}`;
}


/** USER LISTS — DATABASE SYNC */

export interface AnimeListItem {
    id: number;
    user_id: number;
    shikimori_id: string;
    status: 'planned' | 'watching' | 'completed' | 'on_hold' | 'dropped';
    is_favorite: boolean;
    episodes_watched: number;
    score: number | null;
    updated_at: string;
}

/** Get the current user's full anime list */
export async function fetchUserList(token: string): Promise<AnimeListItem[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/users/me/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

/** Add or update an item in the user's list */
export async function updateAnimeList(token: string, data: {
    shikimori_id: string;
    status?: string;
    is_favorite?: boolean;
    episodes_watched?: number;
    score?: number;
}): Promise<AnimeListItem | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/users/me/list`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/** Remove an item from the user's list */
export async function removeFromList(token: string, shikimoriId: string): Promise<boolean> {
    try {
        const res = await fetch(`${BACKEND_URL}/users/me/list/${shikimoriId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.ok;
    } catch {
        return false;
    }
}
