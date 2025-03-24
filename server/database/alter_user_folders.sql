-- Добавление полей для иконки, цвета и позиции в таблицу user_folders
-- Находим существующий индекс и удаляем его
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

-- Изменяем структуру таблицы
ALTER TABLE `user_folders` 
ADD COLUMN `icon` VARCHAR(50) DEFAULT '' AFTER `folder_name`,
ADD COLUMN `color` VARCHAR(20) DEFAULT '#2196F3' AFTER `icon`,
ADD COLUMN `position` INT DEFAULT 0 AFTER `color`,
ADD COLUMN `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Добавляем новый уникальный ключ
ALTER TABLE `user_folders` 
ADD UNIQUE KEY `unique_folder_name` (`user_id`, `folder_name`);
