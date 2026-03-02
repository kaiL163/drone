'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './profile.module.css';

const BACKEND_URL = 'http://212.119.42.49:8000';

export default function ProfilePage() {
    const { user, isAuthenticated, login } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('general');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load states
    const [usernameInput, setUsernameInput] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        } else if (user) {
            setUsernameInput(user.username);
            setEmailInput(user.email);
        }
    }, [isAuthenticated, user, router]);

    const showMessage = (text: string, type: 'error' | 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: '', type: '' }), 5000);
    };

    // Generic Fetch Helper
    const fetchApi = async (endpoint: string, method: string, body?: any, isFormData = false) => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(`${BACKEND_URL}${endpoint}`, {
            method,
            headers,
            body: isFormData ? body : JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            let errorMessage = 'Ошибка запроса';
            if (err.detail) {
                errorMessage = typeof err.detail === 'string' ? err.detail : (err.detail[0]?.msg || 'Ошибка валидации');
            }
            throw new Error(errorMessage);
        }
        return res.json();
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const updatedUser = await fetchApi('/users/me/avatar', 'POST', formData, true);
            // Re-fetch me or just trigger AuthContext to reload user
            const token = localStorage.getItem('token');
            if (token) login(token);
            showMessage('Аватар успешно обновлён!', 'success');
        } catch (err: any) {
            showMessage(err.message, 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUsernameSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/users/me/username', 'PUT', { username: usernameInput });
            const token = localStorage.getItem('token');
            if (token) login(token);
            showMessage('Никнейм успешно изменен!', 'success');
        } catch (err: any) {
            showMessage(err.message, 'error');
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/users/me/email', 'PUT', { email: emailInput });
            const token = localStorage.getItem('token');
            if (token) login(token);
            showMessage('Email успешно изменен!', 'success');
        } catch (err: any) {
            showMessage(err.message, 'error');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetchApi('/users/me/password', 'PUT', {
                old_password: oldPassword,
                new_password: newPassword
            });
            setOldPassword('');
            setNewPassword('');
            showMessage('Пароль успешно изменен!', 'success');
        } catch (err: any) {
            showMessage(err.message, 'error');
        }
    };

    if (!user) return <div className={styles.container}>Загрузка...</div>;

    const avatarUrl = user.avatar_url ? `${BACKEND_URL}${user.avatar_url}` : null;

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatarWrapper}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button
                            className={styles.uploadBtn}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? '⌛' : '📷 Изменить'}
                        </button>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <h2 className={styles.sidebarName}>{user.username}</h2>
                </div>

                <nav className={styles.navMenu}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'general' ? styles.active : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Общие настройки
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        Безопасность
                    </button>
                </nav>
            </div>

            <div className={styles.content}>
                <h1 className={styles.title}>Настройки профиля</h1>

                {msg.text && (
                    <div className={`${styles.alert} ${msg.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                        {msg.text}
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className={styles.settingsGroup}>
                        <form onSubmit={handleUsernameSubmit} className={styles.formCard}>
                            <h3>Сменить никнейм</h3>
                            <p className={styles.hint}>Вы можете менять никнейм раз в 7 дней.</p>
                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={e => setUsernameInput(e.target.value)}
                                    required
                                    minLength={3}
                                    maxLength={20}
                                />
                                <button type="submit" className={styles.saveBtn}>Сохранить</button>
                            </div>
                        </form>

                        <form onSubmit={handleEmailSubmit} className={styles.formCard}>
                            <h3>Сменить Email</h3>
                            <p className={styles.hint}>Вы можете менять почту раз в 30 дней.</p>
                            <div className={styles.inputGroup}>
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={e => setEmailInput(e.target.value)}
                                    required
                                />
                                <button type="submit" className={styles.saveBtn}>Сохранить</button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className={styles.settingsGroup}>
                        <form onSubmit={handlePasswordSubmit} className={styles.formCard}>
                            <h3>Сменить пароль</h3>
                            <p className={styles.hint}>Пароль должен содержать от 6 символов, минимум одну заглавную букву, строчную букву и цифру.</p>
                            <div className={styles.passwordGroup}>
                                <input
                                    type="password"
                                    placeholder="Текущий пароль"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Новый пароль"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required
                                />
                                <button type="submit" className={styles.saveBtn}>Сбросить пароль</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
