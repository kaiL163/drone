'use client';

import styles from './page.module.css';

export default function Loading() {
    return (
        <div className={styles.page}>
            <div className={styles.content}>
                <div className={styles.infoSection}>
                    <div className={styles.posterWrapper} style={{ backgroundColor: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }}>
                        {/* Poster Skeleton */}
                    </div>
                    <div className={styles.details}>
                        <div className={styles.skeletonTitle} style={{ height: '40px', width: '60%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
                        <div className={styles.skeletonMeta} style={{ height: '20px', width: '40%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
                        <div className={styles.skeletonDesc} style={{ height: '100px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
                    </div>
                </div>
            </div>
            <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
