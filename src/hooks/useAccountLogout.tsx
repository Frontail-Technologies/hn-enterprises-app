import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useAuth } from '@/context/AuthContext';

export function useAccountLogout() {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const requestLogout = useCallback(() => setConfirmOpen(true), []);
  const cancelLogout = useCallback(() => setConfirmOpen(false), []);

  const confirmLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/auth/login');
    } finally {
      setLoggingOut(false);
      setConfirmOpen(false);
    }
  }, [logout]);

  const dialog = (
    <ConfirmationDialog
      visible={confirmOpen}
      title="Log out?"
      message="Are you sure you want to log out?"
      confirmLabel="Log out"
      cancelLabel="Cancel"
      destructive
      loading={loggingOut}
      onConfirm={confirmLogout}
      onCancel={cancelLogout}
      sentryName="logout"
    />
  );

  return { requestLogout, dialog };
}
