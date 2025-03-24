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

export interface Folder {
    folder_id: number;
    name: string;
    icon: string;
    color: string;
    position: number;
    isSystem?: boolean;
    created_at?: string;
    updated_at?: string;
}

/**
 * Получение всех папок пользователя
 */
export const getUserFolders = async (): Promise<Folder[]> => {
    try {
        const response = await api.get('/folder/all');
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении папок:', error);
        return [];
    }
};

/**
 * Создание новой папки
 * @param name Название папки
 * @param color Цвет папки
 * @param icon Иконка папки (опционально)
 */
export const createFolder = async (name: string, color: string, icon: string = ''): Promise<Folder> => {
    const response = await api.post('/folder/create', { name, color, icon });
    return response.data;
};

/**
 * Обновление существующей папки
 * @param id ID папки
 * @param name Новое название папки
 * @param color Новый цвет папки
 * @param icon Новая иконка папки (опционально)
 */
export const updateFolder = async (id: number, name: string, color: string, icon?: string): Promise<Folder> => {
    const data: Record<string, any> = { name, color };
    if (icon !== undefined) {
        data.icon = icon;
    }
    
    const response = await api.put(`/folder/update/${id}`, data);
    return response.data;
};

/**
 * Удаление папки
 * @param id ID папки для удаления
 */
export const deleteFolder = async (id: number): Promise<void> => {
    await api.delete(`/folder/delete/${id}`);
};

/**
 * Получение чатов в папке
 * @param folderId ID папки
 */
export const getFolderChats = async (folderId: number): Promise<any[]> => {
    try {
        const response = await api.get(`/folder/chats/${folderId}`);
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении чатов из папки:', error);
        return [];
    }
};

/**
 * Добавление чата в папку
 * @param folderId ID папки
 * @param chatId ID чата
 */
export const addChatToFolder = async (folderId: number, chatId: number): Promise<void> => {
    await api.post(`/folder/chat/add`, { folder_id: folderId, chat_id: chatId });
};

/**
 * Удаление чата из папки
 * @param folderId ID папки
 * @param chatId ID чата
 */
export const removeChatFromFolder = async (folderId: number, chatId: number): Promise<void> => {
    await api.delete(`/folder/chat/remove`, { 
        data: { folder_id: folderId, chat_id: chatId } 
    });
};
