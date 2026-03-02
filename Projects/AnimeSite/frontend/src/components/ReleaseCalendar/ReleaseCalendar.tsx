'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchCalendar } from '@/lib/api';
import styles from './ReleaseCalendar.module.css';

const DAYS_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

interface CalendarItem {
    next_episode: number;
    next_episode_at: string;
    duration: number;
    anime: {
        id: number;
        name: string;
        russian: string;
        image: {
            original: string;
        };
    };
}

export default function ReleaseCalendar() {
    const [schedule, setSchedule] = useState<{ [day: string]: CalendarItem[] }>({});
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<number>(new Date().getDay());

    useEffect(() => {
        fetchCalendar().then(data => {
            // Group by day of week
            const grouped: { [key: number]: CalendarItem[] } = {};

            data.forEach((item: CalendarItem) => {
                if (!item.next_episode_at) return;
                const d = new Date(item.next_episode_at);
                const day = d.getDay();
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(item);
            });

            // Sort each day by time
            Object.keys(grouped).forEach(day => {
                grouped[Number(day)].sort((a, b) =>
                    new Date(a.next_episode_at).getTime() - new Date(b.next_episode_at).getTime()
                );
            });

            setSchedule(grouped);
            setLoading(false);
        });
    }, []);

    const today = new Date();
    const todayDay = today.getDay();

    // Generate an array of the next 7 days starting from today
    const daysList = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d.getDay();
    });

    if (loading) {
        return (
            <div className={styles.calendarSection}>
                <h2 className={styles.title}>Календарь релизов</h2>
                <div className={styles.skeletonBox} />
            </div>
        );
    }

    const todayItems = schedule[activeDay] || [];

    return (
        <div className={styles.calendarSection}>
            <div className={styles.header}>
                <h2 className={styles.title}>Календарь релизов</h2>
            </div>

            <div className={styles.tabsContainer}>
                {daysList.map((day, idx) => (
                    <button
                        key={`${day}-${idx}`}
                        className={`${styles.tabBtn} ${activeDay === day ? styles.tabActive : ''}`}
                        onClick={() => setActiveDay(day)}
                    >
                        {day === todayDay ? 'Сегодня' : day === (todayDay + 1) % 7 ? 'Завтра' : DAYS_RU[day].substring(0, 2)}
                    </button>
                ))}
            </div>

            <div className={styles.scheduleList}>
                {todayItems.length === 0 ? (
                    <p className={styles.emptyMsg}>Нет релизов в этот день</p>
                ) : (
                    todayItems.map((item, idx) => {
                        const time = new Date(item.next_episode_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit', minute: '2-digit'
                        });
                        const img = item.anime.image?.original || '';

                        return (
                            <Link key={`${item.anime.id}-${idx}`} href={`/title/${item.anime.id}`} className={styles.scheduleItem}>
                                <div className={styles.timeLabel}>{time}</div>
                                <img src={img} alt={item.anime.russian} className={styles.thumb} loading="lazy" referrerPolicy="no-referrer" />
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemTitle}>{item.anime.russian || item.anime.name}</div>
                                    <div className={styles.epBadge}>{item.next_episode} серия</div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
