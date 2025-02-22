import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

const API_URL = 'https://api.telekrab.org';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
        console.log('Register function called with credentials:', credentials);
        const formData = new FormData();
        
        // Обработка файла аватара
        if (credentials.avatar) {
            console.log('Avatar found in credentials:', credentials.avatar);
            
            let file: File | null = null;
            if (credentials.avatar instanceof FileList) {
                file = credentials.avatar[0];
                console.log('Avatar is FileList, using first file:', file);
            } else if (credentials.avatar instanceof File) {
                file = credentials.avatar;
                console.log('Avatar is File:', file);
            }
            
            if (file) {
                formData.append('avatar', file);
                console.log('Added avatar to FormData:', file.name);
            }
        }

        // Добавляем остальные поля
        const { avatar, ...otherFields } = credentials;
        Object.entries(otherFields).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, String(value));
                console.log(`Added field to FormData - ${key}:`, value);
            }
        });

        // Проверяем содержимое FormData перед отправкой
        console.log('FormData entries:');
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        const response = await axiosInstance.post('/auth/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        console.log('Registration successful:', response.data);
    } catch (error: any) {
        console.error('Registration error:', error.response?.data || error.message);
        throw error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await axiosInstance.post('/auth/logout');
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};