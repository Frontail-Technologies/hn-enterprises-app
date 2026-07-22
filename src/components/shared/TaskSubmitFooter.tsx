import { Upload } from 'lucide-react-native';

import { StickyFooter } from '@/components/shared/StickyFooter';
import { Button } from '@/components/ui/Button';

type TaskSubmitFooterProps = {
  label: string;
  onPress: () => void;
};

export function TaskSubmitFooter({ label, onPress }: TaskSubmitFooterProps) {
  return (
    <StickyFooter>
      <Button label={label} icon={<Upload size={18} color="#FFFFFF" />} onPress={onPress} />
    </StickyFooter>
  );
}
