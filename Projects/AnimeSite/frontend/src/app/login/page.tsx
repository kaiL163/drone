'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

const BACKEND_URL = 'http://212.119.42.49:8000';

export default function LoginPage() {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append('username', credentials.username); // Backend accepts email here too
            formData.append('password', credentials.password);

            const res = await fetch(`${BACKEND_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            if (res.ok) {
                const data = await res.json();
                login(data.access_token);
            } else {
                const errData = await res.json();
                let errorMessage = 'Неверные учетные данные';
                if (errData.detail) {
                    if (typeof errData.detail === 'string') {
                        errorMessage = errData.detail;
                    } else if (Array.isArray(errData.detail)) {
                        errorMessage = errData.detail[0].msg || 'Ошибка валидации';
                    }
                }
                setError(errorMessage);
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
                <h1 className={styles.title}>Войти в аккаунт</h1>
                <p className={styles.subtitle}>Рады видеть вас снова!</p>

                {error && <div className={styles.errorAlert}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Никнейм или Email</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            required
                            placeholder="Введите ник или почту"
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
                            placeholder="Введите пароль"
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <div className={styles.footerLink}>
                    <p>Нет аккаунта? <button onClick={() => router.push('/register')} className={styles.linkBtn}>Зарегистрироваться</button></p>
                </div>
            </div>
        </div>
    );
}
