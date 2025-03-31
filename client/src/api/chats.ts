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
    folders?: string[]; // Массив ID папок, в которых находится чат
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
 * @param folderId ID папки для фильтрации (по умолчанию 0 - "Все чаты")
 */
export const getUserChats = async (folderId: number = 0): Promise<Chat[]> => {
    try {
        const response = await api.get('/chats/all', { params: { folder_id: folderId } });
        
        // Преобразуем данные с сервера в формат клиента
        const chats = response.data.map((chat: any) => ({
            id: Number(chat.id),
            name: chat.name,
            avatarPath: chat.avatar_path,
            lastMessage: chat.last_message,
            lastMessageTime: chat.last_message_time,
            unreadCount: Number(chat.unread_count || 0),
            isPinned: Boolean(Number(chat.is_pinned)), // Изменение преобразования в boolean
            isOnline: Boolean(Number(chat.is_online)),
            folderId: chat.folder_id ? Number(chat.folder_id) : undefined,
            type: chat.type
        }));
        
        console.log('Received chats from server:', response.data);
        console.log('Transformed chats:', chats);
        
        return chats;
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
 * @param folderId ID папки, в которой происходит закрепление (по умолчанию 0 - "Все чаты")
 */
export const toggleChatPin = async (chatId: number, isPinned: boolean, folderId: number = 0): Promise<boolean> => {
    try {
        const response = await api.post('/chat/toggle_pin', { chat_id: chatId, is_pinned: isPinned, folder_id: folderId });
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