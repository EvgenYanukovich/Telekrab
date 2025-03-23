import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { updateUserProfile } from '../api/users';
import { useToast } from './ToastNotification';
import styles from '../styles/ProfileEditForm.module.css';
import { DatePicker } from './DatePicker';

// Типы данных для формы редактирования профиля
interface ProfileFormData {
  nickname: string;
  bio: string;
  birth_date: string;
  password?: string;
  confirmPassword?: string;
  avatar?: FileList;
}

interface ProfileEditFormProps {
  userData: any;
  onCancel: () => void;
  onSuccess: (updatedData: any) => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ 
  userData, 
  onCancel, 
  onSuccess 
}) => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<ProfileFormData>({
    defaultValues: {
      nickname: userData?.nickname || '',
      bio: userData?.bio || '',
      birth_date: userData?.birth_date || '',
      password: '',
      confirmPassword: '',
      avatar: undefined
    }
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(userData?.avatar_url ? `https://api.telekrab.org/${userData.avatar_url}` : null);
  const { showToast } = useToast();
  const birthDateValue = watch('birth_date');

  // Наблюдаем за изменениями поля аватара
  const avatarField = watch('avatar');
  
  // Обновляем превью при выборе нового файла
  useEffect(() => {
    if (avatarField && avatarField.length > 0) {
      const file = avatarField[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [avatarField]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Проверка совпадения паролей
      if (data.password && data.password !== data.confirmPassword) {
        showToast('error', 'Пароли не совпадают', 'Ошибка');
        return;
      }
      
      // Формируем данные для отправки
      const formData = new FormData();
      formData.append('nickname', data.nickname);
      formData.append('bio', data.bio || '');
      formData.append('birth_date', data.birth_date || '');
      
      if (data.password) {
        formData.append('password', data.password);
      }
      
      if (data.avatar && data.avatar.length > 0) {
        formData.append('avatar', data.avatar[0]);
      }
      
      // Отправляем запрос на обновление профиля
      const response = await updateUserProfile(formData);
      
      // Проверяем, есть ли в ответе ошибка
      if (response && !response.error) {
        showToast('success', 'Профиль успешно обновлен', 'Успех');
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        showToast('error', response.error || 'Ошибка при обновлении профиля', 'Ошибка');
      }
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      showToast('error', 'Произошла ошибка при обработке запроса', 'Ошибка');
    }
  };

  return (
    <div className={styles.profile_edit_form}>
      <h2 className={styles.form_title}>Редактирование профиля</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Блок аватара */}
        <div className={styles.avatar_section}>
          <div className={styles.avatar_preview}>
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Аватар" 
                className={styles.avatar_image} 
              />
            ) : (
              <div className={styles.avatar_placeholder}>
                {userData?.nickname?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          <div className={styles.avatar_upload}>
            <label className={styles.upload_button}>
              Выбрать аватар
              <input 
                type="file" 
                accept="image/*"
                className={styles.file_input}
                {...register('avatar')}
              />
            </label>
          </div>
        </div>
        
        {/* Поля формы */}
        <div className={styles.form_group}>
          <label htmlFor="nickname">Никнейм*</label>
          <input
            id="nickname"
            type="text"
            className={styles.form_input}
            {...register('nickname', { 
              required: 'Никнейм обязателен', 
              minLength: { value: 3, message: 'Минимальная длина - 3 символа' } 
            })}
          />
          {errors.nickname && (
            <span className={styles.error_message}>{errors.nickname.message}</span>
          )}
        </div>
        
        <div className={styles.form_group}>
          <label htmlFor="bio">О себе</label>
          <textarea
            id="bio"
            className={styles.form_textarea}
            {...register('bio')}
          />
        </div>
        
        <div className={styles.form_group}>
          <label htmlFor="birth_date">Дата рождения</label>
          <DatePicker
            value={birthDateValue}
            onChange={(date) => setValue('birth_date', date, { shouldValidate: true })}
            placeholder="Выберите дату рождения"
            error={!!errors.birth_date}
            onBlur={() => {}}
          />
          {errors.birth_date && (
            <span className={styles.error_message}>{errors.birth_date.message}</span>
          )}
        </div>
        
        <div className={styles.form_group}>
          <label htmlFor="password">Новый пароль</label>
          <input
            id="password"
            type="password"
            className={styles.form_input}
            placeholder="Оставьте пустым, чтобы не менять"
            {...register('password', { 
              minLength: { value: 6, message: 'Минимальная длина - 6 символов' } 
            })}
          />
          {errors.password && (
            <span className={styles.error_message}>{errors.password.message}</span>
          )}
        </div>
        
        <div className={styles.form_group}>
          <label htmlFor="confirmPassword">Подтверждение пароля</label>
          <input
            id="confirmPassword"
            type="password"
            className={styles.form_input}
            {...register('confirmPassword')}
          />
          {watch('password') !== watch('confirmPassword') && watch('confirmPassword') ? (
            <span className={styles.error_message}>Пароли не совпадают</span>
          ) : null}
        </div>
        
        {/* Кнопки действий */}
        <div className={styles.form_actions}>
          <button 
            type="button" 
            className={styles.cancel_button}
            onClick={onCancel}
            disabled={isSubmitting}
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

export default ProfileEditForm;
