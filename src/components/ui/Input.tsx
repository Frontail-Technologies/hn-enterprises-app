import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

type InputProps = TextInputProps & {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  error?: string;
};

export function Input({
  label,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  onFocus,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const { ref, onFocus: scrollOnFocus } = useScrollIntoViewOnFocus();

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.red : colors.border,
          },
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.text }, leftIcon ? styles.inputWithLeftIcon : null, style]}
          placeholderTextColor={colors.muted}
          onFocus={(event) => {
            scrollOnFocus();
            onFocus?.(event);
          }}
          {...rest}
        />
        {rightIcon ? (
          <Pressable style={styles.iconRight} onPress={onRightIconPress}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  inputRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    ...typography.body,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.md,
  },
  iconLeft: {
    paddingLeft: spacing.lg,
    width: 42,
  },
  iconRight: {
    paddingRight: spacing.lg,
  },
  errorText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
});
