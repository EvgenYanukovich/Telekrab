-- Добавляем поле is_pinned в таблицу chat_members
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_pinned TINYINT(1) NOT NULL DEFAULT 0;

-- Добавляем поле folders для хранения JSON массива с ID папок
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS folders JSON NULL;

-- Обновляем существующие записи, добавляя папку "Все чаты" (ID: 0) по умолчанию
UPDATE chat_members SET folders = JSON_ARRAY("0") WHERE folders IS NULL;
