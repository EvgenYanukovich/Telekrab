import { useState } from 'react';
import styles from '../styles/SideMenu.module.css';
import { useAuth } from '../hooks/useAuth';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [editMode, setEditMode] = useState(false);
    
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
            
            <div className={styles.user_profile}>
                <div className={styles.profile_avatar}>
                    {user?.avatar_url ? (
                        <img 
                            src={`https://api.telekrab.org/${user.avatar_url}`} 
                            alt={user?.nickname} 
                            className={styles.avatar_image}
                        />
                    ) : (
                        <div className={styles.avatar_placeholder_large}>
                            {user?.nickname?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                
                <div className={styles.profile_info}>
                    <h3 className={styles.profile_name}>{user?.nickname || 'Пользователь'}</h3>
                    <p className={styles.profile_bio}>{user?.bio || 'Информация о себе не указана'}</p>
                </div>
                
                <button 
                    className={styles.edit_profile_button}
                    onClick={() => setEditMode(!editMode)}
                >
                    {editMode ? 'Отмена' : 'Редактировать'}
                </button>
                
                {editMode && (
                    <button 
                        className={styles.logout_button}
                        onClick={handleLogout}
                    >
                        Выйти
                    </button>
                )}
            </div>
            
            <div className={styles.menu_items}>
                {menuItems.map(item => (
                    <div key={item.id} className={styles.menu_item}>
                        <span className={styles.menu_item_icon}>{item.icon}</span>
                        <span className={styles.menu_item_name}>{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
