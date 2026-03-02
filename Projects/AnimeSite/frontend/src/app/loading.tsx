'use client';

import styles from './page.module.css';

export default function Loading() {
    return (
        <div className={styles.page}>
            {/* Slider Skeleton */}
            <div style={{ width: '100%', height: '60vh', backgroundColor: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite', borderRadius: '16px', marginBottom: '2rem' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div>
                    {/* Feed Skeletons */}
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ marginBottom: '2rem' }}>
                            <div style={{ height: '30px', width: '200px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
                            <div style={{ display: 'flex', gap: '1rem', overflow: 'hidden' }}>
                                {[1, 2, 3, 4, 5].map(j => (
                                    <div key={j} style={{ flex: '0 0 160px', height: '240px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ height: '600px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
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
