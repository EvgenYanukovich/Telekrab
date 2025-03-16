export interface LoginCredentials {
    nickname: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterCredentials {
    nickname: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    bio?: string;
    avatar?: File | FileList;
}

export interface User {
    id: number;
    nickname: string;
    avatar_url?: string | null;
    birth_date?: string;
    bio?: string;
    isOnline?: boolean;
    lastSeen?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
