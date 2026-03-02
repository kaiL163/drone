'use client';

import { useState, useEffect } from 'react';
import styles from './ShikimoriRating.module.css';

interface ShikimoriRatingProps {
    title: string;
}

export default function ShikimoriRating({ title }: ShikimoriRatingProps) {
    const [rating, setRating] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/shikimori/rating?title=${encodeURIComponent(title)}`)
            .then(r => r.json())
            .then(data => {
                setRating(data.rating ?? null);
            })
            .catch(() => setRating(null))
            .finally(() => setLoading(false));
    }, [title]);

    if (loading || !rating) return null;

    const score = parseFloat(rating);
    const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444';

    return (
        <div className={styles.wrapper} title="Рейтинг по данным Shikimori">
            <svg width="14" height="14" viewBox="0 0 24 24" fill={color}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className={styles.score} style={{ color }}>{rating}</span>
            <span className={styles.source}>Shikimori</span>
        </div>
    );
}
