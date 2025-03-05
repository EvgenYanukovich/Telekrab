import styles from '../styles/home.module.css';

export const Contacts: React.FC = () => {
    return (
        <>
            <div className={styles.section_header}>
                <h2>Контакты</h2>
            </div>
            <div className={styles.section_content}>
                {/* Список контактов будет здесь */}
            </div>
        </>
    );
};