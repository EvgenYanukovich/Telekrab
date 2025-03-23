/**
 * Форматирует дату в русский формат
 * @param date Дата для форматирования
 * @returns Отформатированная дата в формате "дд месяц гггг"
 */
export const formatDateToRussian = (date: Date): string => {
    // Массив месяцев на русском языке
    const months = [
        'янв', 'фев', 'мар', 'апр', 'май', 'июн', 
        'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    
    // Получаем компоненты даты
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    // Форматируем в виде "дд месяц гггг"
    return `${day} ${month} ${year}`;
};

/**
 * Форматирует дату последнего посещения в удобочитаемый формат
 * @param lastSeen Строка с датой последнего посещения
 * @returns Отформатированная строка о последнем посещении
 */
export const formatLastSeen = (lastSeen: string): string => {
    if (!lastSeen) return 'неизвестно когда';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    
    // Разница в миллисекундах
    const diffMs = now.getTime() - lastSeenDate.getTime();
    
    // Конвертируем в секунды, минуты, часы, дни
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 30) {
        // Если прошло больше месяца, показываем дату
        return `был(а) в сети ${formatDateToRussian(lastSeenDate)}`;
    } else if (diffDays > 0) {
        // Если прошло несколько дней
        return `был(а) в сети ${diffDays} ${getDayWord(diffDays)} назад`;
    } else if (diffHours > 0) {
        // Если прошло несколько часов
        return `был(а) в сети ${diffHours} ${getHourWord(diffHours)} назад`;
    } else if (diffMin > 0) {
        // Если прошло несколько минут
        return `был(а) в сети ${diffMin} ${getMinuteWord(diffMin)} назад`;
    } else {
        // Если меньше минуты
        return 'был(а) в сети только что';
    }
};

/**
 * Возвращает правильное склонение слова "день"
 */
function getDayWord(days: number): string {
    if (days >= 11 && days <= 19) return 'дней';
    const lastDigit = days % 10;
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
}

/**
 * Возвращает правильное склонение слова "час"
 */
function getHourWord(hours: number): string {
    if (hours >= 11 && hours <= 19) return 'часов';
    const lastDigit = hours % 10;
    if (lastDigit === 1) return 'час';
    if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
    return 'часов';
}

/**
 * Возвращает правильное склонение слова "минута"
 */
function getMinuteWord(minutes: number): string {
    if (minutes >= 11 && minutes <= 19) return 'минут';
    const lastDigit = minutes % 10;
    if (lastDigit === 1) return 'минуту';
    if (lastDigit >= 2 && lastDigit <= 4) return 'минуты';
    return 'минут';
}
