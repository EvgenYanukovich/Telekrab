import { useState, useEffect } from 'react';
import { getUserProfile } from '../api/users';
import { useAuth } from '../hooks/useAuth';
import { Contacts } from './Contacts';
import UserProfile from './UserProfile';
import styles from '../styles/SideMenu.module.css';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
    const { user, logout, setUser } = useAuth();
    const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isProfileEditMode, setIsProfileEditMode] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Вызов API для получения данных профиля
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;
            
            setIsLoading(true);
            try {
                const data = await getUserProfile();
                console.log('Данные профиля получены:', data);
                setProfileData(data);
            } catch (error) {
                console.error('Ошибка при получении профиля:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchUserProfile();
    }, [user]); // Вызываем только при изменении пользователя
    
    // Создаем объект контакта на основе данных пользователя
    const currentUser = profileData || user ? {
        id: profileData?.id || user?.id || 1,
        name: profileData?.nickname || user?.nickname || 'Пользователь',
        username: profileData?.nickname || user?.nickname || 'user',
        isAdded: true,
        avatar: profileData?.avatar_url ? `https://api.telekrab.org/${profileData.avatar_url}` : 
               user?.avatar_url ? `https://api.telekrab.org/${user.avatar_url}` : undefined,
        bio: profileData?.bio || user?.bio || '',
        status: (profileData?.is_online || user?.isOnline) ? 'online' : 'offline',
        registrationDate: profileData?.created_at || profileData?.birth_date || user?.birth_date || 'Нет данных',
        isOnline: profileData?.is_online || user?.isOnline || false,
        last_seen: profileData?.last_seen || user?.lastSeen || null
    } : null;
    
    // Функция для открытия профиля
    const handleOpenProfile = (editMode: boolean = false) => {
        setIsProfileOpen(true);
        setIsProfileEditMode(editMode);
    };
    
    // Функция для закрытия профиля
    const handleCloseProfile = () => {
        setIsProfileOpen(false);
        setIsProfileEditMode(false);
    };
    
    // Функция для обработки успешного обновления профиля
    const handleProfileUpdateSuccess = (updatedData: any) => {
        console.log('Профиль успешно обновлен:', updatedData);
        setProfileData(updatedData);
        
        // Обновляем данные пользователя в контексте авторизации
        if (user) {
            const updatedUser = {
                ...user,
                nickname: updatedData.nickname,
                bio: updatedData.bio || '',
                avatar_url: updatedData.avatar_path || user.avatar_url,
                birth_date: updatedData.birth_date || user.birth_date,
            };
            
            // Обновляем в контексте и localStorage
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Закрываем режим редактирования
        setIsProfileEditMode(false);
    };
    
    const menuItems = [
        { id: 1, name: 'Контакты', icon: '👥' },
        { id: 2, name: 'Настройки', icon: '⚙️' },
        { id: 3, name: 'Каналы', icon: '📢' },
        { id: 4, name: 'Группы', icon: '👪' },
        { id: 5, name: 'Помощь', icon: '❓' }
    ];
    
    const handleLogout = () => {
        logout();
        onClose();
        // Также закрываем профиль, если он открыт
        setIsProfileOpen(false);
    };
    
    const handleMenuItemClick = (itemId: number) => {
        // Обработка клика на элемент меню
        if (itemId === 1) { // Контакты
            setIsContactsModalOpen(true);
        }
        // Дополнительные обработчики для других пунктов меню можно добавить здесь
    };
    
    return (
        <div className={`${styles.side_menu} ${isOpen ? styles.side_menu_open : ''}`}>
            <div className={styles.side_menu_header}>
                <button 
                    className={styles.close_button}
                    onClick={onClose}
                >
                    ✖
                </button>
            </div>
            
            <div className={styles.user_profile} onClick={() => handleOpenProfile(false)}>
                <div className={styles.profile_avatar}>
                    {isLoading ? (
                        <div className={styles.avatar_loading}>⌛</div>
                    ) : currentUser?.avatar ? (
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className={styles.avatar_image}
                        />
                    ) : (
                        <div className={styles.avatar_placeholder_large}>
                            {currentUser?.name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                
                <div className={styles.profile_info}>
                    <h3 className={styles.profile_name}>{currentUser?.name || 'Пользователь'}</h3>
                    <p className={styles.profile_bio}>{currentUser?.bio || 'Информация о себе не указана'}</p>
                </div>
                
                <button 
                    className={styles.edit_profile_button}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile(true);
                    }}
                >
                    Редактировать
                </button>
            </div>
            
            <div className={styles.menu_items}>
                {menuItems.map(item => (
                    <div 
                        key={item.id} 
                        className={styles.menu_item}
                        onClick={() => handleMenuItemClick(item.id)}
                    >
                        <span className={styles.menu_item_icon}>{item.icon}</span>
                        <span className={styles.menu_item_name}>{item.name}</span>
                    </div>
                ))}
            </div>

            {/* Модальное окно контактов */}
            <Contacts isOpen={isContactsModalOpen} onClose={() => setIsContactsModalOpen(false)} />
            
            {/* Модальное окно профиля */}
            {isProfileOpen && currentUser && (
                <UserProfile 
                    contact={currentUser}
                    onClose={handleCloseProfile}
                    onLogout={handleLogout}
                    isEditMode={isProfileEditMode}
                    onUpdateSuccess={handleProfileUpdateSuccess}
                />
            )}
        </div>
    );
};
