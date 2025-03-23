import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Chat.module.css';

// Интерфейс для реакций
interface Reaction {
    emoji: string;
    count: number;
    users: number[]; // ID пользователей, поставивших реакцию
}

interface Message {
    id: number;
    senderId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
    isOwn: boolean;
    senderName?: string;
    isEdited?: boolean;
    reactions?: Reaction[]; // Реакции на сообщение
    isPinned?: boolean; // Закреплено ли сообщение
    replyTo?: { id: number; content: string; senderName: string }; // Ответ на сообщение
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
    const [activeReactionMessageId, setActiveReactionMessageId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const currentUserId = 1; // Имитация ID текущего пользователя
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPanelRef = useRef<HTMLDivElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    
    // Состояние для контекстного меню
    const [contextMenu, setContextMenu] = useState<{
        messageId: number;
        position: {x: number; y: number};
        isVisible: boolean;
    } | null>(null);
    
    // Состояние для редактирования сообщения
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editMessageContent, setEditMessageContent] = useState('');
    
    // Состояние для ответа на сообщение
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
    
    // Состояние для закрепленного сообщения
    const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

    // Хардкодные данные для демонстрации
    const chatInfo: ChatUser = {
        id: 2,
        name: 'Иван Иванов',
        avatarPath: null,
        isOnline: true,
        lastSeen: 'был в сети 5 минут назад'
    };

    // Инициализация сообщений с некоторыми реакциями
    useEffect(() => {
        setMessages([
            {
                id: 1,
                senderId: 2,
                content: 'Привет! Как у тебя дела?',
                timestamp: '14:25',
                isRead: true,
                isOwn: false,
                reactions: [
                    { emoji: '👍', count: 1, users: [1] }
                ]
            },
            {
                id: 2,
                senderId: currentUserId,
                content: 'Привет! Всё отлично, спасибо! Работаю над новым проектом.',
                timestamp: '14:28',
                isRead: true,
                isOwn: true,
                reactions: [
                    { emoji: '❤️', count: 1, users: [2] },
                    { emoji: '🔥', count: 1, users: [3] }
                ]
            },
            {
                id: 3,
                senderId: 2,
                content: 'Звучит интересно! Расскажешь подробнее?',
                timestamp: '14:30',
                isRead: true,
                isOwn: false
            },
            {
                id: 4,
                senderId: currentUserId,
                content: 'Конечно! Это приложение для обмена сообщениями, похожее на Telegram.',
                timestamp: '14:35',
                isRead: true,
                isOwn: true
            },
            {
                id: 5,
                senderId: 2,
                content: 'Здорово! Буду рад потестировать, когда закончишь.',
                timestamp: '14:40',
                isRead: false,
                isOwn: false
            }
        ]);
    }, [currentUserId]);

    // Обработчик отправки сообщения
    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;

        // Здесь будет логика отправки сообщения на сервер
        console.log('Отправка сообщения:', newMessage);

        // Добавление сообщения в локальный стейт (временное решение)
        setNewMessage('');
    };

    // Обработчик нажатия Enter для отправки сообщения
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Обработчик добавления эмодзи в поле ввода
    const handleEmojiInsert = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
    };

    // Передача функции вставки эмодзи родительскому компоненту
    useEffect(() => {
        if (insertEmojiToInput) {
            insertEmojiToInput(handleEmojiInsert);
        }
    }, [insertEmojiToInput]);

    // Функция для открытия/закрытия панели эмодзи
    const toggleEmojiPanel = () => {
        if (onEmojiClick) {
            onEmojiClick();
        }
    };

    // Обработчик двойного клика по сообщению для добавления реакции
    const handleMessageDoubleClick = (messageId: number, event: React.MouseEvent) => {
        event.stopPropagation();
        setActiveReactionMessageId(messageId);
    };

    // Обработчик клика вне панели эмодзи
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emojiPanelRef.current &&
                !emojiPanelRef.current.contains(event.target as Node)
            ) {
                setActiveReactionMessageId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Добавление или удаление реакции
    const handleAddReaction = (messageId: number, emoji: string) => {
        setMessages(prevMessages =>
            prevMessages.map(message => {
                if (message.id === messageId) {
                    // Копируем массив реакций или создаем новый, если его нет
                    const reactions = message.reactions ? [...message.reactions] : [];

                    // Ищем, есть ли уже такая реакция от текущего пользователя
                    const existingReactionIndex = reactions.findIndex(
                        reaction => reaction.emoji === emoji && reaction.users.includes(currentUserId)
                    );

                    // Если реакция уже есть, удаляем пользователя из нее
                    if (existingReactionIndex !== -1) {
                        const updatedUsers = reactions[existingReactionIndex].users.filter(
                            userId => userId !== currentUserId
                        );

                        if (updatedUsers.length === 0) {
                            // Если пользователей не осталось, удаляем реакцию
                            reactions.splice(existingReactionIndex, 1);
                        } else {
                            // Иначе обновляем список пользователей и счетчик
                            reactions[existingReactionIndex] = {
                                ...reactions[existingReactionIndex],
                                users: updatedUsers,
                                count: updatedUsers.length
                            };
                        }
                    } else {
                        // Проверяем, сколько реакций уже поставил текущий пользователь
                        const userReactionsCount = reactions.filter(
                            reaction => reaction.users.includes(currentUserId)
                        ).length;

                        // Если меньше 3, добавляем новую реакцию
                        if (userReactionsCount < 3) {
                            // Ищем, существует ли уже такая реакция (поставленная другими пользователями)
                            const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

                            if (reactionIndex !== -1) {
                                // Если реакция существует, добавляем пользователя и увеличиваем счетчик
                                reactions[reactionIndex] = {
                                    ...reactions[reactionIndex],
                                    users: [...reactions[reactionIndex].users, currentUserId],
                                    count: reactions[reactionIndex].count + 1
                                };
                            } else {
                                // Создаем новую реакцию
                                reactions.push({
                                    emoji,
                                    count: 1,
                                    users: [currentUserId]
                                });
                            }
                        } else {
                            console.log('Максимальное количество реакций (3) достигнуто');
                        }
                    }

                    return { ...message, reactions };
                }
                return message;
            })
        );

        // Закрываем панель выбора эмодзи после выбора
        setActiveReactionMessageId(null);
    };

    // Обработчик для закрытия контекстного меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                contextMenuRef.current && 
                !contextMenuRef.current.contains(event.target as Node)
            ) {
                setContextMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Обработчик правого клика на сообщении
    const handleContextMenu = (message: Message, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            messageId: message.id,
            position: { x: 0, y: 0 },
            isVisible: true
        });
    };

    // Функция закрепления сообщения
    const handlePinMessage = (message: Message) => {
        // Если сообщение уже закреплено, то открепляем его
        if (message.isPinned) {
            setPinnedMessage(null);
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === message.id ? { ...msg, isPinned: false } : msg
                )
            );
        } else {
            // Убираем признак "закреплено" у предыдущего закрепленного сообщения
            if (pinnedMessage) {
                setMessages(prevMessages => 
                    prevMessages.map(msg => 
                        msg.id === pinnedMessage.id ? { ...msg, isPinned: false } : msg
                    )
                );
            }
            
            // Закрепляем новое сообщение
            setPinnedMessage(message);
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === message.id ? { ...msg, isPinned: true } : msg
                )
            );
        }
        
        setContextMenu(null);
    };

    // Функция для ответа на сообщение
    const handleReplyToMessage = (message: Message) => {
        setReplyToMessage(message);
        setContextMenu(null);
        
        // Устанавливаем фокус на поле ввода
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    // Функция для редактирования сообщения
    const handleEditMessage = (message: Message) => {
        // Проверяем, что сообщение принадлежит текущему пользователю
        if (!message.isOwn) {
            console.log('Можно редактировать только свои сообщения');
            return;
        }
        
        setEditingMessageId(message.id);
        setEditMessageContent(message.content);
        setContextMenu(null);
    };

    // Функция сохранения отредактированного сообщения
    const handleSaveEditedMessage = () => {
        if (editingMessageId === null) return;
        
        setMessages(prevMessages => 
            prevMessages.map(message => 
                message.id === editingMessageId 
                    ? { ...message, content: editMessageContent, isEdited: true }
                    : message
            )
        );
        
        setEditingMessageId(null);
        setEditMessageContent('');
    };

    // Функция отмены редактирования сообщения
    const handleCancelEditMessage = () => {
        setEditingMessageId(null);
        setEditMessageContent('');
    };

    // Функция отправки сообщения-ответа
    const handleSendReplyMessage = () => {
        if (newMessage.trim() === '' || !replyToMessage) return;
        
        // Создаем новое сообщение с ответом на другое сообщение
        const replyData = {
            id: replyToMessage.id,
            content: replyToMessage.content.substring(0, 50) + (replyToMessage.content.length > 50 ? '...' : ''),
            senderName: replyToMessage.senderName || 'Пользователь'
        };
        
        // Добавляем новое сообщение
        const newMsgObj: Message = {
            id: Date.now(),
            senderId: currentUserId,
            content: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: false,
            isOwn: true,
            replyTo: replyData
        };
        
        setMessages(prevMessages => [...prevMessages, newMsgObj]);
        setNewMessage('');
        setReplyToMessage(null);
    };

    // Функция отмены ответа на сообщение
    const handleCancelReply = () => {
        setReplyToMessage(null);
    };

    return (
        <div className={styles.chat_container}>
            {/* Закрепленное сообщение */}
            {pinnedMessage && (
                <div className={styles.pinned_message_container}>
                    <div className={styles.pinned_message}>
                        <span className={styles.pin_icon}>📌</span>
                        <div className={styles.pinned_message_content}>
                            <div className={styles.pinned_message_sender}>
                                {pinnedMessage.senderName || 'Пользователь'}
                            </div>
                            <div className={styles.pinned_message_text}>
                                {pinnedMessage.content.substring(0, 100)}
                                {pinnedMessage.content.length > 100 && '...'}
                            </div>
                        </div>
                        <button 
                            className={styles.unpin_button}
                            onClick={() => handlePinMessage(pinnedMessage)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
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
                        onDoubleClick={(e) => handleMessageDoubleClick(message.id, e)}
                        onContextMenu={(e) => handleContextMenu(message, e)}
                    >
                        {/* Если сообщение является ответом на другое */}
                        {message.replyTo && (
                            <div className={styles.reply_container}>
                                <div className={styles.reply_info}>
                                    <span className={styles.reply_sender}>{message.replyTo.senderName}</span>
                                    <span className={styles.reply_text}>{message.replyTo.content}</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Редактирование сообщения */}
                        {editingMessageId === message.id ? (
                            <div className={styles.edit_message_container}>
                                <textarea
                                    className={styles.edit_message_input}
                                    value={editMessageContent}
                                    onChange={(e) => setEditMessageContent(e.target.value)}
                                    autoFocus
                                />
                                <div className={styles.edit_buttons}>
                                    <button 
                                        className={styles.edit_save_button}
                                        onClick={handleSaveEditedMessage}
                                    >
                                        Сохранить
                                    </button>
                                    <button 
                                        className={styles.edit_cancel_button}
                                        onClick={handleCancelEditMessage}
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.message_content}>
                                {message.content}
                            </div>
                        )}

                        {/* Панель выбора эмодзи при двойном клике */}
                        {activeReactionMessageId === message.id && (
                            <div
                                className={styles.reaction_picker}
                                ref={emojiPanelRef}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className={styles.reaction_emoji_list}>
                                    {['👍', '❤️', '🔥', '👏', '😂', '🎉', '😍', '🤔', '😮', '😢'].map((emoji) => (
                                        <div
                                            key={emoji}
                                            className={styles.reaction_emoji_item}
                                            onClick={() => handleAddReaction(message.id, emoji)}
                                        >
                                            {emoji}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Контекстное меню */}
                        {contextMenu && contextMenu.isVisible && contextMenu.messageId === message.id && (
                            <div 
                                className={`${styles.context_menu} ${message.isOwn ? styles.own_message : styles.other_message}`}
                                ref={contextMenuRef}
                            >
                                <div 
                                    className={styles.context_menu_item}
                                    onClick={() => handleReplyToMessage(message)}
                                >
                                    <span className={styles.context_menu_icon}>↩️</span>
                                    <span>Ответить</span>
                                </div>
                                
                                {message.isOwn && (
                                    <div 
                                        className={styles.context_menu_item}
                                        onClick={() => handleEditMessage(message)}
                                    >
                                        <span className={styles.context_menu_icon}>✏️</span>
                                        <span>Редактировать</span>
                                    </div>
                                )}
                                
                                <div 
                                    className={styles.context_menu_item}
                                    onClick={() => handlePinMessage(message)}
                                >
                                    <span className={styles.context_menu_icon}>📌</span>
                                    <span>{message.isPinned ? 'Открепить' : 'Закрепить'}</span>
                                </div>
                            </div>
                        )}

                        <div className={styles.message_info}>
                            <div className={styles.message_meta}>
                                <span className={styles.message_time}>{message.timestamp}</span>
                                {message.isOwn && (
                                    <span className={styles.message_status}>
                                        {message.isRead ? '✓✓' : '✓'}
                                    </span>
                                )}
                                {message.isEdited && <span className={styles.message_edited}>(ред.)</span>}
                                {message.isPinned && <span className={styles.message_pinned}>📌</span>}
                            </div>
                            {/* Отображение реакций в той же строке, что и время */}
                            {message.reactions && message.reactions.length > 0 && (
                                <div className={styles.message_reactions}>
                                    {message.reactions.map((reaction, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.reaction} ${reaction.users.includes(currentUserId) ? styles.reaction_own : ''
                                                }`}
                                            onClick={() => handleAddReaction(message.id, reaction.emoji)}
                                        >
                                            <span className={styles.reaction_emoji}>{reaction.emoji}</span>
                                            {reaction.count > 1 && (
                                                <span className={styles.reaction_count}>{reaction.count}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </div>
                ))}
                
            </div>

            {/* Поле для ответа на сообщение */}
            {replyToMessage && (
                <div className={styles.reply_input_container}>
                    <div className={styles.reply_preview}>
                        <div className={styles.reply_preview_content}>
                            <span className={styles.reply_to}>
                                Ответ на сообщение от: {replyToMessage.senderName || 'Пользователь'}
                            </span>
                            <span className={styles.reply_preview_text}>
                                {replyToMessage.content.substring(0, 50)}
                                {replyToMessage.content.length > 50 && '...'}
                            </span>
                        </div>
                        <button 
                            className={styles.reply_cancel_button}
                            onClick={handleCancelReply}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

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
                    onClick={replyToMessage ? handleSendReplyMessage : handleSendMessage}
                    disabled={!newMessage.trim()}
                >
                    <span role="img" aria-label="send">➤</span>
                </button>
            </div>
        </div>
    );
};