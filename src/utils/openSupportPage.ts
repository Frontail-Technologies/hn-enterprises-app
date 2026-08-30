import { Linking } from 'react-native';

import { SUPPORT_URL } from '@/constants/links';
import type { useToast } from '@/context/ToastContext';

export function openSupportPage(showToast: ReturnType<typeof useToast>['showToast']) {
  if (!SUPPORT_URL) {
    showToast('Support page URL is not configured yet.', 'error');
    return;
  }
  void Linking.openURL(SUPPORT_URL);
}
