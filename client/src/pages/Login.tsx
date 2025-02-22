import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '../api/auth';
import { LoginCredentials, AuthResponse } from '../types/auth';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

    const loginMutation = useMutation({
        mutationFn: login,
        onSuccess: (data: AuthResponse) => {
            // Save token to localStorage
            localStorage.setItem('token', data.token);
            // Redirect to main page
            navigate('/');
        },
    });

    const onSubmit = (data: LoginCredentials) => {
        loginMutation.mutate(data);
    };

    return (
        <div className="auth-container">
            <h1>Вход</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label>Никнейм</label>
                    <input
                        type="text"
                        {...register('nickname', { required: 'Обязательное поле' })}
                    />
                    {errors.nickname && <span className="error">{errors.nickname.message}</span>}
                </div>

                <div className="form-group">
                    <label>Пароль</label>
                    <input
                        type="password"
                        {...register('password', { required: 'Обязательное поле' })}
                    />
                    {errors.password && <span className="error">{errors.password.message}</span>}
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            {...register('rememberMe')}
                        />
                        Запомнить меня
                    </label>
                </div>

                <button type="submit" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? 'Вход...' : 'Войти'}
                </button>

                {loginMutation.isError && (
                    <div className="error-message">
                        Ошибка при входе. Пожалуйста, проверьте введенные данные.
                    </div>
                )}
            </form>

            <div className="auth-links">
                <a href="/register">Ещё нет аккаунта? Зарегистрироваться</a>
                <a href="/restore">Забыли пароль?</a>
            </div>
        </div>
    );
};
