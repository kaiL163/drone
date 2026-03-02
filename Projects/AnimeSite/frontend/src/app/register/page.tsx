'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from '../login/login.module.css';

const BACKEND_URL = 'http://212.119.42.49:8000';

export default function RegisterPage() {
    const [credentials, setCredentials] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
            setError('Введите корректный email адрес');
            return;
        }

        if (credentials.username.length < 3 || credentials.username.length > 20) {
            setError('Никнейм должен быть от 3 до 20 символов');
            return;
        }

        if (!/^[a-zA-Z0-9_.-]+$/.test(credentials.username)) {
            setError('Никнейм может содержать только латинские буквы, цифры, точки, тире и подчеркивания');
            return;
        }

        if (credentials.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (!/[A-Z]/.test(credentials.password)) {
            setError('Пароль должен содержать минимум одну заглавную букву');
            return;
        }

        if (!/[a-z]/.test(credentials.password)) {
            setError('Пароль должен содержать минимум одну строчную букву');
            return;
        }

        if (!/\d/.test(credentials.password)) {
            setError('Пароль должен содержать минимум одну цифру');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Register
            const res = await fetch(`${BACKEND_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            if (!res.ok) {
                const errData = await res.json();
                let errorMessage = 'Ошибка регистрации';
                if (errData.detail) {
                    if (typeof errData.detail === 'string') {
                        errorMessage = errData.detail;
                    } else if (Array.isArray(errData.detail)) {
                        errorMessage = errData.detail[0].msg || 'Ошибка валидации данных';
                    }
                }
                setError(errorMessage);
                setIsLoading(false);
                return;
            }

            setSuccess('Регистрация успешна! Входим...');

            // 2. Auto-login after successful registration
            const loginData = new URLSearchParams();
            loginData.append('username', credentials.username);
            loginData.append('password', credentials.password);

            const loginRes = await fetch(`${BACKEND_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: loginData.toString()
            });

            if (loginRes.ok) {
                const data = await loginRes.json();
                login(data.access_token);
                // router.push('/') is handled in AuthContext login()
            } else {
                router.push('/login'); // Fallback if auto-login fails
            }

        } catch (err) {
            setError('Ошибка сети. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h1 className={styles.title}>Регистрация</h1>
                <p className={styles.subtitle}>Создайте аккаунт NekoStream</p>

                {error && <div className={styles.errorAlert}>{error}</div>}
                {success && <div className={styles.successAlert}>{success}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Никнейм</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                            placeholder="Например: NekoLover"
                            minLength={3}
                            maxLength={20}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={credentials.email}
                            onChange={handleChange}
                            required
                            placeholder="Ваша эл. почта"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            required
                            placeholder="Минимум 6 символов"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading || !!success}>
                        {isLoading ? 'Создание...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <div className={styles.footerLink}>
                    <p>Уже есть аккаунт? <button onClick={() => router.push('/login')} className={styles.linkBtn}>Войти</button></p>
                </div>
            </div>
        </div>
    );
}
