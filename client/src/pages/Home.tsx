import React, { useState } from 'react';
import styles from '../styles/home.module.css';
import { useAuth } from '../hooks/useAuth';
import { API_URL } from '../config';

export const Home: React.FC = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<'messages' | 'contacts'>('messages');

    return (
        <div className={styles.container}>
            {/* Боковая панель */}
            <aside className={styles.sidebar}>
                <div className={styles.user_profile}>
                    <div className={styles.avatar_container}>
                        {user?.avatar_path ? (
                            <img 
                                src={`${API_URL}${user.avatar_path}`}
                                alt="Profile" 
                                className={styles.avatar}
                            />
                        ) : (
                            <div className={styles.avatar_placeholder}>
                                {user?.nickname?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className={styles.online_status}></div>
                    </div>
                    <div className={styles.user_info}>
                        <h3 className={styles.username}>{user?.nickname}</h3>
                        <span className={styles.status}>Online</span>
                    </div>
                </div>

                <nav className={styles.nav_tabs}>
                    <button 
                        className={`${styles.tab} ${activeSection === 'messages' ? styles.active : ''}`}
                        onClick={() => setActiveSection('messages')}
                    >
                        Сообщения
                    </button>
                    <button 
                        className={`${styles.tab} ${activeSection === 'contacts' ? styles.active : ''}`}
                        onClick={() => setActiveSection('contacts')}
                    >
                        Контакты
                    </button>
                </nav>

                <div className={styles.search_container}>
                    <input 
                        type="text" 
                        placeholder={activeSection === 'messages' ? "Поиск в сообщениях..." : "Поиск контактов..."}
                        className={styles.search_input}
                    />
                </div>

                <div className={styles.list_container}>
                    {activeSection === 'messages' ? (
                        <div className={styles.messages_list}>
                            {/* Здесь будет список чатов */}
                            <div className={styles.empty_state}>
                                У вас пока нет сообщений
                            </div>
                        </div>
                    ) : (
                        <div className={styles.contacts_list}>
                            {/* Здесь будет список контактов */}
                            <div className={styles.empty_state}>
                                У вас пока нет контактов
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Основная область */}
            <main className={styles.main_content}>
                <div className={styles.welcome_screen}>
                    <h1>Добро пожаловать в Telekrab</h1>
                    <p>Выберите чат или начните новую беседу</p>
                </div>
            </main>
        </div>
    );
};
