import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth';
import { LoginCredentials, AuthResponse } from '../types/auth';
import styles from '../styles/Login.module.css';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastNotification';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const { showToast } = useToast();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (data: AuthResponse) => {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            showToast('success', 'Вы успешно вошли в систему', 'Успешный вход');
            navigate('/home');
        },
        onError: (error: any) => {
            if (error.response?.data?.error) {
                // Разделяем ошибки валидации, если они в списке через точку с запятой
                if (error.response.data.error.includes('Ошибки валидации:')) {
                    const errorMessage = error.response.data.error;
                    const errors = errorMessage.replace('Ошибки валидации: ', '').split('; ');
                    
                    // Показываем каждую ошибку как отдельное уведомление с небольшой задержкой между ними
                    errors.forEach((errMsg: string, index: number) => {
                        setTimeout(() => {
                            showToast('error', errMsg, 'Ошибка валидации');
                        }, index * 300); // 300мс задержка между уведомлениями
                    });
                } else {
                    // Обычное сообщение об ошибке
                    showToast('error', error.response.data.error, 'Ошибка входа');
                }
            } else {
                showToast('error', 'Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.', 'Ошибка входа');
            }
        }
    });

    const onSubmit = (data: LoginCredentials) => {
        loginMutation.mutate(data);
    };

    const handleValidationErrors = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Проверяем наличие ошибок валидации
        if (Object.keys(errors).length > 0) {
            let hasErrors = false;
            
            // Собираем все ошибки и показываем их с небольшой задержкой между ними
            Object.values(errors).forEach((error, index) => {
                if (error && error.message) {
                    hasErrors = true;
                    setTimeout(() => {
                        showToast('error', String(error.message), 'Ошибка валидации');
                    }, index * 300); // 300мс задержка между уведомлениями
                }
            });
            
            if (hasErrors) {
                return; // Останавливаем отправку формы при наличии ошибок
            }
        }
        
        // Продолжаем обычную обработку формы
        handleSubmit(onSubmit)(e);
    };

    return (
        <div className={styles.container}>
            <div className={styles.auth_container}>
                <div className={styles.auth_header}>
                    <h1>Добро пожаловать</h1>
                    <p>Войдите в свой аккаунт Telekrab</p>
                </div>

                <form onSubmit={handleValidationErrors} className={styles.form_container}>
                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <input
                                type="text"
                                placeholder="Никнейм"
                                {...register('nickname', { 
                                    required: 'Введите никнейм',
                                    minLength: {
                                        value: 3,
                                        message: 'Никнейм должен содержать минимум 3 символа'
                                    }
                                })}
                            />
                        </div>
                    </div>

                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <input
                                type="password"
                                placeholder="Пароль"
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
                </form>

                <div className={styles.auth_footer}>
                    <p>Нет аккаунта?</p>
                    <Link to="/register" className={styles.register_link}>
                        Регистрация
                    </Link>
                </div>
            </div>
        </div>
    );
};
