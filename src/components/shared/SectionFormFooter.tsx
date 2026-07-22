import { Upload } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

import { StickyFooter } from '@/components/shared/StickyFooter';
import { Button } from '@/components/ui/Button';
import { spacing } from '@/constants/spacing';

type SectionFormFooterProps = {
  onSaveDraft: () => void;
  onSubmit: () => void;
  submitLabel?: string;
};

export function SectionFormFooter({ onSaveDraft, onSubmit, submitLabel = 'Submit' }: SectionFormFooterProps) {
  return (
    <StickyFooter>
      <View style={styles.row}>
        <View style={styles.secondary}>
          <Button label="Save Draft" variant="outline" onPress={onSaveDraft} />
        </View>
        <View style={styles.primary}>
          <Button label={submitLabel} icon={<Upload size={18} color="#FFFFFF" />} onPress={onSubmit} />
        </View>
      </View>
    </StickyFooter>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondary: {
    flex: 0.9,
  },
  primary: {
    flex: 1.1,
  },
});
