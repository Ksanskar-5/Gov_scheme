/**
 * Authentication Context
 * Provides auth state and functions throughout the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, AuthUser, LoginResponse } from '@/lib/api';
import type { UserProfile } from '@/lib/api';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: AuthUser | null;
    profileId: string | null;
    profile: UserProfile | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profileId, setProfileId] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Check for existing token on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const result = await getCurrentUser();
                    if (result.success && result.data) {
                        setUser(result.data.user);
                        setProfileId(result.data.profileId);
                        setProfile(result.data.profile);
                    } else {
                        // Invalid token, clear it
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user');
                    }
                } catch (error) {
                    console.error('Auth init error:', error);
                    localStorage.removeItem('auth_token');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const result = await apiLogin(email, password);
            if (result.success && result.data) {
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                if (result.data.profileId) {
                    localStorage.setItem('userId', result.data.profileId);
                }

                setUser(result.data.user);
                setProfileId(result.data.profileId);
                setProfile(result.data.profile);

                return { success: true };
            }
            return { success: false, error: result.error || 'Login failed' };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const register = async (email: string, password: string) => {
        try {
            const result = await apiRegister(email, password);
            if (result.success && result.data) {
                localStorage.setItem('auth_token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));

                setUser(result.data.user);

                return { success: true };
            }
            return { success: false, error: result.error || 'Registration failed' };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('userProfile');
        setUser(null);
        setProfileId(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const result = await getCurrentUser();
                if (result.success && result.data) {
                    setProfile(result.data.profile);
                    setProfileId(result.data.profileId);
                }
            } catch (error) {
                console.error('Refresh profile error:', error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn: !!user,
            isLoading,
            user,
            profileId,
            profile,
            login,
            register,
            logout,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
