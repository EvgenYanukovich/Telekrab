import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    console.log('ProtectedRoute: isAuthenticated =', isAuthenticated, 'user =', user);

    useEffect(() => {
        // Отладочное сообщение при изменении состояния аутентификации
        console.log('ProtectedRoute useEffect: isAuthenticated =', isAuthenticated, 'user =', user);
    }, [isAuthenticated, user]);

    if (!isAuthenticated) {
        console.log('ProtectedRoute: Перенаправление на /login, т.к. пользователь не аутентифицирован');
        return <Navigate to="/login" replace />;
    }

    console.log('ProtectedRoute: Рендеринг защищенного компонента');
    return <>{children}</>;
};
