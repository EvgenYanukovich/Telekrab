import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Chat.module.css';

interface Message {
    id: number;
    senderId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
    isOwn: boolean;
    senderName?: string;
    isEdited?: boolean;
}

interface ChatUser {
    id: number;
    name: string;
    avatarPath: string | null;
    isOnline: boolean;
    lastSeen?: string;
}

interface ChatProps {
    onEmojiClick?: () => void;
    onMenuClick?: () => void;
    insertEmojiToInput?: (insertFunction: (emoji: string) => void) => void;
}

export const Chat: React.FC<ChatProps> = ({ onEmojiClick, onMenuClick, insertEmojiToInput }) => {
    const [newMessage, setNewMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const currentUserId = 1; // Имитация ID текущего пользователя
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Хардкодные данные для демонстрации
    const chatInfo: ChatUser = {
        id: 2,
        name: 'Иван Иванов',
        avatarPath: null,
        isOnline: true,
        lastSeen: 'был в сети 5 минут назад'
    };

    const messages: Message[] = [
        {
            id: 1,
            senderId: 2,
            content: 'Привет! Как у тебя дела?',
            timestamp: '14:25',
            isRead: true,
            isOwn: false
        },
        {
            id: 2,
            senderId: currentUserId,
            content: 'Привет! Всё отлично, спасибо. Работаю над проектом сейчас.',
            timestamp: '14:27',
            isRead: true,
            isOwn: true
        },
        {
            id: 3,
            senderId: 2,
            content: 'О, круто! Какой проект?',
            timestamp: '14:28',
            isRead: true,
            isOwn: false
        },
        {
            id: 4,
            senderId: currentUserId,
            content: 'Разрабатываю мессенджер похожий на Телеграм для учебного проекта.',
            timestamp: '14:30',
            isRead: true,
            isOwn: true
        },
        {
            id: 5,
            senderId: 2,
            content: 'Вау, звучит интересно! Дашь потом посмотреть?',
            timestamp: '14:32',
            isRead: false,
            isOwn: false
        }
    ];

    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;
        
        // В реальном приложении здесь будет API запрос
        console.log('Отправка сообщения:', newMessage);
        
        // Очистка поля ввода
        setNewMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleEmojiPanel = () => {
        if (onEmojiClick) {
            onEmojiClick();
        } else {
            setShowEmoji(!showEmoji);
        }
    };

    // Добавляем функцию для вставки эмодзи в сообщение
    const insertEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        
        // Фокус на текстовом поле после вставки эмодзи
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };
    
    // Передаем функцию вставки эмодзи в родительский компонент через useEffect
    useEffect(() => {
        if (insertEmojiToInput) {
            insertEmojiToInput(insertEmoji);
        }
    }, [insertEmojiToInput]);

    return (
        <>
            <div className={styles.chat_header}>
                <div className={styles.chat_user_info}>
                    <div className={styles.chat_avatar}>
                        {chatInfo.avatarPath ? (
                            <img src={chatInfo.avatarPath} alt={chatInfo.name} />
                        ) : (
                            <div className={styles.avatar_placeholder}>
                                {chatInfo.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {chatInfo.isOnline && <span className={styles.online_indicator}></span>}
                    </div>
                    <div className={styles.chat_user_details}>
                        <h3 className={styles.chat_user_name}>{chatInfo.name}</h3>
                        <p className={styles.chat_user_status}>
                            {chatInfo.isOnline ? 'в сети' : chatInfo.lastSeen}
                        </p>
                    </div>
                </div>
                <div className={styles.chat_actions}>
                    <button className={styles.icon_button}>
                        <span role="img" aria-label="search">🔍</span>
                    </button>
                    <button className={styles.icon_button} onClick={onMenuClick}>
                        <span role="img" aria-label="more">⋮</span>
                    </button>
                </div>
            </div>
            
            <div className={styles.messages_container}>
                {messages.map(message => (
                    <div 
                        key={message.id} 
                        className={`${styles.message} ${message.isOwn ? styles.message_own : styles.message_other}`}
                    >
                        <div className={styles.message_content}>
                            {message.content}
                        </div>
                        <div className={styles.message_info}>
                            <span className={styles.message_time}>{message.timestamp}</span>
                            {message.isOwn && (
                                <span className={styles.message_status}>
                                    {message.isRead ? '✓✓' : '✓'}
                                </span>
                            )}
                            {message.isEdited && <span className={styles.message_edited}>(ред.)</span>}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className={styles.message_input_container}>
                <button className={styles.input_action_button}>
                    <span role="img" aria-label="attach">📎</span>
                </button>
                <textarea 
                    className={styles.message_input}
                    placeholder="Напишите сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    ref={textareaRef}
                />
                <button 
                    className={styles.input_action_button}
                    onClick={toggleEmojiPanel}
                >
                    <span role="img" aria-label="emoji">😊</span>
                </button>
                <button 
                    className={`${styles.send_button} ${newMessage.trim() ? styles.send_button_active : ''}`}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                >
                    <span role="img" aria-label="send">➤</span>
                </button>
            </div>
        </>
    );
};