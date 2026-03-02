'use client';

interface AnimeImageProps {
    previewSrc: string | null;
    originalSrc: string | null;
    alt: string;
    className: string;
    placeholderClassName: string;
}

export default function AnimeImage({ previewSrc, originalSrc, alt, className, placeholderClassName }: AnimeImageProps) {
    let src = previewSrc || originalSrc;
    if (!src) return <div className={placeholderClassName} />;

    // Use our internal proxy for Shikimori to bypass Cloudflare 403 hotlink protection
    if (!src.startsWith('http')) {
        src = `/api/img?url=${encodeURIComponent(`https://shikimori.io${src}`)}`;
    } else if (src.includes('shikimori.')) {
        src = `/api/img?url=${encodeURIComponent(src.replace('shikimori.one', 'shikimori.io'))}`;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
                const t = e.currentTarget;
                if (originalSrc) {
                    const fallback = originalSrc.startsWith('http') ? originalSrc : `https://shikimori.io${originalSrc}`;
                    if (t.src !== fallback) {
                        t.src = fallback;
                        return;
                    }
                }
                t.style.display = 'none';
                t.parentElement?.classList.add('no-image');
            }}
        />
    );
}
