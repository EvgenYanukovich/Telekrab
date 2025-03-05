import styles from '../styles/home.module.css';

export const Chat: React.FC = () => {
    return (
        <>
            <div className={styles.section_header}>
                <h2>Чат</h2>
            </div>
            <div className={styles.section_content}>
                {/* Сообщения чата будут здесь */}
            </div>
        </>
    );
};