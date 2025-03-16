import { useState } from 'react';
import styles from '../styles/Folder.module.css';

interface FolderItem {
    id: number;
    name: string;
    iconType: string;
    isSystem?: boolean;
}

interface FolderProps {
    onMenuClick?: () => void;
}

export const Folder: React.FC<FolderProps> = ({ onMenuClick }) => {
    const [activeFolder, setActiveFolder] = useState<number>(1);

    // Хардкодные данные для демонстрации
    const folders: FolderItem[] = [
        { id: 0, name: 'Меню', iconType: 'menu', isSystem: true },
        { id: 1, name: 'Все чаты', iconType: 'chat', isSystem: true },
        { id: 2, name: 'Работа', iconType: 'folder' },
        { id: 3, name: 'Учеба', iconType: 'folder' },
        { id: 4, name: 'Друзья', iconType: 'folder' },
        { id: 5, name: 'Настройки', iconType: 'settings', isSystem: true },
    ];

    const handleFolderClick = (folderId: number) => {
        if (folderId === 0) { // Клик на меню
            if (onMenuClick) {
                onMenuClick();
            }
        } else if (folderId === 5) { // Клик на настройки
            // Здесь будет обработка клика на настройки
        } else { // Клик на обычную папку
            setActiveFolder(folderId);
        }
    };

    const getIconPath = (iconType: string) => {
        switch (iconType) {
            case 'folder':
                return '/assets/icons/folder.svg';
            case 'chat':
                return '/assets/icons/chat.svg';
            case 'menu':
                return 'M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z';
            case 'settings':
                return 'M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z';
            default:
                return '';
        }
    };

    // Рендер SVG-иконки
    const renderIcon = (iconType: string) => {
        const path = getIconPath(iconType);
        
        if (iconType === 'menu' || iconType === 'settings') {
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" className={styles.folder_svg_icon}>
                    <path d={path} fill="currentColor" />
                </svg>
            );
        }
        
        // Для стандартных иконок используем импорт из файла
        return (
            <div className={styles.folder_svg_container}>
                <svg className={styles.folder_svg_icon}>
                    <use xlinkHref={path} />
                </svg>
            </div>
        );
    };

    return (
        <div className={styles.folder_list}>
            {folders.map(folder => (
                <div 
                    key={folder.id} 
                    className={`${styles.folder_item} ${activeFolder === folder.id ? styles.folder_active : ''}`}
                    onClick={() => handleFolderClick(folder.id)}
                >
                    {renderIcon(folder.iconType)}
                    {folder.name && <div className={styles.folder_tooltip}>{folder.name}</div>}
                </div>
            ))}
        </div>
    );
};