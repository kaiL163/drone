'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchOverlay.module.css';

interface ShikimoriAnime {
    id: string;
    name: string;
    russian: string;
    poster: { originalUrl: string } | null;
    kind: string;
    airedOn: { year: number } | null;
}

interface SearchOverlayProps {
    onClose: () => void;
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ShikimoriAnime[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        if (!query.trim() || query.length < 2) { setResults([]); return; }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://212.119.42.49:8000/shikimori/catalog`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ search: query, limit: 8 })
                });
                if (res.ok) {
                    const data = await res.json();
                    setResults(data || []);
                }
            } catch { }
            setLoading(false);
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    const navigate = (id: string, shiki_id: string) => {
        router.push(`/title/${shiki_id || id}`);
        onClose();
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                <div className={styles.inputRow}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={inputRef}
                        className={styles.input}
                        placeholder="Поиск аниме..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {loading && <div className={styles.spinner} />}
                    <button className={styles.closeBtn} onClick={onClose}>ESC</button>
                </div>

                {results.length > 0 && (
                    <div className={styles.results}>
                        {results.map(r => (
                            <button key={r.id} className={styles.result} onClick={() => navigate(r.id, r.id)}>
                                {r.poster?.originalUrl ? (
                                    <img
                                        src={r.poster.originalUrl}
                                        alt={r.russian || r.name}
                                        className={styles.resultPoster}
                                    />
                                ) : (
                                    <div className={styles.resultPoster} style={{ background: '#333' }} />
                                )}
                                <div className={styles.resultInfo}>
                                    <span className={styles.resultTitle}>{r.russian || r.name}</span>
                                    {r.name && r.name !== r.russian && <span className={styles.resultEn}>{r.name}</span>}
                                    <span className={styles.resultMeta}>
                                        {r.kind?.toUpperCase() || ''} {r.airedOn?.year ? `• ${r.airedOn.year}` : ''}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {query.length >= 2 && !loading && results.length === 0 && (
                    <div className={styles.empty}>Ничего не найдено по «{query}»</div>
                )}
                {query.length === 0 && (
                    <div className={styles.hint}>Введите название аниме для поиска</div>
                )}
            </div>
        </div>
    );
}
