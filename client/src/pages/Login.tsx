import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth';
import { LoginCredentials, AuthResponse } from '../types/auth';
import styles from '../styles/auth.module.css';
import { useAuth } from '../hooks/useAuth';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (data: AuthResponse) => {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            navigate('/home');
        },
    });

    const onSubmit = (data: LoginCredentials) => {
        loginMutation.mutate(data);
    };

    return (
        <div className={styles.container}>
            <div className={styles.auth_container}>
                <div className={styles.auth_header}>
                    <h1>Добро пожаловать</h1>
                    <p>Войдите в свой аккаунт Telekrab</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form_container}>
                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <input
                                type="text"
                                placeholder="Никнейм"
                                className={errors.nickname ? styles.error_input : ''}
                                {...register('nickname', { 
                                    required: 'Введите никнейм',
                                    minLength: {
                                        value: 3,
                                        message: 'Никнейм должен содержать минимум 3 символа'
                                    }
                                })}
                            />
                        </div>
                        {errors.nickname && (
                            <span className={styles.error_text}>{errors.nickname.message}</span>
                        )}
                    </div>

                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <input
                                type="password"
                                placeholder="Пароль"
                                className={errors.password ? styles.error_input : ''}
                                {...register('password', { 
                                    required: 'Введите пароль',
                                    minLength: {
                                        value: 6,
                                        message: 'Пароль должен содержать минимум 6 символов'
                                    }
                                })}
                            />
                            <span className={styles.input_icon}>🔒</span>
                        </div>
                        {errors.password && (
                            <span className={styles.error_text}>{errors.password.message}</span>
                        )}
                    </div>

                    <div className={styles.form_options}>
                        <label className={styles.checkbox_label}>
                            <input
                                type="checkbox"
                                {...register('rememberMe')}
                            />
                            <span>Запомнить меня</span>
                        </label>
                        <Link to="/restore" className={styles.forgot_password}>
                            Забыли пароль?
                        </Link>
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submit_button}
                        disabled={loginMutation.isPending}
                    >
                        {loginMutation.isPending ? (
                            <span className={styles.loading_spinner}>⌛</span>
                        ) : 'Войти'}
                    </button>

                    {loginMutation.isError && (
                        <div className={styles.error_message}>
                            Неверный никнейм или пароль
                        </div>
                    )}
                </form>

                <div className={styles.auth_footer}>
                    <p>Нет аккаунта?</p>
                    <Link to="/register" className={styles.register_link}>
                        Зарегистрироваться
                    </Link>
                </div>
            </div>
        </div>
    );
};
