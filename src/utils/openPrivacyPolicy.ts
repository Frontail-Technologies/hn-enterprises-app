import { Linking } from 'react-native';

import { PRIVACY_POLICY_URL } from '@/constants/links';
import type { useToast } from '@/context/ToastContext';

// Shared by the Profile and More screens' "Privacy Policy" row - PRIVACY_POLICY_URL is a
// deliberately unresolved config value until the real production URL is confirmed (see
// src/constants/links.ts), so this surfaces that clearly instead of opening a guessed domain.
export function openPrivacyPolicy(showToast: ReturnType<typeof useToast>['showToast']) {
  if (!PRIVACY_POLICY_URL) {
    showToast('Privacy policy URL is not configured yet.', 'error');
    return;
  }
  void Linking.openURL(PRIVACY_POLICY_URL);
}
