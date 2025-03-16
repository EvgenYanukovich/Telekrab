import axios from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

const API_URL = 'https://api.telekrab.org';

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await axiosInstance.post('/auth/login', credentials);
        
        // Проверяем, что ответ содержит необходимые данные
        console.log('Ответ сервера при входе:', response.data);
        
        // Обрабатываем различные форматы ответа
        let data: AuthResponse;
        
        if (typeof response.data === 'string') {
            // Если в ответе есть HTML с ошибкой PHP, пытаемся извлечь JSON из этого ответа
            if (response.data.includes('{') && response.data.includes('}')) {
                const jsonStartIndex = response.data.indexOf('{');
                const jsonEndIndex = response.data.lastIndexOf('}') + 1;
                const jsonStr = response.data.substring(jsonStartIndex, jsonEndIndex);
                
                try {
                    const extractedData = JSON.parse(jsonStr);
                    console.log('Извлеченные данные из HTML-ответа:', extractedData);
                    
                    if (extractedData.token && extractedData.user) {
                        data = extractedData;
                    } else {
                        throw new Error('В извлеченных данных отсутствуют необходимые поля');
                    }
                } catch (e) {
                    console.error('Не удалось извлечь JSON из HTML-ответа:', e);
                    throw new Error('Неверный формат данных в ответе сервера');
                }
            } else {
                throw new Error('Ответ сервера не содержит JSON данных');
            }
        } else {
            // Если ответ уже объект, используем его напрямую
            data = response.data;
            
            // Проверяем наличие необходимых полей
            if (!data.token || !data.user) {
                console.error('Ответ сервера не содержит token или user:', data);
                throw new Error('В ответе сервера отсутствуют необходимые данные');
            }
        }
        
        return data;
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