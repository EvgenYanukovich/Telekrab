import axios from 'axios';
import { User } from '../types/auth';

const API_URL = 'https://api.telekrab.org';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Добавляем интерсептор для токена авторизации
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('Токен из localStorage:', token ? 'найден' : 'не найден');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Заголовок Authorization установлен');
    } else {
        console.warn('Токен не найден в localStorage, запрос пойдет без авторизации');
    }
    
    return config;
});

/**
 * Получение профиля пользователя
 */
export const getUserProfile = async (): Promise<User> => {
    try {
        const response = await axiosInstance.get('/user/profile');
        console.log('Полученный профиль:', response.data);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении профиля пользователя:', error);
        throw error;
    }
};

/**
 * Обновление профиля пользователя
 * @param profileData Данные для обновления профиля
 */
export const updateUserProfile = async (profileData: any) => {
    try {
        // Если есть файл аватара, используем FormData для отправки
        if (profileData.avatar && profileData.avatar instanceof File) {
            const formData = new FormData();
            formData.append('avatar', profileData.avatar);
            
            // Добавляем остальные поля в formData
            Object.keys(profileData).forEach(key => {
                if (key !== 'avatar' && profileData[key] !== undefined) {
                    formData.append(key, profileData[key]);
                }
            });
            
            const response = await axiosInstance.post('/user/edit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log('Профиль обновлен:', response.data);
            return response.data;
        } else {
            // Если аватара нет, отправляем обычный JSON
            const response = await axiosInstance.post('/user/edit', profileData);
            console.log('Профиль обновлен:', response.data);
            return response.data;
        }
    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        throw error;
    }
};