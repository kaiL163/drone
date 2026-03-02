'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    fetchUserList,
    updateAnimeList,
    removeFromList,
    AnimeListItem
} from '@/lib/api';
import styles from './ListActions.module.css';

interface ListActionsProps {
    shikimoriId: string;
    totalEpisodes?: number | null;
}

const STATUS_MAP = [
    { value: 'planned', label: 'В планах' },
    { value: 'watching', label: 'Смотрю' },
    { value: 'completed', label: 'Завершено' },
    { value: 'on_hold', label: 'Отложено' },
    { value: 'dropped', label: 'Брошено' },
];

export default function ListActions({ shikimoriId, totalEpisodes }: ListActionsProps) {
    const { token, isAuthenticated } = useAuth();
    const [listItem, setListItem] = useState<AnimeListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Initial load
    useEffect(() => {
        if (!isAuthenticated || !token) {
            setLoading(false);
            return;
        }

        const loadStatus = async () => {
            const list = await fetchUserList(token);
            const found = list.find(item => item.shikimori_id === shikimoriId);
            setListItem(found || null);
            setLoading(false);
        };

        loadStatus();
    }, [shikimoriId, token, isAuthenticated]);

    const handleAdd = async () => {
        if (!token) return;
        setUpdating(true);
        const newItem = await updateAnimeList(token, {
            shikimori_id: shikimoriId,
            status: 'planned'
        });
        if (newItem) setListItem(newItem);
        setUpdating(false);
    };

    const handleStatusChange = async (status: string) => {
        if (!token) return;
        setUpdating(true);
        const updated = await updateAnimeList(token, {
            shikimori_id: shikimoriId,
            status
        });
        if (updated) setListItem(updated);
        setUpdating(false);
    };

    const handleEpisodeChange = async (ep: number) => {
        if (!token || !listItem) return;
        const max = totalEpisodes || 9999;
        const newEp = Math.max(0, Math.min(max, ep));

        if (newEp === listItem.episodes_watched) return;

        setUpdating(true);
        const updated = await updateAnimeList(token, {
            shikimori_id: shikimoriId,
            episodes_watched: newEp
        });
        if (updated) setListItem(updated);
        setUpdating(false);
    };

    const handleRemove = async () => {
        if (!token || !confirm('Удалить аниме из вашего списка?')) return;
        setUpdating(true);
        const success = await removeFromList(token, shikimoriId);
        if (success) setListItem(null);
        setUpdating(false);
    };

    if (loading) return <div className={styles.container}><div className={styles.addBtn}>Загрузка...</div></div>;
    if (!isAuthenticated) return null;

    if (!listItem) {
        return (
            <div className={styles.container}>
                <button
                    className={`${styles.addBtn} ${updating ? styles.loading : ''}`}
                    onClick={handleAdd}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Добавить в список
                </button>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${updating ? styles.loading : ''}`}>
            {/* Status Dropdown */}
            <div className={styles.statusWrapper}>
                <span className={styles.statusLabel}>Статус:</span>
                <select
                    className={styles.statusSelect}
                    value={listItem.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                >
                    {STATUS_MAP.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Episode Progress */}
            <div className={styles.progressWrapper}>
                <span className={styles.progressLabel}>Серии:</span>
                <div className={styles.progressControls}>
                    <button
                        className={styles.stepBtn}
                        onClick={() => handleEpisodeChange(listItem.episodes_watched - 1)}
                    >
                        -
                    </button>
                    <input
                        type="number"
                        className={styles.input}
                        value={listItem.episodes_watched}
                        onChange={(e) => handleEpisodeChange(parseInt(e.target.value) || 0)}
                        onBlur={(e) => handleEpisodeChange(parseInt(e.target.value) || 0)}
                    />
                    <button
                        className={styles.stepBtn}
                        onClick={() => handleEpisodeChange(listItem.episodes_watched + 1)}
                    >
                        +
                    </button>
                    {totalEpisodes && <span className={styles.total}>/ {totalEpisodes}</span>}
                </div>
            </div>

            {/* Remove Button */}
            <button
                className={styles.removeBtn}
                onClick={handleRemove}
                title="Удалить из списка"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    );
}
