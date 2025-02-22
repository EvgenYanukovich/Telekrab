import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { register as registerUser } from '../api/auth';
import { RegisterCredentials } from '../types/auth';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { register, handleSubmit, watch, formState: { errors }, setError, setValue } = useForm<RegisterCredentials>();
    
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
        console.log('handleImageChange called');
        const file = event.target.files?.[0];
        if (file) {
            console.log('File in handleImageChange:', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            // Устанавливаем файл в форму
            setValue('avatar', file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        console.log('handleDrop called');
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            console.log('File in handleDrop:', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            // Устанавливаем файл в форму
            setValue('avatar', file);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const onSubmit = (data: RegisterCredentials) => {
        console.log('Form data before submit:', data);
        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { message: 'Пароли не совпадают' });
            return;
        }
        registerMutation.mutate(data);
    };

    return (
        <div className="auth-container">
            <h1>Регистрация</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="avatar-upload">
                    <div 
                        className="avatar-preview" 
                        style={{ 
                            backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                            border: '2px dashed #666',
                            borderRadius: '8px',
                            width: '120px',
                            height: '120px',
                            marginBottom: '20px',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => {
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (fileInput) {
                                fileInput.click();
                            }
                        }}
                    >
                        {!previewUrl && (
                            <div style={{ textAlign: 'center', color: '#666' }}>
                                <p>Перетащите фото или кликните для выбора</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            {...register('avatar', {
                                onChange: (e) => {
                                    console.log('File input onChange');
                                    handleImageChange(e);
                                }
                            })}
                        />
                    </div>
                    {previewUrl && (
                        <button
                            type="button"
                            onClick={() => {
                                setPreviewUrl(null);
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) {
                                    fileInput.value = '';
                                    // Вызываем событие change для react-hook-form
                                    const event = new Event('change', { bubbles: true });
                                    fileInput.dispatchEvent(event);
                                }
                            }}
                            style={{
                                marginBottom: '20px',
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                border: 'none',
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Удалить фото
                        </button>
                    )}
                </div>

                <div className="form-group">
                    <label>Никнейм</label>
                    <input
                        type="text"
                        {...register('nickname', { 
                            required: 'Обязательное поле',
                            minLength: { value: 3, message: 'Минимум 3 символа' }
                        })}
                    />
                    {errors.nickname && <span className="error">{errors.nickname.message}</span>}
                </div>

                <div className="form-group">
                    <label>Пароль</label>
                    <input
                        type="password"
                        {...register('password', { 
                            required: 'Обязательное поле',
                            minLength: { value: 6, message: 'Минимум 6 символов' }
                        })}
                    />
                    {errors.password && <span className="error">{errors.password.message}</span>}
                </div>

                <div className="form-group">
                    <label>Повторите пароль</label>
                    <input
                        type="password"
                        {...register('confirmPassword', {
                            required: 'Обязательное поле',
                            validate: (value) => value === watch('password') || 'Пароли не совпадают'
                        })}
                    />
                    {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
                </div>

                <div className="form-group">
                    <label>Дата рождения</label>
                    <input
                        type="date"
                        {...register('birthDate', { required: 'Обязательное поле' })}
                    />
                    {errors.birthDate && <span className="error">{errors.birthDate.message}</span>}
                </div>

                <div className="form-group">
                    <label>О себе</label>
                    <textarea
                        {...register('bio')}
                        placeholder="Расскажите о себе..."
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#1c1c1c',
                            border: '1px solid #454545',
                            borderRadius: '4px',
                            color: 'white',
                            resize: 'vertical',
                            minHeight: '100px'
                        }}
                    />
                </div>

                <button type="submit" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Регистрация...' : 'Регистрация'}
                </button>

                {errors.root && (
                    <div className="error-message">
                        {errors.root.message}
                    </div>
                )}
            </form>

            <div className="auth-links">
                <a href="/login">Уже есть аккаунт? Войти</a>
            </div>
        </div>
    );
};
