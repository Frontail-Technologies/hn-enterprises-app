import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

type MeterReadingInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  digits?: number;
};

export function MeterReadingInput({ value, onChangeText, digits = 8 }: MeterReadingInputProps) {
  const characters = useMemo(() => value.padEnd(digits, ' ').slice(0, digits).split(''), [digits, value]);

  const handleChange = (index: number, nextValue: string) => {
    const clean = nextValue.replace(/\D/g, '').slice(-1);
    const next = characters.map((character) => (character === ' ' ? '' : character));
    next[index] = clean;
    onChangeText(next.join('').slice(0, digits));
  };

  return (
    <View style={styles.row}>
      {characters.map((character, index) => (
        <MeterDigitInput
          key={`meter-digit-${index}`}
          character={character}
          onChangeText={(nextValue) => handleChange(index, nextValue)}
        />
      ))}
    </View>
  );
}

function MeterDigitInput({
  character,
  onChangeText,
}: {
  character: string;
  onChangeText: (value: string) => void;
}) {
  const { colors } = useTheme();
  const { ref, onFocus } = useScrollIntoViewOnFocus();

  return (
    <TextInput
      ref={ref}
      onFocus={onFocus}
      value={character === ' ' ? '' : character}
      onChangeText={onChangeText}
      keyboardType="number-pad"
      maxLength={1}
      style={[
        styles.input,
        {
          backgroundColor: colors.card,
          borderColor: character === ' ' ? colors.border : colors.primary,
          color: colors.text,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  input: {
    width: 36,
    height: 48,
    borderWidth: 1,
    borderRadius: radius.sm,
    textAlign: 'center',
    ...typography.bodyMedium,
  },
});
