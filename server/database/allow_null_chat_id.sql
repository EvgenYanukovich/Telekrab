-- Изменяем структуру таблицы, чтобы chat_id мог быть NULL
-- Сначала удаляем внешний ключ, который ограничивает NULL

-- Находим имя ограничения внешнего ключа
SET @fk_name := (
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_folders'
    AND COLUMN_NAME = 'chat_id'
    AND REFERENCED_TABLE_NAME = 'chats'
    LIMIT 1
);

-- Если ограничение найдено, удаляем его
SET @drop_fk_query = IF(@fk_name IS NOT NULL, 
    CONCAT('ALTER TABLE `user_folders` DROP FOREIGN KEY `', @fk_name, '`'),
    'SELECT "Внешний ключ не найден"');

PREPARE stmt FROM @drop_fk_query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Удаляем уникальный ключ
SET @exist_key := (SELECT COUNT(1) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'user_folders' 
                   AND index_name = 'unique_folder_chat');

SET @query = IF(@exist_key > 0, 
                'ALTER TABLE `user_folders` DROP INDEX `unique_folder_chat`', 
                'SELECT "Ключ не существует, пропускаем"');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Изменяем столбец chat_id, чтобы разрешить NULL значения
ALTER TABLE `user_folders` 
MODIFY COLUMN `chat_id` bigint NULL;

-- Создаем новый уникальный ключ
ALTER TABLE `user_folders` 
ADD UNIQUE KEY `unique_folder_user` (`user_id`, `folder_name`);
