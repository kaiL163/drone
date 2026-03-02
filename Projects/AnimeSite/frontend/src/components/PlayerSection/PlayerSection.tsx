'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateAnimeList } from '@/lib/api';
import styles from './PlayerSection.module.css';
import NekoPlayer from '../NekoPlayer/NekoPlayer';

const BACKEND_URL = 'http://212.119.42.49:8000';

interface Translation {
    translation_id: string;
    translation_title: string;
    translation_type: string;
    link: string;
    episodes_count?: number;
}

type PlayerType = 'kodik' | 'neko';

interface PlayerSectionProps {
    shikimoriId?: string | null;
    initialTranslations?: Translation[];
    releaseName: string;
    releaseNameEn?: string | null;
    kinopoiskId?: string | null;
}

export default function PlayerSection({
    shikimoriId,
    initialTranslations,
    releaseName,
}: PlayerSectionProps) {
    const { token, isAuthenticated } = useAuth();
    const [translations, setTranslations] = useState<Translation[]>(initialTranslations || []);
    const [selectedTranslation, setSelectedTranslation] = useState<string | null>(
        initialTranslations?.[0]?.translation_id || null
    );
    const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
    const [inputEpisode, setInputEpisode] = useState<string>('1');
    const [loading, setLoading] = useState(!initialTranslations?.length);
    const [error, setError] = useState(false);

    // Player state
    const [playerType, setPlayerType] = useState<PlayerType>('kodik');
    const [nekoSources, setNekoSources] = useState<any[]>([]);
    const [nekoLoading, setNekoLoading] = useState(false);

    const episodesListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = episodesListRef.current;
        if (!el) return;
        const handleNativeWheel = (e: WheelEvent) => {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };
        el.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleNativeWheel);
    }, [translations, selectedTranslation]);

    const scrollToEpisode = (ep: number) => {
        if (!episodesListRef.current) return;
        const scrollWrapper = episodesListRef.current;
        const btn = scrollWrapper.querySelector(`button[data-episode="${ep}"]`) as HTMLButtonElement | null;
        if (btn) {
            const scrollLeft = btn.offsetLeft - (scrollWrapper.clientWidth / 2) + (btn.clientWidth / 2);
            scrollWrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    };

    const handleEpisodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputEpisode(val);
        const parsed = parseInt(val, 10);
        const maxEps = currentTranslation?.episodes_count || 1;
        if (!isNaN(parsed) && parsed >= 1 && parsed <= maxEps) {
            setSelectedEpisode(parsed);
            scrollToEpisode(parsed);
        }
    };

    const handleEpisodeClick = (ep: number) => {
        setSelectedEpisode(ep);
        setInputEpisode(ep.toString());
        scrollToEpisode(ep);
    };

    const fetchKodik = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            if (!shikimoriId) return;
            const r = await fetch(`${BACKEND_URL}/kodik/by-shikimori/${shikimoriId}`);
            if (!r.ok) throw new Error("Kodik error");
            const data = await r.json();
            if (data.found && data.translations?.length) {
                setTranslations(data.results || data.translations);
                setSelectedTranslation(data.results?.[0]?.translation_id || data.translations?.[0]?.translation_id);
            } else {
                setError(true);
            }
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [shikimoriId]);

    const fetchNekoLinks = useCallback(async () => {
        if (!shikimoriId) return;
        setNekoLoading(true);
        try {
            const r = await fetch(`${BACKEND_URL}/anilibria/video-links/${shikimoriId}`);
            if (!r.ok) throw new Error("Neko error");
            const data = await r.json();
            if (data.found) setNekoSources(data.sources);
        } catch (e) {
            console.error(e);
        } finally {
            setNekoLoading(false);
        }
    }, [shikimoriId]);

    useEffect(() => {
        if (!initialTranslations?.length) fetchKodik();
    }, [initialTranslations, fetchKodik]);

    useEffect(() => {
        if (playerType === 'neko' && nekoSources.length === 0 && !nekoLoading) fetchNekoLinks();
    }, [playerType, nekoSources.length, nekoLoading, fetchNekoLinks]);

    const currentTranslation = translations.find(t => t.translation_id === selectedTranslation);

    // ── AUTOMATIC PROGRESS TRACKING ────────────────────────────

    // 1. Update when user explicitly changes episode
    useEffect(() => {
        if (!isAuthenticated || !token || !shikimoriId || playerType !== 'kodik') return;

        // Slightly debounce to avoid spamming while typing
        const timer = setTimeout(() => {
            updateAnimeList(token, {
                shikimori_id: shikimoriId,
                episodes_watched: selectedEpisode,
                status: 'watching' // Auto-switch to watching if not already
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [selectedEpisode, shikimoriId, token, isAuthenticated, playerType]);

    // 2. Listen for Kodik postMessage (Video End -> Next Episode)
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.key === 'kodik_player_video_ended') {
                const nextEp = selectedEpisode + 1;
                const maxEps = currentTranslation?.episodes_count || 999;

                if (nextEp <= maxEps) {
                    setSelectedEpisode(nextEp);
                    setInputEpisode(nextEp.toString());
                    scrollToEpisode(nextEp);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [selectedEpisode, currentTranslation]);

    // Determine which iframe URL to show
    const displayUrl = currentTranslation?.link
        ? `${currentTranslation.link}${currentTranslation.link.includes('?') ? '&' : '?'}hide_selectors=true&episode=${selectedEpisode}`
        : '';

    const episodesList = Array.from({ length: currentTranslation?.episodes_count || 1 }, (_, i) => i + 1);

    return (
        <div className={styles.wrapper}>
            {!loading && !error && (
                <div className={styles.playerTopBar}>
                    <div className={styles.playerSwitcher}>
                        <button
                            className={`${styles.switchBtn} ${playerType === 'kodik' ? styles.switchBtnActive : ''}`}
                            onClick={() => setPlayerType('kodik')}
                        >
                            Kodik Player
                        </button>
                        <button
                            className={`${styles.switchBtn} ${playerType === 'neko' ? styles.switchBtnActive : ''}`}
                            onClick={() => setPlayerType('neko')}
                        >
                            NekoPlayer (Beta)
                        </button>
                    </div>

                    {playerType === 'kodik' && translations.length > 0 && (
                        <div className={styles.kodikControls}>
                            <div className={styles.translationBar}>
                                <span className={styles.translationLabel}>Озвучка:</span>
                                <select
                                    className={styles.playerSelect}
                                    value={selectedTranslation || ''}
                                    onChange={e => {
                                        setSelectedTranslation(e.target.value);
                                        setSelectedEpisode(1);
                                        setInputEpisode('1');
                                        setTimeout(() => scrollToEpisode(1), 50);
                                    }}
                                >
                                    {translations.map(t => (
                                        <option key={t.translation_id} value={t.translation_id}>
                                            {t.translation_title}{t.translation_type === 'sub' ? ' (Субтитры)' : ''} {t.episodes_count ? `(${t.episodes_count} эп.)` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {episodesList.length > 1 && (
                                <div className={styles.episodeSelector}>
                                    <span className={styles.translationLabel}>Серия:</span>
                                    <input
                                        type="number"
                                        className={styles.episodeInput}
                                        value={inputEpisode}
                                        onChange={handleEpisodeInputChange}
                                        min={1}
                                        max={currentTranslation?.episodes_count || 1}
                                    />
                                    <div className={styles.episodeListScrollWrapper} ref={episodesListRef}>
                                        <div className={styles.episodeList}>
                                            {episodesList.map(ep => (
                                                <button
                                                    key={ep}
                                                    data-episode={ep}
                                                    onClick={() => handleEpisodeClick(ep)}
                                                    className={`${styles.episodeBtn} ${selectedEpisode === ep ? styles.episodeBtnActive : ''}`}
                                                >
                                                    {ep}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.playerArea}>
                {loading && (
                    <div className={styles.kodikState}>
                        <div className={styles.spinner} />
                        <span>Загрузка плеера...</span>
                    </div>
                )}

                {nekoLoading && playerType === 'neko' && (
                    <div className={styles.kodikState}>
                        <div className={styles.spinner} />
                        <span>Инициализация NekoPlayer...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className={styles.kodikState}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
                        </svg>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span>Плеер недоступен</span>
                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Данное аниме пока не вышло или перевод еще не добавлен.</span>
                        </div>
                    </div>
                )}

                {!loading && !error && playerType === 'neko' && nekoSources.length > 0 && (
                    <NekoPlayer
                        sources={nekoSources}
                        shikimoriId={shikimoriId || 'unknown'}
                        animeTitle={releaseName}
                    />
                )}

                {!loading && !error && playerType === 'kodik' && displayUrl && (
                    <iframe
                        key={displayUrl}
                        src={displayUrl}
                        className={styles.kodikFrame}
                        allowFullScreen
                        allow="autoplay; fullscreen"
                        scrolling="yes"
                        frameBorder="0"
                    />
                )}

                {!loading && !error && playerType === 'kodik' && !displayUrl && (
                    <div className={styles.kodikState}>
                        <div className={styles.spinner} />
                        <span>Загрузка...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
