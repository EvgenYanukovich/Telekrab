import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/ChatContextMenu.module.css';
import { useQuery } from '@tanstack/react-query';
import { getUserFolders } from '../api/folders';

export interface Chat {
    id: number;
    name: string;
    isPinned: boolean;
    folderId?: number;
    folders?: string[];
}

interface ChatContextMenuProps {
    chat: Chat;
    position: { x: number; y: number };
    onClose: () => void;
    onPin: (chatId: number, pin: boolean) => void;
    onAddToFolder: (chatId: number, folderId: number) => void;
    onRemoveFromFolder: (chatId: number, folderId?: number) => void;
    onDelete: (chatId: number) => void;
    currentFolderId?: number;
}

const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
    chat,
    position,
    onClose,
    onPin,
    onAddToFolder,
    onRemoveFromFolder,
    onDelete,
    currentFolderId
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isFolderSubmenuOpen, setIsFolderSubmenuOpen] = useState(false);
    
    // Запрос на получение папок
    const { data: folders = [] } = useQuery({
        queryKey: ['folders'],
        queryFn: getUserFolders
    });
    
    // Проверяем, находится ли чат в папке
    const isChatInFolder = (folderId: number): boolean => {
        // Если есть массив folders, проверяем наличие folderId
        if (chat.folders) {
            return chat.folders.includes(folderId.toString());
        }
        // Если нет массива, проверяем folderId чата
        if (chat.folderId !== undefined) {
            return chat.folderId === folderId;
        }
        return false;
    };
    
    // Хэндлер для закрепления/открепления чата
    const handlePinToggle = () => {
        onPin(chat.id, !chat.isPinned);
        onClose();
    };
    
    // Хэндлер для удаления чата
    const handleDelete = () => {
        if (window.confirm(`Вы уверены, что хотите удалить чат с ${chat.name}?`)) {
            onDelete(chat.id);
            onClose();
        }
    };
    
    // Хэндлер для добавления чата в папку
    const handleAddToFolder = (folderId: number) => {
        onAddToFolder(chat.id, folderId);
        onClose();
    };
    
    // Хэндлер для удаления чата из папки
    const handleRemoveFromFolder = () => {
        // Если мы в текущей папке, используем currentFolderId
        if (currentFolderId && currentFolderId !== 0) {
            onRemoveFromFolder(chat.id, currentFolderId);
        } else if (chat.folderId) {
            // Иначе используем folderId чата
            onRemoveFromFolder(chat.id, chat.folderId);
        }
        onClose();
    };
    
    // Закрытие меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    // Стили для позиционирования меню
    const menuStyle = {
        top: `${position.y}px`,
        left: `${position.x}px`,
    };

    // Тоггл для открытия/закрытия подменю папок
    const toggleFolderSubmenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFolderSubmenuOpen(!isFolderSubmenuOpen);
    };
    
    // Рендерим через портал в конец body
    return createPortal(
        <div className={styles.context_menu} style={menuStyle} ref={menuRef}>
            <ul className={styles.menu_list}>
                <li className={styles.menu_item} onClick={handlePinToggle}>
                    {chat.isPinned ? 'Открепить чат' : 'Закрепить чат'}
                </li>
                
                {/* Подменю для добавления в папку */}
                <li className={styles.menu_item} onClick={toggleFolderSubmenu}>
                    <span>Добавить в папку {isFolderSubmenuOpen ? '▼' : '▶'}</span>
                    {isFolderSubmenuOpen && (
                        <div className={styles.dropdown_submenu}>
                            {folders.map(folder => {
                                // Проверяем, находится ли чат в этой папке
                                const isInFolder = isChatInFolder(folder.folder_id);
                                
                                return (
                                    <div 
                                        key={folder.folder_id} 
                                        className={`${styles.submenu_item} ${isInFolder ? styles.disabled : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isInFolder) {
                                                handleAddToFolder(folder.folder_id);
                                            }
                                        }}
                                    >
                                        {folder.name} {isInFolder && '(уже в папке)'}
                                    </div>
                                );
                            })}
                            {folders.length === 0 && (
                                <div className={`${styles.submenu_item} ${styles.disabled}`}>
                                    Нет доступных папок
                                </div>
                            )}
                        </div>
                    )}
                </li>
                
                {/* Опция удаления из папки доступна только если чат уже в папке */}
                {currentFolderId !== undefined && currentFolderId !== 0 && isChatInFolder(currentFolderId) && (
                    <li className={styles.menu_item} onClick={handleRemoveFromFolder}>
                        Удалить из текущей папки
                    </li>
                )}
                
                <li className={`${styles.menu_item} ${styles.delete_item}`} onClick={handleDelete}>
                    Удалить чат
                </li>
            </ul>
        </div>,
        document.body
    );
};

export default ChatContextMenu;
