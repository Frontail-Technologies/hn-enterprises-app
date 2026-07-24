import { useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

type MeterReadingInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  digits?: number;
  leadingZeroCount?: number;
};

export function MeterReadingInput({ value, onChangeText, digits = 8, leadingZeroCount = 4 }: MeterReadingInputProps) {
  const characters = useMemo(() => {
    const padded = value.padEnd(digits, ' ').slice(0, digits).split('');
    return padded.map((character, index) => (character === ' ' && index < leadingZeroCount ? '0' : character));
  }, [digits, leadingZeroCount, value]);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (index: number, nextValue: string) => {
    const clean = nextValue.replace(/\D/g, '').slice(-1);
    const next = characters.map((character) => (character === ' ' ? '' : character));
    next[index] = clean;
    onChangeText(next.join('').slice(0, digits));

    if (clean && index < digits - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {characters.map((character, index) => (
        <MeterDigitInput
          key={`meter-digit-${index}`}
          character={character}
          onChangeText={(nextValue) => handleChange(index, nextValue)}
          inputRef={(node) => {
            inputRefs.current[index] = node;
          }}
        />
      ))}
    </View>
  );
}

function MeterDigitInput({
  character,
  onChangeText,
  inputRef,
}: {
  character: string;
  onChangeText: (value: string) => void;
  inputRef: (node: TextInput | null) => void;
}) {
  const { colors } = useTheme();
  const { ref, onFocus } = useScrollIntoViewOnFocus();

  return (
    <TextInput
      ref={(node) => {
        ref.current = node;
        inputRef(node);
      }}
      onFocus={onFocus}
      value={character === ' ' ? '' : character}
      onChangeText={onChangeText}
      keyboardType="number-pad"
      maxLength={1}
      selectTextOnFocus
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
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    height: 42,
    padding: 0,
    borderWidth: 1,
    borderRadius: radius.sm,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...typography.bodyMedium,
  },
});
