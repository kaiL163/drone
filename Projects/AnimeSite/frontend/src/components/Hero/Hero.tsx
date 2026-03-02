import styles from './Hero.module.css';

interface HeroProps {
    title: string;
    description: string;
    imageUrl: string;
    badge?: string;
}

export default function Hero({ title, description, imageUrl, badge }: HeroProps) {
    return (
        <section className={styles.hero}>
            {/* Fallback image if user doesn't have an anime DB yet. Let's use an unoptimized external URL for demo */}
            <img
                src={imageUrl}
                alt={title}
                className={styles.heroImage}
                referrerPolicy="no-referrer"
            />
            <div className={styles.overlay} />
            <div className={styles.glow} />

            <div className={styles.content}>
                {badge && <span className={styles.badge}>{badge}</span>}
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.description}>{description}</p>

                <div className={styles.actions}>
                    <button className={styles.playBtn}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        Смотреть
                    </button>
                    <button className={styles.moreBtn}>
                        Подробнее
                    </button>
                </div>
            </div>
        </section>
    );
}
