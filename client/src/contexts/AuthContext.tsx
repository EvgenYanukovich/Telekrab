import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isAuthenticated: boolean;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Инициализируем состояние пользователя из localStorage
    const [user, setUserState] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        console.log('Инициализация AuthProvider, сохраненный пользователь:', savedUser);
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error('Ошибка при парсинге пользователя из localStorage:', e);
            return null;
        }
    });
    const navigate = useNavigate();

    // Создаем функцию setUser, которая будет безопасно обновлять состояние
    const setUser = useCallback((newUser: User | null) => {
        console.log('setUser вызван с:', newUser);
        
        // Обновляем состояние
        setUserState(prevUser => {
            // Если новый пользователь идентичен текущему, не обновляем состояние
            if (JSON.stringify(prevUser) === JSON.stringify(newUser)) {
                console.log('Пользователь не изменился, состояние не обновлено');
                return prevUser;
            }
            
            console.log('Обновление состояния пользователя:', newUser);
            
            // Сохраняем в localStorage
            if (newUser) {
                localStorage.setItem('user', JSON.stringify(newUser));
            } else {
                localStorage.removeItem('user');
            }
            
            return newUser;
        });
    }, []);

    // Проверяем токен при загрузке приложения
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        console.log('Проверка авторизации при загрузке:', { token: !!token, savedUser: !!savedUser });
        
        // Если в локальном хранилище нет токена или пользователя, выходим из аккаунта
        if (!token || !savedUser) {
            setUser(null);
            return;
        }
        
        // Устанавливаем пользователя из локального хранилища
        try {
            const parsedUser = JSON.parse(savedUser);
            console.log('Восстановлен пользователь:', parsedUser);
            setUser(parsedUser);
        } catch (e) {
            console.error('Ошибка при парсинге данных пользователя:', e);
            setUser(null);
        }
    }, [setUser]);

    // Функция для выхода из аккаунта
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    }, [navigate, setUser]);

    // Создаем объект context с текущими значениями
    const contextValue: AuthContextType = {
        user,
        setUser,
        isAuthenticated: !!user,
        logout
    };
    
    console.log('Текущее состояние AuthContext:', {
        user,
        isAuthenticated: !!user,
        hasSetUser: !!setUser,
        hasLogout: !!logout
    });

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
