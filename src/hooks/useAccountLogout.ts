import { router } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';

export function useAccountLogout() {
  const { logout } = useAuth();

  return useCallback(async () => {
    await logout();
    router.replace('/auth/login');
  }, [logout]);
}
