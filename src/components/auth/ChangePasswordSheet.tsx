import { router } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Text } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { typography } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ChangePasswordErrors = Partial<
  Record<'currentPassword' | 'newPassword' | 'confirmPassword' | 'form', string>
>;

export function ChangePasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        currentPassword: fieldErrors.currentPassword?.[0],
        newPassword: fieldErrors.newPassword?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });
      reset();
      onClose();
      showToast('Password changed. Please sign in again.', 'success');
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Unable to change password',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Change Password"
      footer={<Button label="Change Password" onPress={handleSubmit} loading={isSubmitting} />}
    >
      <Input
        placeholder="Current password"
        value={currentPassword}
        onChangeText={(value) => {
          setCurrentPassword(value);
          setErrors({});
        }}
        secureTextEntry={!showCurrent}
        leftIcon={<Lock size={18} color={colors.muted} />}
        rightIcon={showCurrent ? <Eye size={17} color={colors.muted} /> : <EyeOff size={17} color={colors.muted} />}
        onRightIconPress={() => setShowCurrent((value) => !value)}
        error={errors.currentPassword}
      />
      <Input
        placeholder="New password"
        value={newPassword}
        onChangeText={(value) => {
          setNewPassword(value);
          setErrors({});
        }}
        secureTextEntry={!showNew}
        leftIcon={<Lock size={18} color={colors.muted} />}
        rightIcon={showNew ? <Eye size={17} color={colors.muted} /> : <EyeOff size={17} color={colors.muted} />}
        onRightIconPress={() => setShowNew((value) => !value)}
        error={errors.newPassword}
      />
      <Input
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          setErrors({});
        }}
        secureTextEntry={!showConfirm}
        leftIcon={<Lock size={18} color={colors.muted} />}
        rightIcon={showConfirm ? <Eye size={17} color={colors.muted} /> : <EyeOff size={17} color={colors.muted} />}
        onRightIconPress={() => setShowConfirm((value) => !value)}
        error={errors.confirmPassword}
      />
      {errors.form ? (
        <Text style={[typography.caption, { color: colors.red, textAlign: 'center' }]}>{errors.form}</Text>
      ) : null}
    </Sheet>
  );
}
