import React, { useState, useEffect } from 'react';
import styles from '../styles/Contacts.module.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContacts, addContact, removeContact, searchUsers } from '../api/contacts';
import { debounce } from 'lodash';
import UserProfile from './UserProfile';

// Функции форматирования даты
const formatDateToRussian = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    return date.toLocaleDateString('ru-RU', options);
};

interface ContactFromApi {
    id: number;
    nickname: string;
    original_nickname: string;
    bio: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
    created_at: string;
}

interface RecommendedUserFromApi {
    id: number;
    nickname: string;
    bio: string | null;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string;
}

// Внутренний интерфейс для отображения
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
    last_seen?: string;
    original_nickname?: string;
}

interface ContactsProps {
    isOpen: boolean;
    onClose: () => void;
}

// Преобразование данных API в формат компонента
const mapApiContactToUiContact = (apiContact: ContactFromApi, isAdded: boolean = true): Contact => {
    return {
        id: apiContact.id,
        name: apiContact.nickname,
        username: apiContact.original_nickname || `id${apiContact.id}`,
        isAdded,
        avatar: apiContact.avatar_url ? `https://api.telekrab.org/${apiContact.avatar_url}` : undefined,
        bio: apiContact.bio || '',
        status: apiContact.is_online ? 'online' : 'offline',
        registrationDate: apiContact.created_at ? formatDateToRussian(new Date(apiContact.created_at)) : undefined,
        isOnline: apiContact.is_online,
        last_seen: apiContact.last_seen,
        original_nickname: apiContact.original_nickname
    };
};

// Глобальный поиск
const mapApiRecommendedToUiContact = (apiUser: RecommendedUserFromApi): Contact => {
    return {
        id: apiUser.id,
        name: apiUser.nickname,
        username: `id${apiUser.id}`,
        isAdded: false,
        avatar: apiUser.avatar_url ? `https://api.telekrab.org/${apiUser.avatar_url}` : undefined,
        bio: apiUser.bio || '',
        status: apiUser.is_online ? 'online' : 'offline',
        registrationDate: undefined,
        isOnline: apiUser.is_online,
        last_seen: apiUser.last_seen,
        original_nickname: apiUser.nickname
    };
};

export const Contacts: React.FC<ContactsProps> = ({ isOpen, onClose }) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const queryClient = useQueryClient();
    
    // Эффект для обработки запроса с дебаунсом
    useEffect(() => {
        const handler = debounce(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);

        handler();
        return () => {
            handler.cancel();
        };
    }, [searchQuery]);

    // Запрос контактов
    const contactsQuery = useQuery({
        queryKey: ['contacts'],
        queryFn: getContacts,
        refetchOnWindowFocus: false,
        refetchOnMount: 'always', // Обновлять при каждом монтировании компонента
        staleTime: 0 // Считать данные устаревшими сразу
    });

    // Эффект для принудительного обновления контактов при открытии
    useEffect(() => {
        // Обновляем список контактов при открытии модального окна
        contactsQuery.refetch();
    }, [isOpen]);

    // Запрос для поиска
    const searchQueryResult = useQuery({
        queryKey: ['search', debouncedSearchQuery],
        queryFn: () => debouncedSearchQuery ? searchUsers(debouncedSearchQuery) : null,
        enabled: debouncedSearchQuery.length > 0,
        refetchOnWindowFocus: false
    });

    // Преобразование контактов из API в формат для UI
    const contacts: Contact[] = contactsQuery.data?.contacts?.map((contact: ContactFromApi) => mapApiContactToUiContact(contact)) || [];
    
    // Преобразование рекомендуемых пользователей из API в формат для UI
    const recommendedUsers: Contact[] = contactsQuery.data?.recommended?.map((user: RecommendedUserFromApi) => mapApiRecommendedToUiContact(user)) || [];

    // Получаем результаты поиска
    const searchResults = searchQueryResult.data;
    const searchedContacts: Contact[] = searchResults?.contacts?.map((contact: ContactFromApi) => mapApiContactToUiContact(contact)) || [];
    const searchedRecommended: Contact[] = searchResults?.recommended?.map((user: RecommendedUserFromApi) => mapApiRecommendedToUiContact(user)) || [];

    // Определение отображаемых контактов и рекомендаций в зависимости от режима поиска
    const displayedContacts = debouncedSearchQuery ? searchedContacts : contacts;
    const displayedRecommended = debouncedSearchQuery ? searchedRecommended : recommendedUsers;

    // Проверка загрузки данных
    const isLoading = contactsQuery.isLoading || (debouncedSearchQuery && searchQueryResult.isLoading);
    const isError = contactsQuery.isError || (debouncedSearchQuery && searchQueryResult.isError);

    // Мутация для добавления контакта
    const addContactMutation = useMutation({
        mutationFn: (contactId: number) => addContact(contactId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    // Мутация для удаления контакта
    const removeContactMutation = useMutation({
        mutationFn: (contactId: number) => removeContact(contactId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        },
    });

    // Обработчик запроса поиска
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Добавление контакта
    const handleAddContact = (contactId: number) => {
        addContactMutation.mutate(contactId);
    };

    // Удаление контакта
    const handleRemoveContact = (contactId: number) => {
        removeContactMutation.mutate(contactId);
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
                    {/* Поиск */}
                    <div className={styles.search_container}>
                        <div className={`${styles.search_box} ${isSearchFocused ? styles.search_focused : ''}`}>
                            <input
                                type="text"
                                placeholder="Поиск по ID или имени..."
                                className={styles.search_input}
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                            {searchQuery && searchQueryResult.isPending && (
                                <div className={styles.search_loading}>⋯</div>
                            )}
                            {searchQuery && !searchQueryResult.isPending && (
                                <button 
                                    className={styles.search_clear}
                                    onClick={() => setSearchQuery('')}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Индикатор загрузки */}
                    {isLoading && (
                        <div className={styles.loading_state}>
                            <div className={styles.loading_spinner}></div>
                            <div>Загрузка контактов...</div>
                        </div>
                    )}

                    {/* Ошибка */}
                    {isError && (
                        <div className={styles.error_state}>
                            <div>Ошибка при загрузке контактов</div>
                            <button 
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['contacts'] })}
                                className={styles.retry_button}
                            >
                                Повторить
                            </button>
                        </div>
                    )}

                    {/* Основное содержимое */}
                    {!isLoading && !isError && (
                        <>
                            {/* Ваши контакты */}
                            {displayedContacts.length > 0 && (
                                <>
                                    <div className={styles.section_header}>Ваши контакты</div>
                                    <ul className={styles.contact_list}>
                                        {displayedContacts.map(contact => (
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
                                                    <div className={styles.contact_username}>
                                                        ID: {contact.id}
                                                    </div>
                                                    
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
                            {displayedRecommended.length > 0 && (
                                <>
                                    <div className={styles.section_header}>
                                        {displayedContacts.length === 0 ? 'Рекомендуем' : 'Возможно, вы знаете'}
                                    </div>
                                    <ul className={styles.contact_list}>
                                        {displayedRecommended.map(contact => (
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
                                                    <div className={styles.contact_username}>
                                                        ID: {contact.id}
                                                    </div>
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

                            {/* Если нет контактов и рекомендаций */}
                            {displayedContacts.length === 0 && displayedRecommended.length === 0 && (
                                <div className={styles.empty_state}>
                                    <div className={styles.empty_state_icon}>👋</div>
                                    <div className={styles.empty_state_title}>Нет контактов</div>
                                    <div className={styles.empty_state_text}>
                                        У вас пока нет контактов и мы не можем предложить рекомендации. Воспользуйтесь поиском, чтобы найти пользователей.
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