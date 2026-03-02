'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ShikimoriAnime, kindLabel } from '@/lib/api';
import styles from './AnimeCarousel.module.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2000&auto=format&fit=crop';

interface AnimeCarouselProps {
    title: string;
    items: ShikimoriAnime[];
    viewAllLink?: string;
}

export default function AnimeCarousel({ title, items, viewAllLink }: AnimeCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -800 : 800;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className={styles.carouselSection}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                </div>
                <div className={styles.skeletonContainer}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.carouselSection}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.controls}>
                    {viewAllLink && (
                        <Link href={viewAllLink} className={styles.viewAllBtn}>
                            Смотреть все
                        </Link>
                    )}
                    <button className={styles.navBtn} onClick={() => scroll('left')} aria-label="Скролл влево">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button className={styles.navBtn} onClick={() => scroll('right')} aria-label="Скролл вправо">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.scrollContainer} ref={scrollContainerRef}>
                {items.map(item => {
                    const src = item.poster?.originalUrl || FALLBACK_IMG;
                    const itemTitle = item.russian || item.name;
                    const year = item.airedOn?.year;

                    return (
                        <Link key={item.id} href={`/title/${item.id}`} className={styles.card}>
                            <div className={styles.imageContainer}>
                                <img
                                    src={src}
                                    alt={itemTitle}
                                    className={styles.image}
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                                {item.score && item.score > 0 && (
                                    <div className={styles.score}>★ {item.score}</div>
                                )}
                                <div className={styles.overlay}>
                                    <div className={styles.playBtn}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <polygon points="5 3 19 12 5 21 5 3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <h3 className={styles.cardTitle}>{itemTitle}</h3>
                            <p className={styles.cardSubtitle}>
                                {kindLabel(item.kind)} {year ? `• ${year}` : ''}
                            </p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
