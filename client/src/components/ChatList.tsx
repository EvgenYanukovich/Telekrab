import { useState } from 'react';
import styles from '../styles/ChatList.module.css';

interface Chat {
    id: number;
    name: string;
    avatarPath: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isPinned: boolean;
    isOnline: boolean;
    type?: 'personal' | 'group' | 'channel';
}

export const ChatList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChat, setActiveChat] = useState<number>(1); // Устанавливаем первый чат как активный по умолчанию
    
    // Хардкодные данные для демонстрации
    const chats: Chat[] = [
        {
            id: 1,
            name: 'Иван Иванов',
            avatarPath: null,
            lastMessage: 'Привет, как дела?',
            lastMessageTime: '14:30',
            unreadCount: 2,
            isPinned: true,
            isOnline: true,
            type: 'personal'
        },
        {
            id: 2,
            name: 'Мария Петрова',
            avatarPath: null,
            lastMessage: 'Не забудь про встречу завтра!',
            lastMessageTime: '12:15',
            unreadCount: 0,
            isPinned: true,
            isOnline: false,
            type: 'personal'
        },
        {
            id: 3,
            name: 'Группа проекта',
            avatarPath: null,
            lastMessage: 'Алексей: Отправил вам документацию',
            lastMessageTime: 'Вчера',
            unreadCount: 5,
            isPinned: false,
            isOnline: false,
            type: 'group'
        },
        {
            id: 4,
            name: 'Анна Сергеева',
            avatarPath: null,
            lastMessage: 'Спасибо за помощь!',
            lastMessageTime: 'Вчера',
            unreadCount: 0,
            isPinned: false,
            isOnline: true,
            type: 'personal'
        },
        {
            id: 5,
            name: 'Новости IT',
            avatarPath: null,
            lastMessage: 'Вышла новая версия React 19!',
            lastMessageTime: '20.03',
            unreadCount: 1,
            isPinned: false,
            isOnline: false,
            type: 'channel'
        }
    ];

    // Сортировка чатов: сначала закрепленные, затем по времени последнего сообщения
    const sortedChats = [...chats].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    // Фильтрация чатов по поисковому запросу
    const filteredChats = sortedChats.filter(chat => 
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatClick = (chatId: number) => {
        setActiveChat(chatId);
    };

    return (
        <>
            <div className={styles.section_header}>
                <div className={styles.search_container}>
                    <input 
                        type="text" 
                        placeholder="Поиск" 
                        className={styles.search_input}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className={styles.section_content}>
                {filteredChats.map(chat => (
                    <div 
                        key={chat.id} 
                        className={`${styles.chat_item} ${activeChat === chat.id ? styles.chat_item_active : ''}`}
                        onClick={() => handleChatClick(chat.id)}
                    >
                        <div className={styles.chat_avatar}>
                            {chat.avatarPath ? (
                                <img src={chat.avatarPath} alt={chat.name} />
                            ) : (
                                <div className={styles.avatar_placeholder}>
                                    {chat.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            {chat.isOnline && <span className={styles.online_indicator}></span>}
                        </div>
                        <div className={styles.chat_info}>
                            <div className={styles.chat_header}>
                                <span className={styles.chat_name}>{chat.name}</span>
                                <span className={styles.chat_time}>{chat.lastMessageTime}</span>
                            </div>
                            <div className={styles.chat_footer}>
                                <p className={styles.chat_last_message}>{chat.lastMessage}</p>
                                {chat.unreadCount > 0 && (
                                    <span className={styles.unread_count}>{chat.unreadCount}</span>
                                )}
                                {chat.isPinned && (
                                    <div className={styles.pinned_icon}>
                                        <svg className={styles.icon_svg}>
                                            <use xlinkHref="/assets/icons/pin.svg" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
