'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './VideoPlayer.module.css';
import { AnilibriaV1Episode } from '@/types/anilibria';

interface VideoPlayerProps {
    episodes: AnilibriaV1Episode[];
    cdnUrl: string;
    releaseAlias?: string;
}

type Quality = '480' | '720' | '1080';
const STORAGE_KEY = (alias: string, epId: string) => `neko_progress_${alias}_${epId}`;

export default function VideoPlayer({ episodes, cdnUrl, releaseAlias = 'unknown' }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<unknown>(null);
    const savedTimeRef = useRef(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const qualRef = useRef<HTMLDivElement>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const currentEpisode = episodes[currentIndex];
    const [quality, setQuality] = useState<Quality>('720');
    const [qualOpen, setQualOpen] = useState(false);

    // Playback state
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);

    const getHlsUrl = (ep: AnilibriaV1Episode, q: Quality) =>
        ({ '480': ep.hls_480, '720': ep.hls_720, '1080': ep.hls_1080 })[q];

    const loadHls = useCallback(async () => {
        const video = videoRef.current;
        if (!video || !currentEpisode) return;
        const hlsUrl = getHlsUrl(currentEpisode, quality);
        const { default: Hls } = await import('hls.js');
        if (hlsRef.current) (hlsRef.current as { destroy(): void }).destroy();
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const storageTime = parseFloat(localStorage.getItem(STORAGE_KEY(releaseAlias, currentEpisode.id)) || '0');
                const target = savedTimeRef.current > 0 ? savedTimeRef.current : storageTime;
                if (target > 5) video.currentTime = target;
                savedTimeRef.current = 0;
            });
            hlsRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl;
        }
    }, [currentEpisode, quality, releaseAlias]);

    useEffect(() => { loadHls(); }, [loadHls]);

    // Video events
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const onPlay = () => setPlaying(true);
        const onPause = () => setPlaying(false);
        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            if (video.currentTime > 5) {
                localStorage.setItem(STORAGE_KEY(releaseAlias, currentEpisode.id), String(video.currentTime));
            }
            if (video.buffered.length > 0) {
                setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
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
    }, [currentEpisode, releaseAlias]);

    // Auto-hide controls
    const resetHide = useCallback(() => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
    }, [playing]);

    // Quality dropdown close on outside click
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (qualRef.current && !qualRef.current.contains(e.target as Node)) setQualOpen(false);
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
        document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
    };

    const goEpisode = (idx: number) => {
        savedTimeRef.current = 0;
        setCurrentIndex(idx);
        setPlaying(false);
    };

    const selectQuality = (q: Quality) => {
        if (videoRef.current) savedTimeRef.current = videoRef.current.currentTime;
        setQuality(q);
        setQualOpen(false);
    };

    const fmt = (s: number) => {
        if (!isFinite(s)) return '0:00';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < episodes.length - 1;

    return (
        <div className={styles.root} ref={wrapperRef}>
            {/* ── Episode header ───────────────────── */}
            <div className={styles.epHeader}>
                <div className={styles.epTitleGroup}>
                    <span className={styles.epNum}>Серия {currentEpisode.ordinal}</span>
                    <span className={styles.epName}>{currentEpisode.name}</span>
                </div>
                <div className={styles.epNav}>
                    <button
                        className={styles.epNavBtn}
                        disabled={!hasPrev}
                        onClick={() => goEpisode(currentIndex - 1)}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="15 18 9 12 15 6 15 18" /></svg>
                        {hasPrev ? `${episodes[currentIndex - 1].ordinal} серия` : 'Нет'}
                    </button>
                    <button
                        className={styles.epNavBtn}
                        disabled={!hasNext}
                        onClick={() => goEpisode(currentIndex + 1)}
                    >
                        {hasNext ? `${episodes[currentIndex + 1].ordinal} серия` : 'Нет'}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="9 18 15 12 9 6 9 18" /></svg>
                    </button>
                </div>
            </div>

            {/* ── Video area ───────────────────────── */}
            <div
                className={`${styles.videoWrap} ${showControls || !playing ? styles.active : ''}`}
                onMouseMove={resetHide}
                onMouseLeave={() => { if (playing) setShowControls(false); }}
                onClick={togglePlay}
            >
                <video
                    ref={videoRef}
                    className={styles.video}
                    playsInline
                    poster={currentEpisode.preview?.optimized?.src
                        ? `https://anilibria.top${currentEpisode.preview.optimized.src}`
                        : undefined}
                />

                {/* Large centered play button */}
                {!playing && (
                    <div className={styles.bigPlayWrap}>
                        <div className={styles.bigPlay}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        </div>
                    </div>
                )}

                {/* Bottom controls */}
                <div className={styles.controlsWrap} onClick={e => e.stopPropagation()}>
                    {/* Progress */}
                    <div className={styles.progressBar} ref={progressRef} onClick={seek}>
                        <div className={styles.progressBuf} style={{ width: `${buffered}%` }} />
                        <div className={styles.progressFill} style={{ width: `${progress}%` }}>
                            <div className={styles.progressDot} />
                        </div>
                    </div>

                    {/* Control row */}
                    <div className={styles.ctrlRow}>
                        {/* Left */}
                        <div className={styles.ctrlLeft}>
                            <button className={styles.btn} onClick={togglePlay}>
                                {playing
                                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                }
                            </button>
                            <span className={styles.time}>{fmt(currentTime)} / {fmt(duration)}</span>
                        </div>

                        {/* Right */}
                        <div className={styles.ctrlRight}>
                            {/* Quality */}
                            <div className={styles.qualWrap} ref={qualRef}>
                                <button className={styles.qualBtn} onClick={() => setQualOpen(o => !o)}>
                                    {quality}p
                                </button>
                                {qualOpen && (
                                    <div className={styles.qualMenu}>
                                        {(['1080', '720', '480'] as Quality[]).map(q => (
                                            <button key={q}
                                                className={`${styles.qualItem} ${quality === q ? styles.qualItemActive : ''}`}
                                                onMouseDown={() => selectQuality(q)}
                                            >
                                                {q}p
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Volume */}
                            <button className={styles.btn} onClick={toggleMute}>
                                {muted || volume === 0
                                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                                }
                            </button>
                            <input
                                className={styles.volSlider}
                                type="range" min="0" max="1" step="0.05"
                                value={muted ? 0 : volume}
                                onChange={setVol}
                                onClick={e => e.stopPropagation()}
                            />

                            {/* Fullscreen */}
                            <button className={styles.btn} onClick={toggleFs}>
                                {fullscreen
                                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
