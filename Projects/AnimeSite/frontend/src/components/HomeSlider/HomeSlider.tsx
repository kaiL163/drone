'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShikimoriAnime, kindLabel, fetchAniListBanner } from '@/lib/api';
import styles from './HomeSlider.module.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2000&auto=format&fit=crop';

interface HomeSliderProps {
    items: ShikimoriAnime[];
}

export default function HomeSlider({ items }: HomeSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [banners, setBanners] = useState<Record<string, string>>({});

    // Parallel Fetch Banners
    useEffect(() => {
        if (!items || items.length === 0) return;

        const loadBanners = async () => {
            try {
                const bannerPromises = items.map(async (item) => {
                    const titleQuery = item.name || item.russian;
                    if (!titleQuery) return null;

                    const banner = await fetchAniListBanner(titleQuery);
                    return banner ? { id: item.id, banner } : null;
                });

                const results = await Promise.all(bannerPromises);
                const newBanners: Record<string, string> = {};

                results.forEach(res => {
                    if (res) newBanners[res.id] = res.banner;
                });

                setBanners(prev => ({ ...prev, ...newBanners }));
            } catch (err) {
                console.error("HomeSlider banner fetch failed:", err);
            }
        };

        loadBanners();
    }, [items]);

    useEffect(() => {
        if (!items || items.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 5000); // 5 seconds per slide
        return () => clearInterval(timer);
    }, [items]);

    if (!items || items.length === 0) {
        return <div className={styles.sliderSkeleton} />;
    }

    return (
        <div className={styles.sliderContainer}>
            {items.map((item, index) => {
                const isActive = index === currentIndex;
                const imgSrc = banners[item.id] || item.poster?.originalUrl || FALLBACK_IMG;
                const itemTitle = item.russian || item.name;
                const itemYear = item.airedOn?.year;

                return (
                    <div
                        key={item.id}
                        className={`${styles.slide} ${isActive ? styles.slideActive : ''}`}
                    >
                        <div className={styles.imageWrapper}>
                            <img
                                src={imgSrc}
                                alt={itemTitle}
                                className={styles.sliderImage}
                                loading={index === 0 ? "eager" : "lazy"}
                                referrerPolicy="no-referrer"
                            />
                            <div className={styles.sliderOverlay} />
                        </div>

                        <div className={styles.slideContent}>
                            <div className={styles.metaInfo}>
                                <span className={styles.badge}>{kindLabel(item.kind)}</span>
                                {item.score > 0 && (
                                    <span className={styles.scoreBadge}>★ {item.score}</span>
                                )}
                                {itemYear && <span className={styles.year}>{itemYear}</span>}
                            </div>
                            <h2 className={styles.title}>{itemTitle}</h2>
                            <p className={styles.statusText}>{item.status === 'ongoing' ? 'Онгоинг' : 'Вышел'}</p>
                            <Link href={`/title/${item.id}`} className={styles.watchBtn}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Смотреть сейчас
                            </Link>
                        </div>
                    </div>
                );
            })}

            <div className={styles.indicators}>
                {items.map((_, index) => (
                    <button
                        key={index}
                        className={`${styles.indicatorBtn} ${index === currentIndex ? styles.indicatorActive : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
