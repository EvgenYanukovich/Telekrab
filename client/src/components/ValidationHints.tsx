import React from 'react';
import styles from '../styles/validation-hints.module.css';

interface ValidationRule {
    message: string;
    isValid: boolean;
}

interface ValidationHintsProps {
    rules: ValidationRule[];
    show: boolean;
}

export const ValidationHints: React.FC<ValidationHintsProps> = ({ rules, show }) => {
    if (!show) return null;

    return (
        <div className={styles.hints_container}>
            <div className={styles.hints_content}>
                <h4 className={styles.hints_title}>Требования:</h4>
                <ul className={styles.hints_list}>
                    {rules.map((rule, index) => (
                        <li 
                            key={index} 
                            className={`${styles.hint_item} ${rule.isValid ? styles.valid : styles.invalid}`}
                        >
                            <span className={styles.hint_icon}>
                                {rule.isValid ? '✓' : '✗'}
                            </span>
                            <span className={styles.hint_text}>{rule.message}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
