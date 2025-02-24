import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/datepicker.module.css';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    error?: boolean;
    onBlur?: () => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    value,
    onChange,
    placeholder = 'Выберите дату',
    error,
    onBlur
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
    const [month, setMonth] = useState(selectedDate?.getMonth() || new Date().getMonth());
    const [year, setYear] = useState(selectedDate?.getFullYear() || new Date().getFullYear());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                onBlur?.();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur]);

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    };

    const handleDateSelect = (day: number) => {
        const newDate = new Date(year, month, day);
        setSelectedDate(newDate);
        onChange(formatDate(newDate));
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        const days = [];
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                          'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

        // Заголовок календаря
        days.push(
            <div key="header" className={styles.calendar_header}>
                <button type="button" onClick={handlePrevMonth} className={styles.month_nav}>
                    ←
                </button>
                <div className={styles.month_year}>
                    {monthNames[month]} {year}
                </div>
                <button type="button" onClick={handleNextMonth} className={styles.month_nav}>
                    →
                </button>
            </div>
        );

        // Дни недели
        const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        days.push(
            <div key="weekdays" className={styles.weekdays}>
                {weekDays.map(day => (
                    <div key={day} className={styles.weekday}>{day}</div>
                ))}
            </div>
        );

        // Пустые ячейки в начале месяца
        const blanks = [];
        for (let i = 0; i < firstDay; i++) {
            blanks.push(<div key={`blank-${i}`} className={styles.day_blank}></div>);
        }

        // Дни месяца
        const monthDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const isSelected = selectedDate && 
                             selectedDate.getDate() === d && 
                             selectedDate.getMonth() === month && 
                             selectedDate.getFullYear() === year;

            monthDays.push(
                <div
                    key={d}
                    className={`${styles.day} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleDateSelect(d)}
                >
                    {d}
                </div>
            );
        }

        days.push(
            <div key="days" className={styles.days_grid}>
                {[...blanks, ...monthDays]}
            </div>
        );

        return days;
    };

    const formatDisplayDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    return (
        <div className={styles.datepicker_container} ref={containerRef}>
            <div
                className={`${styles.datepicker_input} ${error ? styles.error : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedDate ? (
                    <span className={styles.selected_date}>
                        {formatDisplayDate(selectedDate)}
                    </span>
                ) : (
                    <span className={styles.placeholder}>{placeholder}</span>
                )}
                
            </div>
            
            {isOpen && (
                <div className={styles.calendar_dropdown}>
                    {renderCalendar()}
                </div>
            )}
        </div>
    );
};
