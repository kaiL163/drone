import { notFound } from 'next/navigation';
import { fetchTitleByShikimoriId, kindLabel } from '@/lib/api';
import PlayerSection from '@/components/PlayerSection/PlayerSection';
import styles from './page.module.css';

interface TitlePageProps {
    params: Promise<{ alias: string }>;
}

export default async function TitlePage({ params }: TitlePageProps) {
    const { alias: shikimoriId } = await params;
    const data = await fetchTitleByShikimoriId(shikimoriId);

    if (!data.found || !data.metadata) {
        return (
            <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: '1rem' }}>
                        <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" />
                    </svg>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>404 Not Found</h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: '400px', lineHeight: 1.5 }}>
                        Данное аниме заблокировано в вашей стране, либо плеер не найден.
                    </p>
                </div>
            </div>
        );
    }

    const m = data.metadata;
    const posterUrl = m.poster || null;

    return (
        <div className={styles.page}>
            {posterUrl && (
                <div
                    className={styles.backdrop}
                    style={{ backgroundImage: `url(${posterUrl})` }}
                />
            )}

            <div className={styles.content}>
                <div className={styles.infoSection}>
                    {posterUrl && (
                        <div className={styles.posterWrapper}>
                            <img
                                src={posterUrl}
                                alt={m.title}
                                className={styles.poster}
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    )}

                    <div className={styles.details}>
                        <div className={styles.titleGroup}>
                            <span className={styles.type}>{kindLabel(m.anime_kind || '')}</span>
                            <h1 className={styles.title}>{m.title}</h1>
                            {m.title_orig && m.title_orig !== m.title && (
                                <p className={styles.titleEn}>{m.title_orig}</p>
                            )}
                        </div>

                        <div className={styles.meta}>
                            {m.year && <span className={styles.metaItem}>{m.year}</span>}
                            {m.episodes_total && (
                                <>
                                    <span className={styles.metaSep}>•</span>
                                    <span className={styles.metaItem}>
                                        {m.anime_status === 'ongoing'
                                            ? `${m.episodes_aired ?? '?'} / ${m.episodes_total} эп.`
                                            : `${m.episodes_total} эп.`}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className={styles.badges}>
                            {m.anime_status === 'ongoing' && (
                                <span className={styles.badgeOngoing}>● Онгоинг</span>
                            )}
                            {m.shikimori_rating && (
                                <span className={styles.badgeScore}>★ {m.shikimori_rating} Shikimori</span>
                            )}
                        </div>

                        {m.genres && m.genres.length > 0 && (
                            <div className={styles.genres}>
                                {m.genres.map((g, i) => (
                                    <span key={i} className={styles.genre}>{g}</span>
                                ))}
                            </div>
                        )}

                        {m.description && (
                            <p className={styles.description}>{m.description}</p>
                        )}

                        <div className={styles.actions}>
                            {m.anime_status === 'anons' ? (
                                <button className={styles.watchBtn} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                    Анонс (скоро)
                                </button>
                            ) : (
                                <a href="#player" className={styles.watchBtn}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    Смотреть
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {m.anime_status !== 'anons' && (
                    <div id="player" className={styles.playerSection}>
                        <h2 className={styles.sectionTitle}>Смотреть онлайн</h2>
                        <PlayerSection
                            shikimoriId={shikimoriId}
                            releaseName={m.title}
                            releaseNameEn={m.title_orig !== m.title ? m.title_orig : null}
                            kinopoiskId={m.kinopoisk_id}
                            initialTranslations={data.translations}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
