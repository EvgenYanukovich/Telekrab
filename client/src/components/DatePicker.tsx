import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
    const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        calendarRef.current = document.createElement('div');
        calendarRef.current.style.position = 'absolute';
        calendarRef.current.style.zIndex = '9999';
        
        return () => {
            if (calendarRef.current && document.body.contains(calendarRef.current)) {
                document.body.removeChild(calendarRef.current);
            }
        };
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isClickInsideContainer = containerRef.current && containerRef.current.contains(event.target as Node);
            const isClickInsideCalendar = calendarRef.current && calendarRef.current.contains(event.target as Node);
            
            if (!isClickInsideContainer && !isClickInsideCalendar) {
                setIsOpen(false);
                onBlur?.();
            }
        };
        
        const handleCalendarClick = (e: Event) => {
            e.stopPropagation();
        };
        
        if (isOpen && calendarRef.current) {
            document.addEventListener('mousedown', handleClickOutside);
            calendarRef.current.addEventListener('click', handleCalendarClick);
            
            if (!document.body.contains(calendarRef.current)) {
                document.body.appendChild(calendarRef.current);
            }
            
            updateCalendarPosition();
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (calendarRef.current) {
                calendarRef.current.removeEventListener('click', handleCalendarClick);
            }
        };
    }, [isOpen, onBlur]);
    
    useEffect(() => {
        const handleResize = () => {
            if (isOpen) {
                updateCalendarPosition();
            }
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize);
        };
    }, [isOpen]);
    
    const updateCalendarPosition = () => {
        if (!calendarRef.current || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        calendarRef.current.style.top = `${window.scrollY + rect.bottom + 8}px`;
        calendarRef.current.style.left = `${window.scrollX + rect.left}px`;
        calendarRef.current.style.width = `${rect.width}px`;
    };

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

    const handleDateSelect = (day: number) => {
        const newDate = new Date(year, month, day);
        setSelectedDate(newDate);
        onChange(formatDate(newDate));
        setIsOpen(false);
    };
    
    const handleClearDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDate(null);
        onChange(''); 
    };

    const months = [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];

    const handleSelectMonth = (monthIndex: number) => {
        setMonth(monthIndex);
        setIsMonthSelectOpen(false);
    };

    const handleSelectYear = (selectedYear: number) => {
        setYear(selectedYear);
        setIsYearSelectOpen(false);
    };

    const renderYearSelect = () => {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 100; i <= currentYear; i++) {
            years.push(
                <div
                    key={i}
                    className={`${styles.year_option} ${i === year ? styles.selected : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelectYear(i);
                    }}
                >
                    {i}
                </div>
            );
        }
        return (
            <div className={styles.select_dropdown}>
                <div className={styles.dropdown_content}>
                    {years}
                </div>
            </div>
        );
    };

    const renderMonthSelect = () => {
        return (
            <div className={styles.select_dropdown}>
                <div className={styles.dropdown_content}>
                    {months.map((monthName, index) => (
                        <div
                            key={index}
                            className={`${styles.month_option} ${index === month ? styles.selected : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMonth(index);
                            }}
                        >
                            {monthName}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCalendar = () => {
        const days = [];
        const daysInMonth = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        
        days.push(
            <div key="header" className={styles.calendar_header}>
                <button 
                    className={styles.prev_month} 
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrevMonth();
                    }}
                >
                    &lt;
                </button>
                <div className={styles.month_year}>
                    <div 
                        className={styles.month_selector} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMonthSelectOpen(!isMonthSelectOpen);
                            setIsYearSelectOpen(false);
                        }}
                    >
                        {months[month]}
                        {isMonthSelectOpen && renderMonthSelect()}
                    </div>
                    <div 
                        className={styles.year_selector} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsYearSelectOpen(!isYearSelectOpen);
                            setIsMonthSelectOpen(false);
                        }}
                    >
                        {year}
                        {isYearSelectOpen && renderYearSelect()}
                    </div>
                </div>
                <button 
                    className={styles.next_month} 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNextMonth();
                    }}
                >
                    &gt;
                </button>
            </div>
        );
        
        days.push(
            <div key="weekdays" className={styles.weekdays}>
                <div>Пн</div>
                <div>Вт</div>
                <div>Ср</div>
                <div>Чт</div>
                <div>Пт</div>
                <div>Сб</div>
                <div>Вс</div>
            </div>
        );
        
        const adjustedFirstDay = firstDay === 0 ? 7 : firstDay;
        
        const blanks = [];
        for (let i = 1; i < adjustedFirstDay; i++) {
            blanks.push(
                <div key={`blank-${i}`} className={styles.day_blank}></div>
            );
        }
        
        const monthDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            // const date = new Date(year, month, d);
            const isSelected = selectedDate && 
                              selectedDate.getDate() === d && 
                              selectedDate.getMonth() === month && 
                              selectedDate.getFullYear() === year;
            
            monthDays.push(
                <div 
                    key={`day-${d}`} 
                    className={`${styles.day} ${isSelected ? styles.selected : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDateSelect(d);
                    }}
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
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                {selectedDate ? (
                    <>
                        <span className={styles.selected_date}>
                            {formatDisplayDate(selectedDate)}
                        </span>
                        <button 
                            className={styles.clear_date_button}
                            onClick={handleClearDate}
                            aria-label="Очистить дату"
                        >
                            ✕
                        </button>
                    </>
                ) : (
                    <span className={styles.placeholder}>{placeholder}</span>
                )}
            </div>
            
            {isOpen && calendarRef.current && createPortal(
                <div className={styles.calendar_dropdown}>
                    {renderCalendar()}
                </div>,
                calendarRef.current
            )}
        </div>
    );
};
