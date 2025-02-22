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

export interface AuthResponse {
    token: string;
    user: {
        id: number;
        nickname: string;
        bio?: string;
        avatarPath?: string;
        isPrivate: boolean;
        lastSeen: string;
        isOnline: boolean;
    };
}
