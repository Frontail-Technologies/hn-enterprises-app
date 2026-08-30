import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { BottomSheetTextInput, useBottomSheetInternal } from '@gorhom/bottom-sheet';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { InlineFieldError } from './InlineFieldError';

type InputProps = TextInputProps & {
  label?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
  error?: string;
};

export function Input({
  label,
  required,
  leftIcon,
  rightIcon,
  onRightIconPress,
  error,
  style,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: InputProps) {
  const { colors } = useTheme();
  const { ref, onFocus: scrollOnFocus } = useScrollIntoViewOnFocus();
  const [isFocused, setIsFocused] = useState(false);
  const insideSheet = useBottomSheetInternal(true) !== null;

  const fieldProps = {
    multiline,
    textAlignVertical: multiline ? ('top' as const) : undefined,
    style: [
      styles.input,
      multiline && styles.inputMultiline,
      { color: colors.text },
      leftIcon ? styles.inputWithLeftIcon : null,
      style,
    ],
    placeholderTextColor: colors.muted,
    onFocus: (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      if (!insideSheet) scrollOnFocus();
      onFocus?.(event);
    },
    onBlur: (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(event);
    },
    ...rest,
  };

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required ? <Text style={{ color: colors.red }}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          multiline && styles.inputRowMultiline,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.red : isFocused ? colors.primary : colors.border,
            borderWidth: error || isFocused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        {insideSheet ? (
          <BottomSheetTextInput {...fieldProps} />
        ) : (
          <TextInput ref={ref} {...fieldProps} />
        )}
        {rightIcon ? (
          <Pressable style={styles.iconRight} onPress={onRightIconPress}>
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      <InlineFieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...typography.label,
    fontSize: 14,
    lineHeight: 18,
  },
  inputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.input,
  },
  inputRowMultiline: {
    minHeight: 92,
    alignItems: 'stretch',
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    ...typography.body,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  iconLeft: {
    paddingLeft: 14,
    width: 40,
  },
  iconRight: {
    paddingRight: 14,
  },
});
