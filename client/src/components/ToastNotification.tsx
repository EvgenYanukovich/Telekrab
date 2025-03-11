import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from '../styles/Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: number;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
    onClose: (id: number) => void;
}

interface ToastContainerProps {
    toasts: ToastProps[];
    setToasts: React.Dispatch<React.SetStateAction<ToastProps[]>>;
}

// Компонент отдельного уведомления
const Toast: React.FC<ToastProps> = ({ id, type, title, message, duration = 5000, onClose }) => {
    const [isLeaving, setIsLeaving] = useState(false);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Настраиваем таймер для закрытия уведомления
        closeTimeoutRef.current = setTimeout(() => {
            setIsLeaving(true);
        }, duration - 300); // Вычитаем время анимации исчезновения

        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, [duration]);

    const handleAnimationEnd = () => {
        if (isLeaving) {
            onClose(id);
        }
    };

    const handleClose = () => {
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
        }
        setIsLeaving(true);
    };

    const defaultTitle = {
        success: 'Успешно',
        error: 'Ошибка',
        warning: 'Предупреждение',
        info: 'Информация'
    }[type];

    return (
        <div
            className={`${styles.toast} ${styles[type]} ${isLeaving ? styles.toast_leaving : ''}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className={styles.toast_title}>
                <span>{title || defaultTitle}</span>
                <button className={styles.close_button} onClick={handleClose}>×</button>
            </div>
            <div className={styles.toast_content}>{message}</div>
            <div 
                className={styles.progress_bar} 
                style={{ 
                    animationDuration: `${duration}ms`,
                }}
            />
        </div>
    );
};

// Контейнер для всех уведомлений
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
    const handleClose = (id: number) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    };

    return ReactDOM.createPortal(
        <div className={styles.toast_container}>
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={handleClose} />
            ))}
        </div>,
        document.body
    );
};

// Счетчик для генерации уникальных ID уведомлений
let toastCounter = 0;

// Глобальный контекст для управления уведомлениями
export const ToastContext = React.createContext<{
    showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
}>({
    showToast: () => {},
});

// Провайдер контекста уведомлений
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastProps[]>([]);

    const showToast = (type: ToastType, message: string, title?: string, duration = 5000) => {
        const id = toastCounter++;
        setToasts((prevToasts) => [
            ...prevToasts,
            { id, type, message, title, duration, onClose: () => {} },
        ]);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} setToasts={setToasts} />
        </ToastContext.Provider>
    );
};

// Хук для использования уведомлений в компонентах
export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
