import { useState } from 'react';
import styles from '../styles/UserProfile.module.css';
import { ProfileEditForm } from './ProfileEditForm';

interface UserData {
    id: number;
    name: string;
    username: string;
    isAdded: boolean;
    avatar?: string;
    phone?: string;
    bio?: string;
    status?: string;
    registrationDate?: string;
    isOnline?: boolean;
    last_seen?: string;
}

interface UserProfileProps {
    contact: UserData;
    onClose: () => void;
    onLogout?: () => void; 
    isEditMode?: boolean; 
    onUpdateSuccess?: (updatedData: any) => void; 
}

const UserProfile: React.FC<UserProfileProps> = ({ 
    contact, 
    onClose, 
    onLogout,
    isEditMode: initialEditMode = false,
    onUpdateSuccess
}) => {
    const [isEditMode, setIsEditMode] = useState(initialEditMode);

    const getInitials = (name: string): string => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleEditToggle = () => {
        if (!isEditMode) {
            setIsEditMode(true);
        }
    };
    
    const handleCancelEdit = () => {
        setIsEditMode(false);
    };
    
    const handleUpdateSuccess = (updatedData: any) => {
        if (onUpdateSuccess) {
            onUpdateSuccess(updatedData);
        }
        setIsEditMode(false);
    };

    return (
        <div className={styles.modal_overlay} onClick={handleOverlayClick}>
            <div className={styles.modal_container} onClick={e => e.stopPropagation()}>
                <div className={styles.modal_header}>
                    <button className={styles.close_button} onClick={onClose}>←</button>
                    <h2 className={styles.modal_title}>
                        {isEditMode ? 'Редактирование' : 'Профиль'}
                    </h2>
                    {!isEditMode && (
                        <button 
                            className={styles.edit_button} 
                            onClick={handleEditToggle}
                        >
                            ✎
                        </button>
                    )}
                </div>
                
                <div className={styles.modal_content}>
                    {isEditMode ? (
                        // Форма редактирования профиля
                        <ProfileEditForm 
                            userData={{
                                id: contact.id,
                                nickname: contact.name,
                                bio: contact.bio || '',
                                birth_date: contact.registrationDate || '',
                                avatar_url: contact.avatar?.replace('https://api.telekrab.org/', '')
                            }}
                            onCancel={handleCancelEdit}
                            onSuccess={handleUpdateSuccess}
                        />
                    ) : (
                        // Просмотр профиля
                        <>
                            <div className={styles.profile_header}>
                                <div className={styles.avatar_container}>
                                    {contact.avatar ? (
                                        <img src={contact.avatar} alt={contact.name} className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatar_placeholder}>
                                            {getInitials(contact.name)}
                                        </div>
                                    )}
                                </div>
                                
                                <div className={styles.user_info_header}>
                                    <h3 className={styles.user_name}>{contact.name}</h3>
                                    <span className={styles.user_status}>
                                        {contact.isOnline ? 'в сети' : 'не в сети'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className={styles.profile_info}>
                                {contact.phone && (
                                    <div className={styles.info_item}>
                                        <div className={styles.info_icon}>📱</div>
                                        <div className={styles.info_content}>
                                            <div className={styles.info_value}>{contact.phone}</div>
                                            <div className={styles.info_label}>Телефон</div>
                                        </div>
                                    </div>
                                )}
                                
                                {contact.bio && (
                                    <div className={styles.info_item}>
                                        <div className={styles.info_icon}>ℹ️</div>
                                        <div className={styles.info_content}>
                                            <div className={styles.info_value}>{contact.bio}</div>
                                            <div className={styles.info_label}>О себе</div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className={styles.info_item}>
                                    <div className={styles.info_icon}>@</div>
                                    <div className={styles.info_content}>
                                        <div className={styles.info_value}>@{contact.username}</div>
                                        <div className={styles.info_label}>Имя пользователя</div>
                                    </div>
                                </div>
                                
                                {contact.registrationDate && (
                                    <div className={styles.info_item}>
                                        <div className={styles.info_icon}>📅</div>
                                        <div className={styles.info_content}>
                                            <div className={styles.info_value}>{contact.registrationDate}</div>
                                            <div className={styles.info_label}>Дата регистрации</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    
                    {/* Кнопка для выхода из аккаунта */}
                    <div className={styles.profile_footer}>
                        {onLogout && (
                            <button 
                                className={styles.logout_button}
                                onClick={onLogout}
                            >
                                Выйти из аккаунта
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
