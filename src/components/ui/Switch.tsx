import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Switch({ value, onValueChange, disabled }: SwitchProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.track,
        { backgroundColor: value ? colors.primary : colors.border },
        disabled && styles.disabled,
      ]}
    >
      <View
        style={[
          styles.thumb,
          { backgroundColor: colors.surface, transform: [{ translateX: value ? 18 : 0 }] },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  disabled: {
    opacity: 0.5,
  },
});
