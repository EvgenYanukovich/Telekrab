import React from 'react';
import { useForm } from 'react-hook-form';
import styles from '../styles/ContactEditForm.module.css';
import { useToast } from './ToastNotification';
import { updateContactNickname } from '../api/contacts';

interface ContactEditFormProps {
    contactId: number;
    currentNickname: string;
    onCancel: () => void;
    onSuccess: (updatedData: any) => void;
}

interface ContactFormData {
    nickname: string;
}

export const ContactEditForm: React.FC<ContactEditFormProps> = ({
    contactId,
    currentNickname,
    onCancel,
    onSuccess
}) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormData>({
        defaultValues: {
            nickname: currentNickname
        }
    });

    const { showToast } = useToast();

    const onSubmit = async (data: ContactFormData) => {
        try {
            // Отправляем запрос на обновление никнейма контакта
            const response = await updateContactNickname(contactId, data.nickname);
            
            if (response && response.success) {
                showToast('success', 'Имя контакта обновлено', 'Успех');
                if (onSuccess) {
                    onSuccess({
                        id: contactId,
                        nickname: data.nickname
                    });
                }
            } else {
                showToast('error', response?.error || 'Ошибка при обновлении контакта', 'Ошибка');
            }
        } catch (error) {
            console.error('Ошибка при обновлении контакта:', error);
            showToast('error', 'Произошла ошибка при обработке запроса', 'Ошибка');
        }
    };

    return (
        <div className={styles.contact_edit_form}>
            <h2 className={styles.form_title}>Редактирование контакта</h2>
            
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.form_group}>
                    <label htmlFor="nickname">Отображаемое имя</label>
                    <input
                        id="nickname"
                        type="text"
                        className={styles.form_input}
                        {...register('nickname', { 
                            required: 'Имя обязательно', 
                            minLength: { value: 2, message: 'Минимальная длина - 2 символа' } 
                        })}
                    />
                    {errors.nickname && (
                        <span className={styles.error_message}>{errors.nickname.message}</span>
                    )}
                </div>
                
                <div className={styles.form_actions}>
                    <button 
                        type="button" 
                        className={styles.cancel_button}
                        onClick={onCancel}
                    >
                        Отмена
                    </button>
                    <button 
                        type="submit" 
                        className={styles.submit_button}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </form>
        </div>
    );
};
