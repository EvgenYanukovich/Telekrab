import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/validation-hints.module.css';

interface ValidationRule {
    message: string;
    isValid: boolean;
}

interface ValidationHintsProps {
    rules: ValidationRule[];
    show: boolean;
    parentRef?: React.RefObject<HTMLElement>;
}

export const ValidationHints: React.FC<ValidationHintsProps> = ({ rules, show, parentRef }) => {
    // Использование простого подхода с порталом
    const [hintsContainer] = useState(() => {
        const div = document.createElement('div');
        div.classList.add(styles.hints_portal);
        div.style.position = 'absolute';
        div.style.zIndex = '9999';
        div.style.pointerEvents = 'none';
        return div;
    });
    
    // Эффект для управления DOM-элементом портала
    useEffect(() => {
        document.body.appendChild(hintsContainer);
        
        return () => {
            document.body.removeChild(hintsContainer);
        };
    }, [hintsContainer]);
    
    // Эффект для показа/скрытия подсказок и обновления их позиции
    useEffect(() => {
        if (!show) {
            hintsContainer.style.display = 'none';
            return;
        }
        
        // Показываем контейнер
        hintsContainer.style.display = 'block';
        
        // Функция для обновления позиции
        const updatePosition = () => {
            // Находим активный элемент
            const input = parentRef?.current || document.activeElement as HTMLElement;
            if (!input) return;
            
            // Получаем расположение элемента
            const rect = input.getBoundingClientRect();
            
            // Для мобильных устройств - под полем ввода
            if (window.innerWidth < 768) {
                hintsContainer.style.top = `${window.scrollY + rect.bottom + 5}px`;
                hintsContainer.style.left = `${window.scrollX + rect.left}px`;
                hintsContainer.style.width = `${rect.width}px`;
            } 
            // Для десктопов - справа от поля
            else {
                hintsContainer.style.top = `${window.scrollY + rect.top}px`;
                hintsContainer.style.left = `${window.scrollX + rect.right + 10}px`;
                hintsContainer.style.width = '250px';
            }
            
            // Убеждаемся, что подсказки не выходят за пределы экрана
            const hintsRect = hintsContainer.getBoundingClientRect();
            
            // Если подсказки выходят за правый край экрана
            if (hintsRect.right > window.innerWidth) {
                // Показываем слева от поля
                hintsContainer.style.left = `${window.scrollX + rect.left - hintsRect.width - 10}px`;
            }
            
            // Если подсказки выходят за нижний край экрана
            if (hintsRect.bottom > window.innerHeight) {
                // Показываем над полем
                hintsContainer.style.top = `${window.scrollY + rect.top - hintsRect.height - 5}px`;
            }
        };
        
        // Обновляем позицию сразу и при изменении окна
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, [show, parentRef, hintsContainer]);
    
    // Если не нужно показывать подсказки, возвращаем null
    if (!show) return null;
    
    // Рендерим через портал
    return createPortal(
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
        </div>,
        hintsContainer
    );
};
