import { Linking } from 'react-native';

import { PRIVACY_POLICY_URL } from '@/constants/links';
import type { useToast } from '@/context/ToastContext';

export function openPrivacyPolicy(showToast: ReturnType<typeof useToast>['showToast']) {
  if (!PRIVACY_POLICY_URL) {
    showToast('Privacy policy URL is not configured yet.', 'error');
    return;
  }
  void Linking.openURL(PRIVACY_POLICY_URL);
}
