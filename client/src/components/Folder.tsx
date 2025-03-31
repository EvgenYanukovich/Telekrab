import { useState, useEffect } from 'react';
import styles from '../styles/Folder.module.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserFolders } from '../api/folders';
import FolderManagement, { Folder as FolderType } from './FolderManagement';

interface FolderProps {
    onMenuClick?: () => void;
    onFolderSelect?: (folderId: number) => void; // Добавляем свойство для уведомления о выборе папки
    activeFolderId?: number; // Добавляем свойство для активной папки
}

export const Folder: React.FC<FolderProps> = ({ onMenuClick, onFolderSelect, activeFolderId = 0 }) => {
    // Используем activeFolderId из свойств или 0 по умолчанию
    const [activeFolder, setActiveFolder] = useState<number>(activeFolderId);
    const [isFolderManagementOpen, setIsFolderManagementOpen] = useState(false);
    
    const queryClient = useQueryClient();
    
    // Синхронизируем внутреннее состояние с пропсом activeFolderId
    useEffect(() => {
        if (activeFolderId !== undefined && activeFolderId !== activeFolder) {
            setActiveFolder(activeFolderId);
        }
    }, [activeFolderId]);
    
    // Запрос на получение папок с сервера
    const foldersQuery = useQuery({
        queryKey: ['folders'],
        queryFn: getUserFolders,
        staleTime: 1000 * 60 * 5, // Считаем данные актуальными в течение 5 минут
        refetchOnWindowFocus: false
    });
    
    // Обработчик открытия/закрытия модального окна управления папками
    const toggleFolderManagement = () => {
        setIsFolderManagementOpen(!isFolderManagementOpen);
    };
    
    // Обработчик закрытия модального окна управления папками
    const closeFolderManagement = () => {
        setIsFolderManagementOpen(false);
        
        // Обновляем список папок после закрытия модального окна
        queryClient.invalidateQueries({ queryKey: ['folders'] });
    };

    // Объединение системных и пользовательских папок
    const getAllFolders = (): FolderType[] => {
        const userFolders = foldersQuery.data || [];
        
        // Системные папки
        const systemFolders: FolderType[] = [
            { 
                folder_id: -1, 
                name: 'Меню', 
                icon: 'menu', 
                color: '#2196F3', 
                position: 0,
                isSystem: true 
            },
        ];
        
        // Добавляем специальный элемент для управления папками
        const folderSettings: FolderType = { 
            folder_id: -2, 
            name: 'Управление папками', 
            icon: 'settings', 
            color: '#607D8B', 
            position: userFolders.length + 2,
            isSystem: true 
        };
        
        return [...systemFolders, ...userFolders, folderSettings];
    };

    const handleFolderClick = (folderId: number) => {
        if (folderId === -1) { // Клик на меню
            if (onMenuClick) {
                onMenuClick();
            }
        } else if (folderId === -2) { // Клик на настройки папок
            toggleFolderManagement();
        } else { // Клик на обычную папку
            setActiveFolder(folderId);
            if (onFolderSelect) {
                onFolderSelect(folderId);
            }
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
    const renderIcon = (folder: FolderType) => {
        const { icon, color, name } = folder;
        
        // Для специальных иконок (меню, настройки)
        if (icon === 'menu' || icon === 'settings') {
            return (
                <svg viewBox="0 0 24 24" width="24" height="24" className={styles.folder_svg_icon}>
                    <path d={getIconPath(icon)} fill="currentColor" />
                </svg>
            );
        }
        
        // Для системной иконки "Все чаты"
        if (icon === 'chat') {
            return (
                <div className={styles.folder_svg_container}>
                    <svg className={styles.folder_svg_icon}>
                        <use xlinkHref={getIconPath(icon)} />
                    </svg>
                </div>
            );
        }
        
        // Для обычных папок рендерим круг с первой буквой названия
        return (
            <div 
                className={styles.folder_icon} 
                style={{ backgroundColor: color || '#2196F3' }}
            >
                {name.substring(0, 1).toUpperCase()}
            </div>
        );
    };

    return (
        <>
            <div className={styles.folder_list}>
                {foldersQuery.isPending ? (
                    <div className={styles.folder_loading}>Загрузка...</div>
                ) : foldersQuery.isError ? (
                    <div className={styles.folder_error}>Ошибка</div>
                ) : (
                    getAllFolders().map(folder => (
                        <div 
                            key={folder.folder_id} 
                            className={`${styles.folder_item} ${activeFolder === folder.folder_id ? styles.folder_active : ''}`}
                            onClick={() => handleFolderClick(folder.folder_id)}
                        >
                            {renderIcon(folder)}
                            {folder.name && <div className={styles.folder_tooltip}>{folder.name}</div>}
                        </div>
                    ))
                )}
            </div>
            
            {/* Модальное окно управления папками */}
            <FolderManagement 
                isOpen={isFolderManagementOpen} 
                onClose={closeFolderManagement} 
            />
        </>
    );
};