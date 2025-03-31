import { useState, useEffect } from 'react';
import styles from '../styles/ChatList.module.css';
import ChatContextMenu, { Chat as ChatType } from './ChatContextMenu';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addChatToFolder, removeChatFromFolder } from '../api/folders';
import { 
    getUserChats,
    searchChats,
    toggleChatPin,
    deleteChat as apiDeleteChat,
    getContactsWithoutChat,
    createChat as apiCreateChat,
    Contact
} from '../api/chats';

export const ChatList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeChat, setActiveChat] = useState<number | null>(null); 
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        position: { x: number; y: number };
        chatId: number;
    }>({ visible: false, position: { x: 0, y: 0 }, chatId: 0 });
    
    const [showContactsWithoutChat, setShowContactsWithoutChat] = useState(false);
    
    const queryClient = useQueryClient();
    
    // Получение чатов через API
    const { data: chats = [], isLoading: isChatsLoading } = useQuery({
        queryKey: ['chats'],
        queryFn: getUserChats
    });
    
    // Получение контактов без чатов
    const { data: contactsWithoutChat = [], isLoading: isContactsLoading, isError: isContactsError } = useQuery<Contact[]>({
        queryKey: ['contactsWithoutChat'],
        queryFn: getContactsWithoutChat,
        // Активируем запрос только когда нужно показать контакты
        enabled: showContactsWithoutChat,
        retry: 1
    });
    
    // Исправляем ошибку типизации и добавляем обработку ошибок с использованием useEffect
    useEffect(() => {
        if (isContactsError) {
            setShowContactsWithoutChat(false);
        }
    }, [isContactsError]);
    
    // Мутации для работы с чатами
    const pinChatMutation = useMutation({
        mutationFn: ({ chatId, isPinned }: { chatId: number; isPinned: boolean }) => 
            toggleChatPin(chatId, isPinned),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });
    
    const deleteChatMutation = useMutation({
        mutationFn: (chatId: number) => apiDeleteChat(chatId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
    });
    
    const createChatMutation = useMutation({
        mutationFn: (contactId: number) => apiCreateChat(contactId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            // Скрываем список контактов после создания чата
            setShowContactsWithoutChat(false);
        }
    });
    
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
    
    // Поиск чатов
    const handleSearch = async () => {
        if (searchQuery.trim() === '') {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            return;
        }
        
        try {
            const foundChats = await searchChats(searchQuery);
            queryClient.setQueryData(['chats'], foundChats);
        } catch (error) {
            console.error('Ошибка при поиске чатов:', error);
        }
    };

    // Сортировка чатов: сначала закрепленные, затем по времени последнего сообщения
    const sortedChats = [...chats].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    const handleChatClick = (chatId: number) => {
        setActiveChat(chatId);
    };
    
    // Обработчик клика по контакту (создание нового чата)
    const handleContactClick = async (contactId: number) => {
        try {
            if (!contactId) {
                console.error('ID контакта не передан');
                return;
            }
            
            const result = await createChatMutation.mutateAsync(contactId);
            
            if (result && result.id) {
                // Обновляем список чатов и активируем новый чат
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                setActiveChat(result.id);
                // Скрываем список контактов после создания чата
                setShowContactsWithoutChat(false);
            }
        } catch (error) {
            console.error('Ошибка при создании чата:', error);
        }
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
        pinChatMutation.mutate({ chatId, isPinned: pin });
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
        deleteChatMutation.mutate(chatId);
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
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button 
                    className={styles.toggle_contacts_button}
                    onClick={() => setShowContactsWithoutChat(!showContactsWithoutChat)}
                >
                    {showContactsWithoutChat ? 'Показать чаты' : 'Новый чат'}
                </button>
            </div>
            <div className={styles.section_content}>
                {isChatsLoading || isContactsLoading ? (
                    <div className={styles.loading}>Загрузка...</div>
                ) : showContactsWithoutChat ? (
                    // Показываем контакты без чатов
                    Array.isArray(contactsWithoutChat) && contactsWithoutChat.length > 0 ? (
                        contactsWithoutChat.map((contact: Contact, index) => (
                            <div 
                                key={`contact-${contact.id || index}`} 
                                className={styles.chat_item}
                                onClick={() => handleContactClick(contact.id)}
                            >
                                <div className={styles.chat_avatar}>
                                    {contact.avatarPath ? (
                                        <img src={contact.avatarPath} alt={contact.name || 'Чат без имени'} />
                                    ) : (
                                        <div className={styles.avatar_placeholder}>
                                            {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                    {contact.isOnline && <span className={styles.online_indicator}></span>}
                                </div>
                                <div className={styles.chat_info}>
                                    <div className={styles.chat_header}>
                                        <span className={styles.chat_name}>{contact.name || 'Без имени'}</span>
                                    </div>
                                    <div className={styles.chat_footer}>
                                        <p className={styles.chat_last_message}>
                                            Начать чат с {contact.name || 'контактом'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.empty_state}>
                            У вас нет контактов, с которыми не начат чат
                        </div>
                    )
                ) : (
                    // Показываем список чатов
                    sortedChats.length > 0 ? (
                        sortedChats.map((chat, index) => (
                            <div 
                                key={`chat-${chat.id || index}`} 
                                className={`${styles.chat_item} ${activeChat === chat.id ? styles.chat_item_active : ''}`}
                                onClick={() => handleChatClick(chat.id)}
                                onContextMenu={(e) => handleContextMenu(e, chat.id)}
                            >
                                <div className={styles.chat_avatar}>
                                    {chat.avatarPath ? (
                                        <img src={chat.avatarPath} alt={(chat.name || 'Чат без имени')} />
                                    ) : (
                                        <div className={styles.avatar_placeholder}>
                                            {chat.name ? chat.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    )}
                                    {chat.isOnline && <span className={styles.online_indicator}></span>}
                                </div>
                                <div className={styles.chat_info}>
                                    <div className={styles.chat_header}>
                                        <span className={styles.chat_name}>{chat.name || 'Чат без имени'}</span>
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
                        ))
                    ) : (
                        <div className={styles.empty_state}>
                            У вас пока нет чатов
                        </div>
                    )
                )}
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
