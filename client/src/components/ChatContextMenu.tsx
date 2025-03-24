import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/ChatContextMenu.module.css';
import { useQuery } from '@tanstack/react-query';
import { getUserFolders } from '../api/folders';

export interface Chat {
    id: number;
    name: string;
    isPinned: boolean;
    folderId?: number;
}

interface ChatContextMenuProps {
    chat: Chat;
    position: { x: number; y: number };
    onClose: () => void;
    onPin: (chatId: number, pin: boolean) => void;
    onAddToFolder: (chatId: number, folderId: number) => void;
    onRemoveFromFolder: (chatId: number, folderId?: number) => void;
    onDelete: (chatId: number) => void;
}

const ChatContextMenu: React.FC<ChatContextMenuProps> = ({
    chat,
    position,
    onClose,
    onPin,
    onAddToFolder,
    onRemoveFromFolder,
    onDelete
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Запрос на получение папок
    const { data: folders = [] } = useQuery({
        queryKey: ['folders'],
        queryFn: getUserFolders
    });
    
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
        onRemoveFromFolder(chat.id, chat.folderId);
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
    
    // Рендерим через портал в конец body
    return createPortal(
        <div className={styles.context_menu} style={menuStyle} ref={menuRef}>
            <ul className={styles.menu_list}>
                <li className={styles.menu_item} onClick={handlePinToggle}>
                    {chat.isPinned ? 'Открепить чат' : 'Закрепить чат'}
                </li>
                
                {/* Подменю для добавления в папку */}
                <li className={styles.menu_item + ' ' + styles.submenu}>
                    <span>Добавить в папку</span>
                    <ul className={styles.submenu_list}>
                        {folders.map(folder => (
                            <li 
                                key={folder.folder_id} 
                                className={styles.submenu_item}
                                onClick={() => handleAddToFolder(folder.folder_id)}
                            >
                                {folder.name}
                            </li>
                        ))}
                        {folders.length === 0 && (
                            <li className={styles.submenu_item + ' ' + styles.disabled}>
                                Нет доступных папок
                            </li>
                        )}
                    </ul>
                </li>
                
                {/* Опция удаления из папки доступна только если чат уже в папке */}
                {chat.folderId !== undefined && chat.folderId !== 0 && (
                    <li className={styles.menu_item} onClick={handleRemoveFromFolder}>
                        Удалить из папки
                    </li>
                )}
                
                <li className={styles.menu_item + ' ' + styles.delete_item} onClick={handleDelete}>
                    Удалить чат
                </li>
            </ul>
        </div>,
        document.body
    );
};

export default ChatContextMenu;
