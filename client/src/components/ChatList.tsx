import { useState } from 'react';
import styles from '../styles/ChatList.module.css';
import ChatContextMenu, { Chat as ChatType } from './ChatContextMenu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addChatToFolder, removeChatFromFolder } from '../api/folders';

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
    folderId?: number;
}

export const ChatList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChat, setActiveChat] = useState<number>(1); // Устанавливаем первый чат как активный по умолчанию
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        chatId: number;
    }>({
        visible: false,
        position: { x: 0, y: 0 },
        chatId: 0
    });
    
    const queryClient = useQueryClient();
    
    // Мутации для работы с папками
    const addToFolderMutation = useMutation({
        mutationFn: ({ chatId, folderId }: { chatId: number; folderId: number }) => 
            addChatToFolder(folderId, chatId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            queryClient.invalidateQueries({ queryKey: ['folderChats'] });
        }
    });
    
    const removeFromFolderMutation = useMutation({
        mutationFn: ({ chatId, folderId }: { chatId: number; folderId?: number }) => {
            if (folderId === undefined) return Promise.resolve();
            return removeChatFromFolder(folderId, chatId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            queryClient.invalidateQueries({ queryKey: ['folderChats'] });
        }
    });
    
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
            type: 'personal',
            folderId: 0 // Все чаты
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
            type: 'group',
            folderId: 1 // Предположим, что это папка "Работа"
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
    
    // Обработчик правого клика для открытия контекстного меню
    const handleContextMenu = (event: React.MouseEvent, chatId: number) => {
        event.preventDefault();
        
        // Получаем DOM элемент чата
        const chatElement = event.currentTarget as HTMLElement;
        const chatRect = chatElement.getBoundingClientRect();
        
        // Позиционируем меню справа от чата на той же высоте, где находится курсор
        setContextMenu({
            visible: true,
            position: { 
                x: chatRect.right + 5, // 5px отступ от чата
                y: event.clientY 
            },
            chatId
        });
    };
    
    // Закрытие контекстного меню
    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, visible: false }));
    };
    
    // Обработчик закрепления/открепления чата
    const handlePinToggle = (chatId: number, pin: boolean) => {
        // В реальном приложении здесь будет API-вызов
        console.log(`${pin ? 'Закрепление' : 'Откреплениe'} чата ${chatId}`);
        // Обновляем список чатов в UI
        // В реальном приложении это должен делать query-client после успешного запроса к API
    };
    
    // Обработчик добавления чата в папку
    const handleAddToFolder = (chatId: number, folderId: number) => {
        addToFolderMutation.mutate({ chatId, folderId });
    };
    
    // Обработчик удаления чата из папки
    const handleRemoveFromFolder = (chatId: number, folderId?: number) => {
        removeFromFolderMutation.mutate({ chatId, folderId });
    };
    
    // Обработчик удаления чата
    const handleDeleteChat = (chatId: number) => {
        // В реальном приложении здесь будет API-вызов
        console.log(`Удаление чата ${chatId}`);
        // Обновляем список чатов в UI
        // В реальном приложении это должен делать query-client после успешного запроса к API
    };
    
    // Получаем текущий чат для контекстного меню
    const getCurrentChatForContextMenu = (): ChatType | null => {
        const chat = chats.find(c => c.id === contextMenu.chatId);
        if (!chat) return null;
        
        return {
            id: chat.id,
            name: chat.name,
            isPinned: chat.isPinned,
            folderId: chat.folderId
        };
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
                        onContextMenu={(e) => handleContextMenu(e, chat.id)}
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
            
            {/* Контекстное меню */}
            {contextMenu.visible && (
                <ChatContextMenu 
                    chat={getCurrentChatForContextMenu()!}
                    position={contextMenu.position}
                    onClose={closeContextMenu}
                    onPin={handlePinToggle}
                    onAddToFolder={handleAddToFolder}
                    onRemoveFromFolder={handleRemoveFromFolder}
                    onDelete={handleDeleteChat}
                />
            )}
        </>
    );
};
