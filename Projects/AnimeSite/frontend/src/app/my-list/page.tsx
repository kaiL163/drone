'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './my-list.module.css';

const BACKEND_URL = 'http://212.119.42.49:8000';

interface UserListItem {
    id: number;
    shikimori_id: string;
    status: string;
    is_favorite: boolean;
    episodes_watched: number;
    score: number | null;
}

export default function MyListPage() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('all');
    const [listItems, setListItems] = useState<UserListItem[]>([]);
    const [animeData, setAnimeData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);

    const tabs = [
        { id: 'all', label: 'Все' },
        { id: 'watching', label: 'Смотрю' },
        { id: 'planned', label: 'В планах' },
        { id: 'completed', label: 'Просмотрено' },
        { id: 'on_hold', label: 'Отложено' },
        { id: 'dropped', label: 'Брошено' },
        { id: 'favorites', label: 'Любимое' }
    ];

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        fetchUserList();
    }, [isAuthenticated, router]);

    const fetchUserList = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${BACKEND_URL}/users/me/list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data: UserListItem[] = await res.json();
                setListItems(data);

                // Fetch metadata for all shikimori_ids
                const ids = data.map(item => item.shikimori_id);
                if (ids.length > 0) {
                    await fetchAnimeMetadata(ids);
                }
            }
        } catch (err) {
            console.error("Failed to fetch list", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAnimeMetadata = async (ids: string[]) => {
        try {
            // we can use shikimori/catalog endpoint with search or just standard gql
            // A more robust way: use the /shikimori/catalog proxy but we need to pass strict ids.
            // For now, let's fetch directly from Shikimori GraphQL proxy if we have one, or direct fetch.
            // We'll write a simple graphql query direct to Shikimori
            const query = `
            query {
              animes(ids: "${ids.join(',')}", limit: 50) {
                id
                name
                russian
                score
                poster { originalUrl }
                episodes
                episodesAired
                status
                kind
                airedOn { year }
              }
            }
            `;
            const res = await fetch('https://shikimori.one/api/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (res.ok) {
                const json = await res.json();
                const animes = json.data?.animes || [];
                const dataMap: Record<string, any> = {};
                animes.forEach((anime: any) => {
                    dataMap[anime.id] = {
                        id: anime.id,
                        title: anime.russian || anime.name,
                        image: anime.poster?.originalUrl ? `https://shikimori.one${anime.poster.originalUrl}` : null,
                        score: anime.score,
                        year: anime.airedOn?.year,
                        episodes: anime.episodes,
                        episodesAired: anime.episodesAired,
                        kind: anime.kind,
                        status: anime.status
                    };
                });
                setAnimeData(dataMap);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading) return <div className={styles.loading}>Загрузка списка...</div>;

    let filteredList = listItems;
    if (activeTab === 'favorites') {
        filteredList = listItems.filter(item => item.is_favorite);
    } else if (activeTab !== 'all') {
        filteredList = listItems.filter(item => item.status === activeTab);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Списки {user?.username}</h1>
            </div>

            <div className={styles.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span className={styles.count}>
                            {tab.id === 'all'
                                ? listItems.length
                                : tab.id === 'favorites'
                                    ? listItems.filter(i => i.is_favorite).length
                                    : listItems.filter(i => i.status === tab.id).length}
                        </span>
                    </button>
                ))}
            </div>

            {filteredList.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>В этом списке пока нет аниме :(</p>
                    <button className={styles.discoverBtn} onClick={() => router.push('/search')}>
                        Найти аниме
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredList.map(item => {
                        const anime = animeData[item.shikimori_id];
                        if (!anime) return null;

                        return (
                            <div key={item.shikimori_id} className={styles.cardWrapper}>
                                <Link href={`/title/${anime.id}`} className={styles.card}>
                                    <div className={styles.cardImage}>
                                        {anime.image ? (
                                            <img
                                                src={anime.image}
                                                alt={anime.title}
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
                                        {anime.status === 'ongoing' && (
                                            <span className={styles.ongoingBadge}>Онгоинг</span>
                                        )}
                                        {anime.score && anime.score > 0 ? (
                                            <div className={styles.cardScore}>★ {anime.score}</div>
                                        ) : null}
                                    </div>
                                    <div className={styles.cardInfo}>
                                        <h3 className={styles.cardTitle}>{anime.title}</h3>
                                        <p className={styles.cardMeta}>
                                            {/* We need a small helper for kind if we want it nice, but for now just show year */}
                                            {anime.year ? `${anime.year}` : ''}
                                        </p>
                                    </div>
                                </Link>
                                <div className={styles.progressOverlay}>
                                    <span className={styles.progressText}>
                                        Серии: {item.episodes_watched} / {anime.episodes || anime.episodesAired || '?'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
