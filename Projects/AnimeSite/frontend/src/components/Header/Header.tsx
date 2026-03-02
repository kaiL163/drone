'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Header.module.css';

const BACKEND_URL = 'http://212.119.42.49:8000';

export default function Header() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const [isRandomLoading, setIsRandomLoading] = useState(false);

    const handleRandomClick = async () => {
        if (isRandomLoading) return;
        setIsRandomLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/custom/random?limit=1`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    router.push(`/title/${data[0].id}`);
                }
            }
        } catch (error) {
            console.error("Failed to fetch random anime:", error);
        } finally {
            setIsRandomLoading(false);
        }
    };

    return (
        <header className={styles.header}>
            <Link href="/" className={styles.logo}>
                Neko<span>Stream</span>
            </Link>

            <nav className={styles.nav}>
                <Link href="/" className={styles.navLink}>Главная</Link>
                <Link href="/search" className={styles.navLink}>Каталог</Link>
                <Link href="/search?status=IS_ONGOING" className={styles.navLink}>Онгоинги</Link>
                <button
                    onClick={handleRandomClick}
                    className={`${styles.navLink} ${styles.randomBtn}`}
                    disabled={isRandomLoading}
                >
                    {isRandomLoading ? 'Загрузка...' : 'Случайное'}
                </button>
            </nav>

            <div className={styles.actions}>
                <button
                    className={styles.searchBtn}
                    aria-label="Поиск"
                    onClick={() => router.push('/search')}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
                {isAuthenticated && user ? (
                    <div className={styles.userMenuWrapper}>
                        <span className={styles.username}>{user.username}</span>
                        <div className={styles.dropdownMenu}>
                            <button className={styles.dropdownItem} onClick={() => router.push('/profile')}>
                                Профиль
                            </button>
                            <button className={styles.dropdownItem} onClick={() => router.push('/my-list')}>
                                Мой список
                            </button>
                            <div className={styles.dropdownDivider}></div>
                            <button className={`${styles.dropdownItem} ${styles.logoutText}`} onClick={logout}>
                                Выход
                            </button>
                        </div>
                    </div>
                ) : (
                    <button className={styles.loginBtn} onClick={() => router.push('/login')}>Войти</button>
                )}
            </div>
        </header>
    );
}
