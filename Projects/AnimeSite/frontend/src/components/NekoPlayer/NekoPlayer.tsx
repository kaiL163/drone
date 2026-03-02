'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import styles from './NekoPlayer.module.css';

export interface NekoEpisode {
    episode: number;
    links: Record<string, string>;
    hls?: string;
    name?: string;
}

export interface NekoSeason {
    season: number;
    episodes: NekoEpisode[];
}

export interface NekoSource {
    translation_title: string;
    translation_id: number;
    links: Record<string, string>;
    hls?: string;
    seasons: NekoSeason[];
}

interface NekoPlayerProps {
    sources: NekoSource[];
    shikimoriId: string;
    animeTitle?: string;
}

type Quality = '360' | '480' | '720' | '1080';
const STORAGE_KEY = (id: string, trans: number, ep: string) => `neko_progress_${id}_${trans}_${ep}`;

export default function NekoPlayer({ sources, shikimoriId, animeTitle }: NekoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<any>(null);
    const savedTimeRef = useRef(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const qualRef = useRef<HTMLDivElement>(null);
    const transRef = useRef<HTMLDivElement>(null);

    // Indices for selection
    const [sourceIdx, setSourceIdx] = useState(0);
    const [seasonIdx, setSeasonIdx] = useState(0);
    const [episodeIdx, setEpisodeIdx] = useState(0);

    const activeSource = sources[sourceIdx];
    const isSerial = activeSource?.seasons && activeSource.seasons.length > 0;

    // Active Episode / Content
    const activeEpisode = useMemo(() => {
        if (!isSerial) return null;
        return activeSource.seasons[seasonIdx]?.episodes[episodeIdx] || null;
    }, [isSerial, activeSource, seasonIdx, episodeIdx]);

    // Available qualities for current content
    const availableQualities = useMemo(() => {
        const links = activeEpisode ? activeEpisode.links : activeSource?.links;
        if (!links) return [];
        return Object.keys(links).sort((a, b) => parseInt(b) - parseInt(a)) as Quality[];
    }, [activeEpisode, activeSource]);

    const [quality, setQuality] = useState<Quality>('720');
    const [qualOpen, setQualOpen] = useState(false);
    const [transOpen, setTransOpen] = useState(false);
    const [epsOpen, setEpsOpen] = useState(false);

    // Playback state
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const getUrl = useCallback(() => {
        const links = activeEpisode ? activeEpisode.links : activeSource?.links;
        const hls = activeEpisode ? activeEpisode.hls : activeSource?.hls;

        // Prefer HLS if manifest is provided
        if (hls) return hls;
        if (!links) return '';

        // Fallback to quality
        return links[quality] || Object.values(links)[0] || '';
    }, [activeEpisode, activeSource, quality]);

    const loadVideo = useCallback(async () => {
        const video = videoRef.current;
        if (!video || (!activeSource && !activeEpisode)) return;

        const url = getUrl();
        if (!url) return;

        if (url.includes('.m3u8')) {
            const { default: Hls } = await import('hls.js');
            if (hlsRef.current) hlsRef.current.destroy();
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    restoreProgress(video);
                });
                hlsRef.current = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
            }
        } else {
            // Direct MP4
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            video.src = url;
            video.onloadedmetadata = () => restoreProgress(video);
        }
    }, [activeSource, activeEpisode, getUrl]);

    const restoreProgress = (video: HTMLVideoElement) => {
        const epKey = activeEpisode ? `s${activeSeason?.season}e${activeEpisode.episode}` : 'movie';
        const storageKey = STORAGE_KEY(shikimoriId, activeSource.translation_id, epKey);
        const storageTime = parseFloat(localStorage.getItem(storageKey) || '0');
        const target = savedTimeRef.current > 0 ? savedTimeRef.current : storageTime;
        if (target > 5 && target < (video.duration - 10)) video.currentTime = target;
        savedTimeRef.current = 0;
    };

    useEffect(() => { loadVideo(); }, [loadVideo]);

    const activeSeason = activeSource?.seasons[seasonIdx];

    // Video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            const epKey = activeEpisode ? `s${activeSeason?.season}e${activeEpisode.episode}` : 'movie';
            if (video.currentTime > 5 && video.duration > 30) {
                localStorage.setItem(STORAGE_KEY(shikimoriId, activeSource.translation_id, epKey), String(video.currentTime));
            }
            if (video.buffered.length > 0) {
                setBuffered((video.buffered.end(video.buffered.length - 1) / (video.duration || 1)) * 100);
            }
        };
        const onDurationChange = () => setDuration(video.duration || 0);
        const onVolumeChange = () => { setVolume(video.volume); setMuted(video.muted); };
        const onFsChange = () => setFullscreen(!!document.fullscreenElement);

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('volumechange', onVolumeChange);
        document.addEventListener('fullscreenchange', onFsChange);

        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('volumechange', onVolumeChange);
            document.removeEventListener('fullscreenchange', onFsChange);
        };
    }, [activeEpisode, activeSource, activeSeason, shikimoriId]);

    const resetHide = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
    }, [playing]);

    // External clicks
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (qualRef.current && !qualRef.current.contains(e.target as Node)) setQualOpen(false);
            if (transRef.current && !transRef.current.contains(e.target as Node)) setTransOpen(false);
            if (!wrapperRef.current?.contains(e.target as Node)) setEpsOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        v.paused ? v.play() : v.pause();
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const bar = progressRef.current;
        const v = videoRef.current;
        if (!bar || !v || !duration) return;
        const rect = bar.getBoundingClientRect();
        v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
    };

    const setVol = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = videoRef.current;
        if (!v) return;
        const val = parseFloat(e.target.value);
        v.volume = val;
        v.muted = val === 0;
    };

    const toggleMute = () => {
        const v = videoRef.current;
        if (v) v.muted = !v.muted;
    };

    const toggleFs = () => {
        const el = wrapperRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            el.requestFullscreen().catch(() => { });
        }
    };

    const selectQuality = (q: Quality) => {
        if (videoRef.current) savedTimeRef.current = videoRef.current.currentTime;
        setQuality(q);
        setQualOpen(false);
    };

    const selectTranslation = (idx: number) => {
        if (videoRef.current) savedTimeRef.current = videoRef.current.currentTime;
        setSourceIdx(idx);
        setTransOpen(false);
    };

    const selectEpisode = (idx: number) => {
        savedTimeRef.current = 0;
        setEpisodeIdx(idx);
        setPlaying(false);
        setEpsOpen(false);
    };

    const goEpisode = (dir: number) => {
        const newIdx = episodeIdx + dir;
        if (newIdx >= 0 && newIdx < activeSeason.episodes.length) {
            selectEpisode(newIdx);
        }
    };

    const fmt = (s: number) => {
        if (!isFinite(s)) return '0:00';
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        return `${m}:${String(sec).padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const hasNext = isSerial && episodeIdx < activeSeason.episodes.length - 1;
    const hasPrev = isSerial && episodeIdx > 0;

    if (!activeSource) return <div className={styles.error}>Нет доступных источников</div>;

    return (
        <div className={styles.root} ref={wrapperRef}>
            {/* ── Player Header ───────────────────── */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <span className={styles.mainTitle}>{animeTitle || 'Аниме'}</span>
                    {activeEpisode ? (
                        <span className={styles.subTitle}>Серия {activeEpisode.episode}</span>
                    ) : (
                        <span className={styles.subTitle}>Фильм</span>
                    )}
                </div>

                <div className={styles.nav}>
                    {/* Translation Switcher */}
                    <div className={styles.dropdown} ref={transRef}>
                        <button className={styles.navBtn} onClick={() => setTransOpen(o => !o)}>
                            {activeSource.translation_title}
                        </button>
                        {transOpen && (
                            <div className={styles.dropdownMenu}>
                                {sources.map((s, i) => (
                                    <button key={i}
                                        className={`${styles.menuItem} ${sourceIdx === i ? styles.menuItemActive : ''}`}
                                        onClick={() => selectTranslation(i)}>
                                        {s.translation_title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {isSerial && (
                        <div className={styles.epNav}>
                            <button className={styles.navBtn} onClick={() => setEpsOpen(o => !o)}>
                                Серии
                            </button>
                            <button className={styles.navBtn} disabled={!hasPrev} onClick={() => goEpisode(-1)}>
                                Пред.
                            </button>
                            <button className={styles.navBtn} disabled={!hasNext} onClick={() => goEpisode(1)}>
                                След.
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Video Wrap ──────────────────────── */}
            <div
                className={`${styles.videoWrap} ${showControls || !playing ? styles.active : ''}`}
                onMouseMove={resetHide}
                onMouseLeave={() => { if (playing) setShowControls(false); }}
                onClick={togglePlay}
            >
                <video ref={videoRef} className={styles.video} playsInline />

                {!playing && (
                    <div className={styles.bigPlayWrap}>
                        <div className={styles.bigPlay}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Episode Overlay */}
                {epsOpen && isSerial && (
                    <div className={styles.epsOverlay} onClick={e => e.stopPropagation()}>
                        <div className={styles.epsHeader}>
                            <h3>Выбор серии</h3>
                            <button className={styles.closeBtn} onClick={() => setEpsOpen(false)}>×</button>
                        </div>
                        <div className={styles.epsGrid}>
                            {activeSeason.episodes.map((ep, i) => (
                                <button
                                    key={i}
                                    className={`${styles.epItem} ${episodeIdx === i ? styles.epItemActive : ''}`}
                                    onClick={() => selectEpisode(i)}
                                >
                                    <span className={styles.epNum}>{ep.episode}</span>
                                    <span className={styles.epName}>{ep.name || `Серия ${ep.episode}`}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Controls ────────────────────────── */}
                <div className={styles.controlsWrap} onClick={e => e.stopPropagation()}>
                    <div className={styles.progressBar} ref={progressRef} onClick={seek}>
                        <div className={styles.progressBuf} style={{ width: `${buffered}%` }} />
                        <div className={styles.progressFill} style={{ width: `${progress}%` }}>
                            <div className={styles.progressDot} />
                        </div>
                    </div>

                    <div className={styles.ctrlRow}>
                        <div className={styles.ctrlLeft}>
                            <button className={styles.btn} onClick={togglePlay}>
                                {playing
                                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                }
                            </button>
                            <span className={styles.time}>{fmt(currentTime)} / {fmt(duration)}</span>
                        </div>

                        <div className={styles.ctrlRight}>
                            {/* Quality Switcher */}
                            {!activeSource.hls && availableQualities.length > 0 && (
                                <div className={styles.dropdown} ref={qualRef}>
                                    <button className={styles.qualBtn} onClick={() => setQualOpen(o => !o)}>
                                        {quality}p
                                    </button>
                                    {qualOpen && (
                                        <div className={styles.dropdownMenu}>
                                            {availableQualities.map(q => (
                                                <button key={q}
                                                    className={`${styles.menuItem} ${quality === q ? styles.menuItemActive : ''}`}
                                                    onClick={() => selectQuality(q)}>
                                                    {q}p
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Volume */}
                            <div className={styles.volGroup}>
                                <button className={styles.btn} onClick={toggleMute}>
                                    {muted || volume === 0
                                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                                    }
                                </button>
                                <input className={styles.volSlider} type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={setVol} />
                            </div>

                            <button className={styles.btn} onClick={toggleFs}>
                                {fullscreen ? '⤓' : '⤢'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
