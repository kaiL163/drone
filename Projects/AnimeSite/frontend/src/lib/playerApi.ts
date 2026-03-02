const BACKEND_URL = 'http://212.119.42.49:8000';

export interface KodikTranslation {
    id: number;
    title: string;
    type: string;
}

export interface KodikResult {
    id: string;
    type: string;
    link: string;
    title: string;
    title_orig: string;
    other_title: string;
    translation: KodikTranslation;
    year: number;
    kinopoisk_id: string;
    quality: string;
}

export interface CollapsResult {
    id: number;
    title: string;
    kinopoisk_id: string;
    iframe_url: string;
}

export interface KinoboxPlayer {
    id: string;
    source: string;
    type: string;
    iframeUrl: string;
    translation: string;
}

/**
 * Searches Kodik API via Backend proxy.
 */
export async function searchKodik(title: string): Promise<KodikResult[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/kodik/search?title=${encodeURIComponent(title)}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch {
        return [];
    }
}

/**
 * Searches Collaps API via Backend proxy.
 */
export async function searchCollaps(kinopoisk_id: string): Promise<CollapsResult[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/collaps/search?kinopoisk_id=${kinopoisk_id}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch {
        return [];
    }
}

/**
 * Searches Kinobox API via Backend proxy.
 */
export async function searchKinobox(kinopoisk_id: string): Promise<KinoboxPlayer[]> {
    try {
        const res = await fetch(`${BACKEND_URL}/kinobox/search?kinopoisk_id=${kinopoisk_id}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
    } catch {
        return [];
    }
}
