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

export interface Contact {
    id: number;
    name: string;
    avatarPath: string | null;
    isOnline: boolean;
    phone?: string;
    username?: string;
}

/**
 * Получение всех чатов пользователя
 */
export const getUserChats = async (): Promise<Chat[]> => {
    try {
        const response = await api.get('/chats/all');
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении чатов:', error);
        return [];
    }
};

/**
 * Поиск чатов по запросу
 * @param query Поисковый запрос
 */
export const searchChats = async (query: string): Promise<Chat[]> => {
    try {
        const response = await api.get('/chats/search', { params: { query } });
        return response.data;
    } catch (error) {
        console.error('Ошибка при поиске чатов:', error);
        return [];
    }
};

/**
 * Получение информации о конкретном чате
 * @param chatId ID чата
 */
export const getChatInfo = async (chatId: number): Promise<Chat | null> => {
    try {
        // Получаем все чаты и находим нужный
        const chats = await getUserChats();
        return chats.find(chat => chat.id === chatId) || null;
    } catch (error) {
        console.error(`Ошибка при получении информации о чате ${chatId}:`, error);
        return null;
    }
};

/**
 * Управление закреплением чата
 * @param chatId ID чата
 * @param isPinned Статус закрепления
 */
export const toggleChatPin = async (chatId: number, isPinned: boolean): Promise<boolean> => {
    try {
        const response = await api.post('/chats/pinned', { chat_id: chatId, is_pinned: isPinned });
        return response.data.success;
    } catch (error) {
        console.error(`Ошибка при ${isPinned ? 'закреплении' : 'откреплении'} чата:`, error);
        return false;
    }
};

/**
 * Удаление чата
 * @param chatId ID чата
 */
export const deleteChat = async (chatId: number): Promise<boolean> => {
    try {
        const response = await api.post('/chats/delete', { chat_id: chatId });
        return response.data.success;
    } catch (error) {
        console.error('Ошибка при удалении чата:', error);
        return false;
    }
};

/**
 * Получение контактов, с которыми еще нет чатов
 */
export const getContactsWithoutChat = async (): Promise<Contact[]> => {
    try {
        const response = await api.get('/chats/contacts');
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении контактов без чатов:', error);
        return [];
    }
};

/**
 * Создание нового чата с контактом
 * @param contactId ID контакта
 */
export const createChat = async (contactId: number): Promise<Chat | null> => {
    try {
        const response = await api.post('/chats/create', { contact_id: contactId });
        return response.data.chat;
    } catch (error) {
        console.error('Ошибка при создании чата:', error);
        return null;
    }
};

/**
 * Добавление чата в папку
 * @param chatId ID чата
 * @param folderId ID папки
 */
export const addChatToFolder = async (chatId: number, folderId: number): Promise<boolean> => {
    try {
        const response = await api.post('/folder/chat/add', { chat_id: chatId, folder_id: folderId });
        return response.data.success;
    } catch (error) {
        console.error('Ошибка при добавлении чата в папку:', error);
        return false;
    }
};

/**
 * Удаление чата из папки
 * @param chatId ID чата
 * @param folderId ID папки
 */
export const removeChatFromFolder = async (chatId: number, folderId: number): Promise<boolean> => {
    try {
        const response = await api.post('/folder/chat/remove', { chat_id: chatId, folder_id: folderId });
        return response.data.success;
    } catch (error) {
        console.error('Ошибка при удалении чата из папки:', error);
        return false;
    }
};