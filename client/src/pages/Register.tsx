import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register as registerUser } from '../api/auth';
import { RegisterCredentials } from '../types/auth';
import styles from '../styles/auth.module.css';
import { DatePicker } from '../components/DatePicker';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { register, handleSubmit, watch, formState: { errors }, setError, setValue, trigger } = useForm<RegisterCredentials>();

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            navigate('/login');
        },
        onError: (error: any) => {
            if (error.response?.data?.error) {
                setError('root', { message: error.response.data.error });
            }
        },
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            setValue('avatar', file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            setValue('avatar', file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const removeAvatar = () => {
        setPreviewUrl(null);
        setValue('avatar', undefined);
    };

    const onSubmit = (data: RegisterCredentials) => {
        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { message: 'Пароли не совпадают' });
            return;
        }
        registerMutation.mutate(data);
    };

    return (
        <div className={styles.container}>
            <div className={styles.auth_container}>
                <div className={styles.auth_header}>
                    <h1>Создайте аккаунт</h1>
                    <p>Присоединяйтесь к Telekrab</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.form_group_with_avatar}>
                        <div className={styles.avatar_section}>
                            <div
                                className={`${styles.avatar_upload} ${previewUrl ? styles.has_image : ''}`}
                                onClick={() => document.getElementById('avatar-input')?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Avatar preview" />
                                        <div className={styles.avatar_overlay}>
                                            <span>Изменить<br/>фото</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.avatar_placeholder}>
                                        <div className={styles.avatar_icon}></div>
                                        <span>Добавьте фото</span>
                                        <span className={styles.avatar_hint}>Перетащите или<br/>кликните</span>
                                    </div>
                                )}
                            </div>
                            {previewUrl && (
                                <button
                                    type="button"
                                    className={styles.remove_avatar}
                                    onClick={removeAvatar}
                                >
                                    Удалить фото
                                </button>
                            )}
                            <input
                                id="avatar-input"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                {...register('avatar')}
                                onChange={handleImageChange}
                            />
                        </div>
                        <div className={styles.form_group_without_avatar}>
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
                                </div>
                                {errors.password && (
                                    <span className={styles.error_text}>{errors.password.message}</span>
                                )}
                            </div>

                            <div className={styles.form_group}>
                                <div className={styles.input_group}>
                                    <input
                                        type="password"
                                        placeholder="Подтвердите пароль"
                                        className={errors.confirmPassword ? styles.error_input : ''}
                                        {...register('confirmPassword', {
                                            required: 'Подтвердите пароль',
                                            validate: (value) =>
                                                value === watch('password') || 'Пароли не совпадают'
                                        })}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <span className={styles.error_text}>{errors.confirmPassword.message}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.form_group}>
                        <DatePicker
                            value={watch('birthDate') || ''}
                            onChange={(date) => setValue('birthDate', date)}
                            placeholder="Дата рождения"
                            error={!!errors.birthDate}
                            onBlur={() => trigger('birthDate')}
                        />
                        {errors.birthDate && (
                            <span className={styles.error_text}>{errors.birthDate.message}</span>
                        )}
                    </div>

                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <textarea
                                placeholder="О себе (необязательно)"
                                className={errors.bio ? styles.error_input : ''}
                                {...register('bio')}
                            />
                        </div>
                        {errors.bio && (
                            <span className={styles.error_text}>{errors.bio.message}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={styles.submit_button}
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? (
                            <span className={styles.loading_spinner}>⌛</span>
                        ) : 'Зарегистрироваться'}
                    </button>

                    {registerMutation.isError && (
                        <div className={styles.error_message}>
                            {errors.root?.message || 'Ошибка при регистрации'}
                        </div>
                    )}
                </form>

                <div className={styles.auth_footer}>
                    <p>Уже есть аккаунт?</p>
                    <Link to="/login" className={styles.register_link}>
                        Войти
                    </Link>
                </div>
            </div>
        </div>
    );
};
