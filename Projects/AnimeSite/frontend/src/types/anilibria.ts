export interface AnilibriaV1Episode {
    id: string;
    name: string;
    ordinal: number;
    opening: { start: number; stop: number };
    ending: { start: number; stop: number };
    preview: {
        src: string;
        thumbnail: string;
        optimized: { src: string; thumbnail: string };
    };
    hls_480: string;
    hls_720: string;
    hls_1080: string;
    duration: number;
    sort_order: number;
    release_id: number;
}

export interface AnilibriaV1Genre {
    id: number;
    name: string;
}

export interface AnilibriaV1Release {
    id: number;
    type: { value: string; description: string };
    year: number;
    name: { main: string; english: string | null; alternative: string | null };
    alias: string;
    season: { value: string; description: string };
    poster: {
        src: string;
        thumbnail: string;
        optimized: { src: string; thumbnail: string };
    };
    description: string;
    is_ongoing: boolean;
    episodes_total?: number;
    average_duration_of_episode?: number;
    age_rating: { label: string; description: string };
    genres?: AnilibriaV1Genre[];
    episodes?: AnilibriaV1Episode[];
    added_in_users_favorites?: number;
    latest_episode?: { id: string; name: string; ordinal: number };
}
