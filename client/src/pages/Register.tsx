import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register as registerUser } from '../api/auth';
import { RegisterCredentials } from '../types/auth';
import { DatePicker } from '../components/DatePicker';
import { ValidationHints } from '../components/ValidationHints';
import styles from '../styles/Register.module.css';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastNotification';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const { showToast } = useToast();
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const { register, handleSubmit, watch, formState: { errors }, setValue, trigger } = useForm<RegisterCredentials>();
    const watchedPassword = watch('password');
    const watchedNickname = watch('nickname');
    const watchedConfirmPassword = watch('confirmPassword');
    const watchedBirthDate = watch('birthDate');

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            localStorage.setItem('token', data.token);
            setUser(data.user);
            showToast('success', 'Ваш аккаунт успешно создан!', 'Регистрация завершена');
            navigate('/home');
        },
        onError: (error: any) => {
            if (error.response?.data?.error) {
                if (error.response.data.error.includes('Ошибки валидации:')) {
                    const errorMessage = error.response.data.error;
                    const errors = errorMessage.replace('Ошибки валидации: ', '').split('; ');
                    
                    errors.forEach((errMsg: string, index: number) => {
                        setTimeout(() => {
                            showToast('error', errMsg, 'Ошибка валидации');
                        }, index * 300); 
                    });
                } else {
                    showToast('error', error.response.data.error, 'Ошибка регистрации');
                }
            } else {
                showToast('error', 'Произошла неизвестная ошибка. Пожалуйста, попробуйте позже.', 'Ошибка регистрации');
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showToast('error', 'Размер файла не должен превышать 5MB', 'Ошибка загрузки');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target?.result as string);
                setValue('avatar', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('error', 'Размер файла не должен превышать 5MB', 'Ошибка загрузки');
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setValue('avatar', file);
            showToast('success', 'Аватар успешно добавлен', 'Загрузка аватара');
        } else if (file) {
            showToast('error', 'Разрешены только изображения', 'Ошибка загрузки');
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const removeAvatar = () => {
        setAvatarPreview(null);
        setValue('avatar', undefined);
        showToast('info', 'Аватар удален', 'Аватар');
    };

    const handleValidationErrors = (e: React.FormEvent) => {
        e.preventDefault();
        
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
        
        handleSubmit(onSubmit)(e);
    };

    const onSubmit = (data: RegisterCredentials) => {
        if (validateAge(data.birthDate) < 14) {
            showToast('error', 'Вам должно быть не менее 14 лет', 'Ошибка валидации');
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

                <form onSubmit={handleValidationErrors} className={styles.form_container}>
                    <div className={styles.form_group_with_avatar}>
                        <div className={styles.avatar_section}>
                            <div
                                className={`${styles.avatar_upload} ${avatarPreview ? styles.has_image : ''}`}
                                onClick={() => document.getElementById('avatar-input')?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {avatarPreview ? (
                                    <>
                                        <img src={avatarPreview} alt="Avatar preview" />
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
                            {avatarPreview && (
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
                                    <div className={styles.input_wrapper}>
                                        <input
                                            type="text"
                                            placeholder="Никнейм"
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
                                </div>
                            </div>

                            <div className={styles.form_group}>
                                <div className={styles.input_group}>
                                    <div className={styles.input_wrapper}>
                                        <input
                                            type="password"
                                            placeholder="Пароль"
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
                                </div>
                            </div>

                            <div className={styles.form_group}>
                                <div className={styles.input_group}>
                                    <div className={styles.input_wrapper}>
                                        <input
                                            type="password"
                                            placeholder="Подтвердите пароль"
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
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <div className={styles.input_wrapper}>
                                <DatePicker
                                    value={watchedBirthDate || ''}
                                    onChange={(date) => setValue('birthDate', date)}
                                    placeholder="Дата рождения"
                                    error={false}
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
                        </div>
                    </div>

                    <div className={styles.form_group}>
                        <div className={styles.input_group}>
                            <div className={styles.input_wrapper}>
                                <textarea
                                    placeholder="О себе (необязательно)"
                                    {...register('bio')}
                                    onFocus={() => setFocusedField('bio')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submit_button}
                        disabled={registerMutation.isPending}
                    >
                        {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <div className={styles.auth_footer}>
                    <p>Уже есть аккаунт?</p>
                    <Link to="/login" className={styles.register_link}>
                        <span>Войти</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
