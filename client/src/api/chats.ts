import axios from 'axios';

// Создаем инстанс API с общими настройками
export const api = axios.create({
    baseURL: 'https://api.telekrab.org',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Для передачи cookies
});

// Добавляем интерцептор для автоматического добавления токена авторизации
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export interface Chat {
    id: number;
    name: string;
    avatarPath: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isPinned: boolean;
    isOnline: boolean;
    type?: 'personal' | 'group' | 'channel';
    folderId?: number;
}

/**
 * Получение всех чатов пользователя
 */
export const getUserChats = async (): Promise<Chat[]> => {
    try {
        const response = await api.get('/chat/all');
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении чатов:', error);
        return [];
    }
};

/**
 * Получение информации о конкретном чате
 * @param chatId ID чата
 */
export const getChatInfo = async (chatId: number): Promise<Chat | null> => {
    try {
        const response = await api.get(`/chat/${chatId}`);
        return response.data;
    } catch (error) {
        console.error(`Ошибка при получении информации о чате ${chatId}:`, error);
        return null;
    }
};

/**
 * Закрепление чата
 * @param chatId ID чата
 */
export const pinChat = async (chatId: number): Promise<void> => {
    await api.post(`/chat/pin`, { chat_id: chatId });
};

/**
 * Откреплениe чата
 * @param chatId ID чата
 */
export const unpinChat = async (chatId: number): Promise<void> => {
    await api.post(`/chat/unpin`, { chat_id: chatId });
};

/**
 * Удаление чата
 * @param chatId ID чата
 */
export const deleteChat = async (chatId: number): Promise<void> => {
    await api.delete(`/chat/delete`, { 
        data: { chat_id: chatId } 
    });
};