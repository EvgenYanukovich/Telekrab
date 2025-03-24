import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/FolderManagement.module.css';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Определяем интерфейс для папки
export interface Folder {
    folder_id: number;
    name: string;
    icon: string;
    color: string;
    position: number;
    isSystem?: boolean;
    created_at?: string;
    updated_at?: string;
}

// Создаем инстанс API с общими настройками
const api = axios.create({
    baseURL: 'https://api.telekrab.org',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Для передачи cookies
});

// Добавляем интерцептор для автоматического добавления токена авторизации
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// API функции для работы с папками
const getUserFolders = async (): Promise<Folder[]> => {
    try {
        const response = await api.get('/folder/all');
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении папок:', error);
        return [];
    }
};

const createFolder = async (name: string, color: string, icon: string = ''): Promise<Folder> => {
    const response = await api.post('/folder/create', { name, color, icon });
    return response.data;
};

const updateFolder = async (id: number, name: string, color: string, icon?: string): Promise<Folder> => {
    const data: Record<string, any> = { name, color };
    if (icon !== undefined) {
        data.icon = icon;
    }
    
    const response = await api.put(`/folder/update?id=${id}`, data);
    return response.data;
};

const deleteFolder = async (id: number): Promise<void> => {
    await api.delete(`/folder/delete?id=${id}`);
};

interface FolderManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

const FolderManagement: React.FC<FolderManagementProps> = ({ isOpen, onClose }) => {
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderColor, setFolderColor] = useState('#2196F3'); // Дефолтный синий цвет
    
    const queryClient = useQueryClient();
    
    // Запрос на получение папок
    const foldersQuery = useQuery<Folder[]>({
        queryKey: ['folders'],
        queryFn: getUserFolders,
        enabled: isOpen,
        refetchOnWindowFocus: false
    });
    
    // Мутация для создания папки
    const createFolderMutation = useMutation({
        mutationFn: (folderData: { name: string, color: string }) => 
            createFolder(folderData.name, folderData.color),
        onSuccess: () => {
            // Обновляем список папок при успешном создании
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setNewFolderName('');
            setFolderColor('#2196F3');
        }
    });
    
    // Мутация для обновления папки
    const updateFolderMutation = useMutation({
        mutationFn: (folderData: { id: number, name: string, color: string }) => 
            updateFolder(folderData.id, folderData.name, folderData.color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            setEditingFolder(null);
        }
    });
    
    // Мутация для удаления папки
    const deleteFolderMutation = useMutation({
        mutationFn: (folderId: number) => deleteFolder(folderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        }
    });
    
    // Обработчик создания новой папки
    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolderMutation.mutate({
                name: newFolderName.trim(), 
                color: folderColor
            });
        }
    };
    
    // Обработчик обновления папки
    const handleUpdateFolder = () => {
        if (editingFolder && editingFolder.name.trim()) {
            updateFolderMutation.mutate({
                id: editingFolder.folder_id,
                name: editingFolder.name,
                color: editingFolder.color
            });
        }
    };
    
    // Обработчик удаления папки
    const handleDeleteFolder = (folderId: number) => {
        if (window.confirm('Вы уверены, что хотите удалить эту папку?')) {
            deleteFolderMutation.mutate(folderId);
        }
    };
    
    // Обработчик изменения имени в режиме редактирования
    const handleEditNameChange = (name: string) => {
        if (editingFolder) {
            setEditingFolder({
                ...editingFolder,
                name
            });
        }
    };
    
    // Обработчик изменения цвета в режиме редактирования
    const handleEditColorChange = (color: string) => {
        if (editingFolder) {
            setEditingFolder({
                ...editingFolder,
                color
            });
        }
    };

    // Цвета для выбора
    const colorOptions: string[] = [
        '#2196F3', // Синий
        '#4CAF50', // Зеленый
        '#F44336', // Красный
        '#FF9800', // Оранжевый
        '#9C27B0', // Фиолетовый
        '#607D8B', // Серый
    ];

    // Добавляем системную папку "Все чаты", если её нет в списке
    const allFolders = () => {
        const folders: Folder[] = foldersQuery.data || [];
        const hasAllChatsFolder = folders.some((folder: Folder) => folder.folder_id === 0);
        
        if (!hasAllChatsFolder) {
            return [
                { 
                    folder_id: 0, 
                    name: 'Все чаты', 
                    icon: 'chat', 
                    color: '#2196F3', 
                    position: 0,
                    isSystem: true 
                } as Folder,
                ...folders
            ];
        }
        
        return folders;
    };

    // Если модальное окно закрыто, не рендерим содержимое
    if (!isOpen) return null;

    // Рендерим модальное окно через портал в конец body
    return createPortal(
        <div className={styles.modal_overlay} onClick={onClose}>
            <div className={styles.modal_container} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modal_header}>
                    <h2 className={styles.modal_title}>Управление папками</h2>
                    <button className={styles.close_button} onClick={onClose}>×</button>
                </div>
                
                <div className={styles.modal_content}>
                    {/* Список существующих папок */}
                    <div className={styles.folders_list}>
                        <h3>Ваши папки</h3>
                        
                        {foldersQuery.isLoading ? (
                            <div className={styles.loading}>Загрузка...</div>
                        ) : foldersQuery.isError ? (
                            <div className={styles.error}>Ошибка загрузки папок</div>
                        ) : (
                            <ul className={styles.folder_items}>
                                {allFolders().map((folder: Folder) => (
                                    <li key={folder.folder_id} className={styles.folder_item}>
                                        {editingFolder && editingFolder.folder_id === folder.folder_id ? (
                                            // Режим редактирования
                                            <div className={styles.edit_form}>
                                                <input
                                                    type="text"
                                                    value={editingFolder.name}
                                                    onChange={(e) => handleEditNameChange(e.target.value)}
                                                    className={styles.folder_input}
                                                />
                                                
                                                {/* Выбор цвета */}
                                                <div className={styles.color_picker}>
                                                    {colorOptions.map((color) => (
                                                        <div
                                                            key={color}
                                                            className={`${styles.color_option} ${editingFolder.color === color ? styles.color_selected : ''}`}
                                                            style={{ backgroundColor: color }}
                                                            onClick={() => handleEditColorChange(color)}
                                                        />
                                                    ))}
                                                </div>
                                                
                                                <div className={styles.edit_actions}>
                                                    <button 
                                                        onClick={handleUpdateFolder} 
                                                        className={styles.save_button}
                                                        disabled={!editingFolder.name.trim()}
                                                    >
                                                        Сохранить
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingFolder(null)} 
                                                        className={styles.cancel_button}
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // Режим просмотра
                                            <div className={styles.folder_display}>
                                                <div 
                                                    className={styles.folder_icon} 
                                                    style={{ backgroundColor: folder.color }}
                                                >
                                                    {folder.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className={styles.folder_name}>{folder.name}</span>
                                                
                                                {!folder.isSystem && (
                                                    <div className={styles.folder_actions}>
                                                        <button 
                                                            className={styles.edit_button} 
                                                            onClick={() => setEditingFolder(folder)}
                                                        >
                                                            ✎
                                                        </button>
                                                        <button 
                                                            className={styles.delete_button} 
                                                            onClick={() => handleDeleteFolder(folder.folder_id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {/* Форма для создания новой папки */}
                    <div className={styles.create_folder}>
                        <h3>Добавить папку</h3>
                        <div className={styles.create_form}>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Название папки"
                                className={styles.folder_input}
                            />
                            
                            {/* Выбор цвета */}
                            <div className={styles.color_picker}>
                                {colorOptions.map((color) => (
                                    <div
                                        key={color}
                                        className={`${styles.color_option} ${folderColor === color ? styles.color_selected : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFolderColor(color)}
                                    />
                                ))}
                            </div>
                            
                            <button 
                                onClick={handleCreateFolder} 
                                className={styles.create_button}
                                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                            >
                                {createFolderMutation.isPending ? 'Создание...' : 'Создать папку'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FolderManagement;
