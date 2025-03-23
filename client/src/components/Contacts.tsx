import React, { useState, useEffect } from 'react';
import styles from '../styles/Contacts.module.css';
import UserProfile from './UserProfile';

interface Contact {
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
}

interface ContactsProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Contacts: React.FC<ContactsProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Contact[]>([]);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Данные для тестирования
    const [contacts, setContacts] = useState<Contact[]>([
        { 
            id: 1, 
            name: 'Иван Иванов', 
            username: 'ivanov', 
            isAdded: true,
            avatar: undefined,
            phone: '+375 29 123 4567',
            bio: 'Разработчик ПО',
            status: 'Занят',
            registrationDate: '01 янв 2023',
            isOnline: true
        },
        { 
            id: 2, 
            name: 'Петр Петров', 
            username: 'petrov', 
            isAdded: true,
            avatar: undefined,
            phone: '+375 29 765 4321',
            bio: 'Дизайнер интерфейсов',
            registrationDate: '15 фев 2023',
            isOnline: false
        },
    ]);

    const [recommendedContacts, setRecommendedContacts] = useState<Contact[]>([
        { 
            id: 3, 
            name: 'Алексей Сидоров', 
            username: 'sidorov', 
            isAdded: false,
            avatar: undefined,
            phone: '+375 29 555 5555',
            bio: '',
            registrationDate: '10 мар 2023',
            isOnline: false
        },
        { 
            id: 4, 
            name: 'Ольга Смирнова', 
            username: 'smirnova', 
            isAdded: false,
            avatar: undefined,
            phone: '+375 29 444 4444',
            bio: 'Люблю путешествовать',
            registrationDate: '05 апр 2023',
            isOnline: true
        },
        { 
            id: 5, 
            name: 'Дмитрий Козлов', 
            username: 'kozlov', 
            isAdded: false,
            avatar: undefined,
            phone: '+375 29 333 3333',
            bio: 'Программист',
            registrationDate: '20 май 2023',
            isOnline: false
        },
    ]);

    // Обработчик поиска
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }

        // Сначала ищем в текущих контактах
        const contactResults = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            contact.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Затем ищем глобально (имитация API запроса)
        const globalResults = recommendedContacts.filter(contact => 
            !contact.isAdded && (
                contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                contact.username.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        // Объединяем результаты (в будущем здесь будет API запрос)
        setSearchResults([...contactResults, ...globalResults]);
    }, [searchQuery, contacts, recommendedContacts]);

    // Добавление контакта
    const handleAddContact = (contactId: number) => {
        // Добавляем из рекомендованных
        setRecommendedContacts(prev => prev.map(contact => 
            contact.id === contactId ? { ...contact, isAdded: true } : contact
        ));

        // Находим контакт в рекомендованных
        const contactToAdd = recommendedContacts.find(c => c.id === contactId);
        if (contactToAdd && !contactToAdd.isAdded) {
            setContacts(prev => [...prev, { ...contactToAdd, isAdded: true }]);
        }
    };

    // Удаление контакта
    const handleRemoveContact = (contactId: number) => {
        // Удаляем из списка контактов
        setContacts(prev => prev.filter(contact => contact.id !== contactId));
        
        // Обновляем статус в рекомендованных
        setRecommendedContacts(prev => prev.map(contact => 
            contact.id === contactId ? { ...contact, isAdded: false } : contact
        ));
    };

    // Обработчик для просмотра профиля
    const handleViewProfile = (contact: Contact) => {
        setSelectedContact(contact);
        setIsProfileOpen(true);
    };

    // Закрытие профиля
    const handleCloseProfile = () => {
        setIsProfileOpen(false);
        setSelectedContact(null);
    };

    // Если модальное окно закрыто, не рендерим его
    if (!isOpen) return null;

    return (
        <div className={styles.modal_overlay} onClick={onClose}>
            <div className={styles.modal_container} onClick={e => e.stopPropagation()}>
                <div className={styles.modal_header}>
                    <button className={styles.close_button} onClick={onClose}>←</button>
                    <h2 className={styles.modal_title}>Контакты</h2>
                </div>
                
                <div className={styles.modal_content}>
                    <div className={styles.search_container}>
                        <input 
                            type="text" 
                            placeholder="Поиск" 
                            className={styles.search_input}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Результаты поиска */}
                    {searchQuery.trim() !== '' && (
                        <>
                            {/* Результаты из ваших контактов */}
                            {searchResults.filter(contact => contact.isAdded).length > 0 && (
                                <>
                                    <div className={styles.section_header}>Ваши контакты</div>
                                    <ul className={styles.contact_list}>
                                        {searchResults.filter(contact => contact.isAdded).map(contact => (
                                            <li key={contact.id} className={styles.contact_item} onClick={() => handleViewProfile(contact)}>
                                                <div className={styles.contact_avatar}>
                                                    {contact.avatar ? (
                                                        <img src={contact.avatar} alt={contact.name} />
                                                    ) : (
                                                        contact.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className={styles.contact_info}>
                                                    <div className={styles.contact_name}>{contact.name}</div>
                                                    <div className={styles.contact_username}>@{contact.username}</div>
                                                </div>
                                                <button 
                                                    className={`${styles.action_button} ${styles.action_button_remove}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveContact(contact.id)
                                                    }}
                                                >
                                                    Удалить
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* Глобальный поиск */}
                            {searchResults.filter(contact => !contact.isAdded).length > 0 && (
                                <>
                                    <div className={styles.section_header}>Глобальный поиск</div>
                                    <ul className={styles.contact_list}>
                                        {searchResults.filter(contact => !contact.isAdded).map(contact => (
                                            <li key={contact.id} className={styles.contact_item} onClick={() => handleViewProfile(contact)}>
                                                <div className={styles.contact_avatar}>
                                                    {contact.avatar ? (
                                                        <img src={contact.avatar} alt={contact.name} />
                                                    ) : (
                                                        contact.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className={styles.contact_info}>
                                                    <div className={styles.contact_name}>{contact.name}</div>
                                                    <div className={styles.contact_username}>@{contact.username}</div>
                                                </div>
                                                <button 
                                                    className={styles.action_button}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddContact(contact.id);
                                                    }}
                                                >
                                                    Добавить
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* Пустой результат поиска */}
                            {searchResults.length === 0 && (
                                <div className={styles.empty_state}>
                                    <div className={styles.empty_state_icon}>🔍</div>
                                    <div className={styles.empty_state_title}>Ничего не найдено</div>
                                    <div className={styles.empty_state_text}>
                                        По запросу "{searchQuery}" ничего не найдено. Попробуйте изменить запрос.
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Основное содержимое (не при поиске) */}
                    {searchQuery.trim() === '' && (
                        <>
                            {/* Ваши контакты */}
                            {contacts.length > 0 && (
                                <>
                                    <div className={styles.section_header}>Ваши контакты</div>
                                    <ul className={styles.contact_list}>
                                        {contacts.map(contact => (
                                            <li key={contact.id} className={styles.contact_item} onClick={() => handleViewProfile(contact)}>
                                                <div className={styles.contact_avatar}>
                                                    {contact.avatar ? (
                                                        <img src={contact.avatar} alt={contact.name} />
                                                    ) : (
                                                        contact.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className={styles.contact_info}>
                                                    <div className={styles.contact_name}>{contact.name}</div>
                                                    <div className={styles.contact_username}>@{contact.username}</div>
                                                </div>
                                                <button 
                                                    className={`${styles.action_button} ${styles.action_button_remove}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveContact(contact.id)
                                                    }}
                                                >
                                                    Удалить
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            {/* Рекомендуемые контакты */}
                            <div className={styles.section_header}>
                                {contacts.length === 0 ? 'Рекомендуем' : 'Возможно, вы знаете'}
                            </div>
                            <ul className={styles.contact_list}>
                                {recommendedContacts.filter(contact => !contact.isAdded).map(contact => (
                                    <li key={contact.id} className={styles.contact_item} onClick={() => handleViewProfile(contact)}>
                                        <div className={styles.contact_avatar}>
                                            {contact.avatar ? (
                                                <img src={contact.avatar} alt={contact.name} />
                                            ) : (
                                                contact.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className={styles.contact_info}>
                                            <div className={styles.contact_name}>{contact.name}</div>
                                            <div className={styles.contact_username}>@{contact.username}</div>
                                        </div>
                                        <button 
                                            className={styles.action_button}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddContact(contact.id);
                                            }}
                                        >
                                            Добавить
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            {/* Если нет рекомендуемых контактов */}
                            {recommendedContacts.filter(contact => !contact.isAdded).length === 0 && (
                                <div className={styles.empty_state}>
                                    <div className={styles.empty_state_icon}>👋</div>
                                    <div className={styles.empty_state_title}>Нет рекомендаций</div>
                                    <div className={styles.empty_state_text}>
                                        На данный момент у нас нет рекомендаций для вас. Попробуйте воспользоваться поиском.
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {isProfileOpen && selectedContact && (
                    <UserProfile 
                        contact={selectedContact} 
                        onClose={handleCloseProfile} 
                    />
                )}
            </div>
        </div>
    );
};