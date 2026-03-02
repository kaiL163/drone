'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

const KODIK_API = 'http://212.119.42.49:8000/shikimori/catalog';

// ── Filter options ────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: 'popularity', label: '🔥 Популярность/Обновления' },
    { value: 'ranked', label: '⭐ Рейтинг' },
    { value: 'aired_on', label: '📅 По году' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'Все' },
    { value: 'ongoing', label: '🟢 Онгоинги' },
    { value: 'released', label: '✅ Завершены' },
    { value: 'anons', label: '📢 Анонсы' },
];

const KIND_OPTIONS = [
    { value: '', label: 'Все' },
    { value: 'tv', label: 'ТВ-сериал' },
    { value: 'movie', label: 'Фильм' },
    { value: 'ova', label: 'OVA' },
    { value: 'ona', label: 'ONA' },
    { value: 'special', label: 'Спешл' },
];

const GENRE_OPTIONS = [
    { label: 'Экшен', value: '1' },
    { label: 'Приключения', value: '2' },
    { label: 'Комедия', value: '4' },
    { label: 'Детектив', value: '39' },
    { label: 'Драма', value: '8' },
    { label: 'Фэнтези', value: '10' },
    { label: 'Хоррор', value: '14' },
    { label: 'Романтика', value: '22' },
    { label: 'Фантастика', value: '24' },
    { label: 'Сёнен', value: '27' },
    { label: 'Сёдзе', value: '25' },
    { label: 'Школа', value: '23' },
    { label: 'Спорт', value: '30' },
    { label: 'Сверхъестественное', value: '37' },
    { label: 'Психологическое', value: '40' },
    { label: 'Повседневность', value: '36' },
    { label: 'Меха', value: '18' },
    { label: 'Триллер', value: '41' },
    { label: 'Военное', value: '38' },
    { label: 'Исторический', value: '13' },
    { label: 'Музыка', value: '19' },
    { label: 'Пародия', value: '20' },
    { label: 'Самураи', value: '21' },
    { label: 'Вампиры', value: '32' },
    { label: 'Исекай', value: '130' },
    { label: 'Мифология', value: '6' },
    { label: 'Этти', value: '9' },
    { label: 'Гарем', value: '35' },
    { label: 'Сейнен', value: '42' },
];

// ── Types ─────────────────────────────────────────────────────
interface ShikimoriAnime {
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

function kindLabel(k: string) {
    return ({ tv: 'ТВ', movie: 'Фильм', ova: 'OVA', ona: 'ONA', special: 'Спешл', tv_special: 'ТВ-спешл' } as Record<string, string>)[k] || (k?.toUpperCase() ?? '');
}

// ── Skeleton loader ───────────────────────────────────────────
function SkeletonGrid() {
    return (
        <div className={styles.loadingGrid}>
            {Array.from({ length: 24 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
    );
}

// ── Main content ──────────────────────────────────────────────
function SearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';
    const initialStatus = searchParams.get('status') || '';

    const [inputVal, setInputVal] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [sort, setSort] = useState('ranked');
    const [status, setStatus] = useState(initialStatus);
    const [kind, setKind] = useState('');
    const [genre, setGenre] = useState('');
    const [page, setPage] = useState(1);

    const [results, setResults] = useState<ShikimoriAnime[]>([]);
    const [loading, setLoading] = useState(true);
    const [firstLoad, setFirstLoad] = useState(true);
    const [hasMore, setHasMore] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    // ── Fetch ─────────────────────────────────────────────────
    const fetchResults = useCallback(async (pageNum = 1, append = false) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setLoading(true);
        try {
            const body: any = {
                limit: 24,
                page: pageNum,
                order: sort,
            };

            if (query.trim()) {
                body.search = query.trim();
            }

            if (status) body.status = status;
            if (kind) body.kind = kind;
            if (genre) body.genre = genre;

            const res = await fetch(KODIK_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (!res.ok) {
                if (!controller.signal.aborted) setResults(append ? prev => prev : []);
                return;
            }
            const data: any = await res.json();
            if (controller.signal.aborted) return;

            const newCards = data || [];

            if (!Array.isArray(newCards)) {
                setResults(append ? prev => prev : []);
                return;
            }

            // Shikimori API doesn't return total directly in GraphQL without meta query. 
            // So we'll assume there's more if we received exactly 'limit' items.
            setHasMore(newCards.length === 24);
            setResults(prev => append ? [...prev, ...newCards] : newCards);
            setPage(pageNum);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
        }
        setLoading(false);
        setFirstLoad(false);
    }, [query, sort, status, kind, genre]);

    // Reset and fetch on filter change
    useEffect(() => {
        setPage(1);
        setResults([]);
        setFirstLoad(true);
        fetchResults(1, false);
    }, [fetchResults]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setQuery(inputVal);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            fetchResults(page + 1, true);
        }
    };

    return (
        <div className={styles.page}>

            {/* ── Search bar ──────────────────────────────── */}
            <div className={styles.searchHeader}>
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className={styles.searchInput}
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        placeholder="Поиск аниме..."
                    />
                    {inputVal && (
                        <button type="button" className={styles.clearBtn}
                            onClick={() => { setInputVal(''); setQuery(''); }}>✕</button>
                    )}
                    <button type="submit" className={styles.searchBtn}>Найти</button>
                </form>

                {/* Sort chips — only in browse mode */}
                {!query.trim() && (
                    <div className={styles.sortRow}>
                        {SORT_OPTIONS.map(o => (
                            <button key={o.value}
                                className={`${styles.sortBtn} ${sort === o.value ? styles.sortBtnActive : ''}`}
                                onClick={() => setSort(o.value)}>
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Filter Panel ───────────────────────────── */}
            <div className={styles.filterPanel}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Статус</span>
                    <div className={styles.filterChips}>
                        {STATUS_OPTIONS.map(o => (
                            <button key={o.value}
                                className={`${styles.chip} ${status === o.value ? styles.chipActive : ''}`}
                                onClick={() => setStatus(o.value)}>{o.label}</button>
                        ))}
                    </div>
                </div>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Тип</span>
                    <div className={styles.filterChips}>
                        {KIND_OPTIONS.map(o => (
                            <button key={o.value}
                                className={`${styles.chip} ${kind === o.value ? styles.chipActive : ''}`}
                                onClick={() => setKind(o.value)}>{o.label}</button>
                        ))}
                    </div>
                </div>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Жанр</span>
                    <div className={styles.filterChips} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                        <button className={`${styles.chip} ${genre === '' ? styles.chipActive : ''}`}
                            onClick={() => setGenre('')}>Все</button>
                        {GENRE_OPTIONS.map(g => (
                            <button key={g.value}
                                className={`${styles.chip} ${genre === g.value ? styles.chipActive : ''}`}
                                onClick={() => setGenre(g.value)}>{g.label}</button>
                        ))}
                    </div>
                </div>
            </div>


            {/* ── Results header ───────────────────────────── */}
            <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>
                    {query ? `Результаты: «${query}»` : 'Каталог аниме'}
                </h2>
                {results.length > 0 && !firstLoad && (
                    <span className={styles.resultsCount}>{results.length}+ аниме</span>
                )}
            </div>

            {/* ── Grid ─────────────────────────────────────── */}
            {
                firstLoad ? <SkeletonGrid /> : results.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <span>Ничего не найдено</span>
                    </div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {results.map(item => (
                                <Link key={item.id} href={`/title/${item.id}`} className={styles.card}>
                                    <div className={styles.cardImage}>
                                        {item.poster?.originalUrl ? (
                                            <img
                                                src={item.poster.originalUrl}
                                                alt={item.russian || item.name}
                                                className={styles.cardImg}
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className={styles.cardImgPlaceholder} />
                                        )}
                                        {item.status === 'ongoing' && (
                                            <span className={styles.ongoingBadge}>Онгоинг</span>
                                        )}
                                        {item.score && item.score > 0 && (
                                            <div className={styles.cardScore}>★ {item.score}</div>
                                        )}
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardTitle}>{item.russian || item.name}</h3>
                                        <p className={styles.cardMeta}>
                                            {kindLabel(item.kind)}{item.airedOn?.year ? ` • ${item.airedOn.year}` : ''}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {hasMore && !loading && (
                            <div className={styles.loadMore}>
                                <button className={styles.loadMoreBtn} onClick={loadMore}>
                                    Загрузить ещё
                                </button>
                            </div>
                        )}
                        {loading && !firstLoad && (
                            <div className={styles.loadingMore}>Загрузка...</div>
                        )}
                    </>
                )
            }
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div style={{ padding: '2rem 4%', maxWidth: 1400, margin: '0 auto' }}>
                <div style={{ height: 52, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginBottom: '2rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '1.5rem 1rem' }}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} style={{ aspectRatio: '2/3', borderRadius: 12, background: 'rgba(255,255,255,0.06)' }} />
                    ))}
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
