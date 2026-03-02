'use client';

import { useState, useEffect } from 'react';
import {
  ShikimoriAnime,
  fetchShikimoriCatalog,
  fetchPopularAnime,
  fetchRandomAnime,
  getCurrentSeason
} from '@/lib/api';
import HomeSlider from '@/components/HomeSlider/HomeSlider';
import AnimeCarousel from '@/components/AnimeCarousel/AnimeCarousel';
import ReleaseCalendar from '@/components/ReleaseCalendar/ReleaseCalendar';
import styles from './page.module.css';

export default function Home() {
  const [ongoing, setOngoing] = useState<ShikimoriAnime[]>([]);
  const [popular, setPopular] = useState<ShikimoriAnime[]>([]);
  const [random, setRandom] = useState<ShikimoriAnime[]>([]);

  // Slice top 5 for the slider, rest for the carousel
  const topSliderAnime = ongoing.slice(0, 5);
  const ongoingCarouselAnime = ongoing.slice(5);

  useEffect(() => {
    const controller = new AbortController();

    // Fetch Ongoing
    fetchShikimoriCatalog({
      status: 'ongoing',
      limit: 20,
      order: 'ranked',
      season: getCurrentSeason(),
      strict: true,
      signal: controller.signal
    }).then(data => { if (!controller.signal.aborted) setOngoing(data); });

    // Fetch Popular
    fetchPopularAnime(15).then(data => {
      if (!controller.signal.aborted) setPopular(data);
    });

    // Fetch Random
    fetchRandomAnime(15).then(data => {
      if (!controller.signal.aborted) setRandom(data);
    });

    return () => controller.abort();
  }, []);

  return (
    <div className={styles.page}>

      {/* 1. Слайдер с топовыми новинками */}
      <HomeSlider items={topSliderAnime} />

      <div className={styles.mainLayout}>
        <div className={styles.feedsColumn}>

          {/* 2. Лента рекомендаций */}
          <AnimeCarousel
            title="Новинки сезона"
            items={ongoingCarouselAnime}
            viewAllLink="/search?status=ongoing"
          />

          <AnimeCarousel
            title="Популярное за неделю"
            items={popular}
          />

          <AnimeCarousel
            title="Случайное аниме"
            items={random}
          />

        </div>

        <div className={styles.sidebarColumn}>
          {/* 3. Календарь релизов */}
          <ReleaseCalendar />
        </div>
      </div>

    </div>
  );
}
