import { useState } from 'react';
import styles from '../styles/home.module.css';
import { Folder } from '../components/Folder';
import { Contacts } from '../components/Contacts';
import { Chat } from '../components/Chat';
import { Emoji } from '../components/Emoji';

export const Home: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.folder_container}>
                <Folder/>
            </div>
            <div className={styles.contacts_container}>
                <Contacts/>
            </div>
            <div className={styles.chat_container}>
                <Chat/>
            </div>
            <div className={styles.emoji_container}>
                <Emoji/>
            </div>
        </div>
    );
};
