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

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
        const formData = new FormData();
        
        // Обработка файла аватара
        if (credentials.avatar) {
            let file: File | null = null;
            if (credentials.avatar instanceof FileList) {
                file = credentials.avatar[0];
            } else if (credentials.avatar instanceof File) {
                file = credentials.avatar;
            }
            
            if (file) {
                formData.append('avatar', file);
            }
        }

        // Добавляем остальные поля
        const { avatar, ...otherFields } = credentials;
        Object.entries(otherFields).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, String(value));
            }
        });

        const response = await axiosInstance.post<AuthResponse>('/auth/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
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