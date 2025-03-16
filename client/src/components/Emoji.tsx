import styles from '../styles/Emoji.module.css';

interface EmojiProps {
    onEmojiSelect?: (emoji: string) => void;
}

export const Emoji: React.FC<EmojiProps> = ({ onEmojiSelect }) => {
    // Хардкодный набор эмодзи для демонстрации
    const frequentEmojis = ['😊', '👍', '❤️', '🔥', '😂', '🎉', '👏', '🙏'];
    
    const emojiCategories = [
        { name: 'Смайлики', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛'] },
        { name: 'Жесты', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤏', '✍️'] },
        { name: 'Сердца', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'] }
    ];

    const handleEmojiClick = (emoji: string) => {
        if (onEmojiSelect) {
            onEmojiSelect(emoji);
        }
    };

    return (
        <div className={styles.emoji_panel}>
            <div className={styles.emoji_section}>
                <h4 className={styles.emoji_category_title}>Часто используемые</h4>
                <div className={styles.emoji_grid}>
                    {frequentEmojis.map((emoji, index) => (
                        <button
                            key={`frequent-${index}`}
                            className={styles.emoji_button}
                            onClick={() => handleEmojiClick(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {emojiCategories.map((category, catIndex) => (
                <div key={`category-${catIndex}`} className={styles.emoji_section}>
                    <h4 className={styles.emoji_category_title}>{category.name}</h4>
                    <div className={styles.emoji_grid}>
                        {category.emojis.map((emoji, emojiIndex) => (
                            <button
                                key={`emoji-${catIndex}-${emojiIndex}`}
                                className={styles.emoji_button}
                                onClick={() => handleEmojiClick(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};