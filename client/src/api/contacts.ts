import axios from 'axios';

const API_URL = 'https://api.telekrab.org';

// Создаем экземпляр axios с настройками
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

// Добавляем перехватчик для установки заголовка Authorization со значением токена из localStorage
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

export interface Contact {
  id: number;
  nickname: string;
  original_nickname: string;
  bio: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface RecommendedUser {
  id: number;
  nickname: string;
  bio: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  recommended: RecommendedUser[];
}

/**
 * Получение списка контактов и рекомендаций
 */
export const getContacts = async (): Promise<ContactsResponse> => {
  try {
    console.log('Отправка запроса на получение контактов...');
    const response = await axiosInstance.get(`${API_URL}/user/contacts`);
    console.log('Ответ получен:', response.data);
    
    // Проверяем наличие ожидаемых полей в ответе
    if (!response.data || typeof response.data !== 'object') {
      console.error('Неверный формат ответа:', response.data);
      return { contacts: [], recommended: [] };
    }
    
    // Проверяем поля contacts и recommended
    const contacts = Array.isArray(response.data.contacts) ? response.data.contacts : [];
    const recommended = Array.isArray(response.data.recommended) ? response.data.recommended : [];
    
    console.log(`Получено контактов: ${contacts.length}, рекомендаций: ${recommended.length}`);
    
    return { 
      contacts, 
      recommended 
    };
  } catch (error) {
    console.error('Ошибка при получении списка контактов:', error);
    return { contacts: [], recommended: [] };
  }
};

/**
 * Добавление контакта
 */
export const addContact = async (contactId: number, nickname?: string): Promise<Contact | null> => {
  try {
    const response = await axiosInstance.post(`${API_URL}/user/contacts`, {
      contact_id: contactId,
      nickname
    });
    
    return response.data.success ? response.data.contact : null;
  } catch (error) {
    console.error('Ошибка при добавлении контакта:', error);
    return null;
  }
};

/**
 * Удаление контакта
 */
export const removeContact = async (contactId: number): Promise<boolean> => {
  try {
    const response = await axiosInstance.delete(`${API_URL}/user/contacts`, {
      data: { 
        contact_id: contactId 
      }
    });
    return response.data.success;
  } catch (error) {
    console.error('Ошибка при удалении контакта:', error);
    return false;
  }
};

export const updateContactNickname = async (contactId: number, nickname: string): Promise<any> => {
  try {
    const response = await axiosInstance.patch(`${API_URL}/user/contacts`, {
      data: { 
        contact_id: contactId,
        nickname: nickname
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при обновлении контакта:', error);
    return { error: 'Не удалось обновить контакт' };
  }
};

/**
 * Поиск контактов и пользователей
 */
export const searchUsers = async (query: string): Promise<any> => {
  try {
    const response = await axiosInstance.get(`${API_URL}/user/search`, { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error('Ошибка при поиске пользователей:', error);
    return { error: 'Не удалось выполнить поиск' };
  }
};