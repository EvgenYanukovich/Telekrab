import { useState, useCallback } from 'react';
import styles from '../styles/home.module.css';
import folderStyles from '../styles/Folder.module.css';
import chatListStyles from '../styles/ChatList.module.css';
import chatStyles from '../styles/Chat.module.css';
import emojiStyles from '../styles/Emoji.module.css';
import { Folder } from '../components/Folder';
import { ChatList } from '../components/ChatList';
import { Chat } from '../components/Chat';
import { Emoji } from '../components/Emoji';
import { SideMenu } from '../components/SideMenu';

export const Home: React.FC = () => {
    const [showEmoji, setShowEmoji] = useState(false);
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [insertEmojiFunction, setInsertEmojiFunction] = useState<((emoji: string) => void) | null>(null);
    
    // Получаем функцию вставки эмодзи из компонента Chat
    const getInsertEmojiFunction = useCallback((insertFn: (emoji: string) => void) => {
        setInsertEmojiFunction(() => insertFn);
    }, []);
    
    const handleEmojiSelect = (emoji: string) => {
        if (insertEmojiFunction) {
            insertEmojiFunction(emoji);
        }
    };

    // Обработчики для кнопок
    const handleToggleEmoji = () => {
        setShowEmoji(!showEmoji);
    };

    const handleToggleSideMenu = () => {
        setSideMenuOpen(!sideMenuOpen);
    };

    return (
        <div className={styles.container}>
            <div className={styles.components_container}>
                <div className={`${styles.folder_container} ${folderStyles.folder_container}`}>
                    <Folder onMenuClick={handleToggleSideMenu} />
                </div>
                <div className={`${styles.contacts_container} ${chatListStyles.contacts_container}`}>
                    <ChatList />
                </div>
                <div className={`${styles.chat_container} ${chatStyles.chat_container}`}>
                    <Chat 
                        onEmojiClick={handleToggleEmoji} 
                        onMenuClick={handleToggleSideMenu}
                        insertEmojiToInput={getInsertEmojiFunction}
                    />
                </div>
                {showEmoji && (
                    <div className={`${styles.emoji_container} ${emojiStyles.emoji_container}`}>
                        <Emoji onEmojiSelect={handleEmojiSelect} />
                    </div>
                )}
            </div>

            {sideMenuOpen && (
                <SideMenu 
                    isOpen={sideMenuOpen} 
                    onClose={() => setSideMenuOpen(false)} 
                />
            )}
        </div>
    );
};
