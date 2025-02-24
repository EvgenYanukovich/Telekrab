import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { register as registerUser } from '../api/auth';
import { RegisterCredentials } from '../types/auth';
import { ValidationHints } from '../components/ValidationHints';
import { DatePicker } from '../components/DatePicker';
import styles from '../styles/auth.module.css';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { register, handleSubmit, watch, formState: { errors }, setError, setValue, trigger } = useForm<RegisterCredentials>();
    const watchedPassword = watch('password');
    const watchedNickname = watch('nickname');
    const watchedConfirmPassword = watch('confirmPassword');
    const watchedBirthDate = watch('birthDate');

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            navigate('/login');
        },
        onError: (error: any) => {
            if (error.response?.data?.error) {
                setError('root', { message: error.response.data.error });
            }
        }
    });

    const validateAge = (date: string) => {
        const birthDate = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1;
        }
        return age;
    };

    const getNicknameRules = () => [
        {
            message: 'Минимум 3 символа',
            isValid: !!watchedNickname && watchedNickname.length >= 3
        }
    ];

    const getPasswordRules = () => [
        {
            message: 'Минимум 6 символов',
            isValid: !!watchedPassword && watchedPassword.length >= 6
        },
        {
            message: 'Минимум одна заглавная буква',
            isValid: !!watchedPassword && /[A-Z]/.test(watchedPassword)
        },
        {
            message: 'Минимум одна цифра',
            isValid: !!watchedPassword && /[0-9]/.test(watchedPassword)
        },
        {
            message: 'Только латинские буквы и цифры',
            isValid: !!watchedPassword && /^[a-zA-Z0-9]+$/.test(watchedPassword)
        }
    ];

    const getConfirmPasswordRules = () => [
        {
            message: 'Пароли должны совпадать',
            isValid: !!watchedConfirmPassword && watchedConfirmPassword === watchedPassword
        }
    ];

    const getBirthDateRules = () => [
        {
            message: 'Возраст не менее 14 лет',
            isValid: !!watchedBirthDate && validateAge(watchedBirthDate) >= 14
        }
    ];

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
        if (validateAge(data.birthDate) < 14) {
            setError('birthDate', { message: 'Вам должно быть не менее 14 лет' });
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

                <form onSubmit={handleSubmit(onSubmit)} className={styles.auth_form}>
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
                                            <span>Изменить<br />фото</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.avatar_placeholder}>
                                        <div className={styles.avatar_icon}></div>
                                        <span>Добавьте фото</span>
                                        <span className={styles.avatar_hint}>Перетащите или<br />кликните</span>
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
                                                message: 'Минимум 3 символа'
                                            }
                                        })}
                                        onFocus={() => setFocusedField('nickname')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <ValidationHints
                                        rules={getNicknameRules()}
                                        show={focusedField === 'nickname'}
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
                                            pattern: {
                                                value: /^[a-zA-Z0-9]+$/,
                                                message: 'Только латинские буквы и цифры'
                                            },
                                            minLength: {
                                                value: 6,
                                                message: 'Минимум 6 символов'
                                            },
                                            validate: {
                                                hasUpperCase: (value) =>
                                                    /[A-Z]/.test(value) || 'Добавьте заглавную букву',
                                                hasNumber: (value) =>
                                                    /[0-9]/.test(value) || 'Добавьте цифру'
                                            }
                                        })}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <ValidationHints
                                        rules={getPasswordRules()}
                                        show={focusedField === 'password'}
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
                                                value === watchedPassword || 'Пароли не совпадают'
                                        })}
                                        onFocus={() => setFocusedField('confirmPassword')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <ValidationHints
                                        rules={getConfirmPasswordRules()}
                                        show={focusedField === 'confirmPassword'}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <span className={styles.error_text}>{errors.confirmPassword.message}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <DatePicker
                                value={watchedBirthDate || ''}
                                onChange={(date) => setValue('birthDate', date)}
                                placeholder="Дата рождения"
                                error={!!errors.birthDate}
                                onBlur={() => {
                                    setFocusedField(null);
                                    trigger('birthDate');
                                }}
                            />
                            <ValidationHints
                                rules={getBirthDateRules()}
                                show={focusedField === 'birthDate'}
                            />
                        </div>
                        {errors.birthDate && (
                            <span className={styles.error_text}>{errors.birthDate.message}</span>
                        )}
                    </div>

                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <textarea
                                placeholder="О себе (необязательно)"
                                {...register('bio')}
                                onFocus={() => setFocusedField('bio')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>
                    </div>



                    <button
                        type="submit"
                        className={styles.submit_button}
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>

                    {errors.root && (
                        <span className={styles.error_text}>{errors.root.message}</span>
                    )}
                </form>
            </div>
        </div>
    );
};
