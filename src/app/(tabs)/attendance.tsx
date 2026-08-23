import { router } from 'expo-router';
import { CalendarDays, CheckCircle2, MapPin, Navigation } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { LocationMapView } from '@/components/shared/LocationMapView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import type { CapturedLocation } from '@/hooks/useCurrentLocation';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { guardNavigation } from '@/lib/navigation';
import { formatDate, formatTime } from '@/utils/format';
import { normalizeError } from '@/utils/normalizeError';

const SHORT_SHIFT_WARNING_MINUTES = 5;

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { loading: captureLoading, captureLocation, openLocationSettings, getLastLocationError } = useCurrentLocation();
  const [remarks, setRemarks] = useState('');
  const [shortShiftConfirm, setShortShiftConfirm] = useState<{
    captured: CapturedLocation;
    minutes: number;
  } | null>(null);
  const {
    loading,
    isCheckedInToday,
    isCheckedOutToday,
    checkInAt,
    checkOutAt,
    checkInLocation,
    checkOutLocation,
    checkingIn,
    checkingOut,
    checkIn,
    checkOut,
    refetch,
  } = useAttendanceStatus();

  // Distinguishes why location capture failed instead of one generic
  // message: a permanently-denied permission needs Settings, not a retry.
  // Reads the ref-backed getter (not hook state) so the reason is current
  // as of this exact call, not whatever the last render happened to see.
  const reportLocationFailure = () => {
    const last = getLastLocationError();
    showToast(last?.message ?? 'Location is required to continue', 'error');
    if (last?.kind === 'permission_denied_permanently' || last?.kind === 'services_disabled') {
      openLocationSettings();
    }
  };

  const handleCheckIn = async () => {
    const captured = await captureLocation();
    if (!captured) {
      reportLocationFailure();
      return;
    }

    try {
      await checkIn(captured);
      showToast('Checked in successfully', 'success');
    } catch (error) {
      console.error('[AttendanceScreen] check-in failed', { error });
      showToast(normalizeError(error, 'Unable to check in - try again'), 'error');
    }
  };

  const submitCheckOut = async (captured: CapturedLocation) => {
    try {
      await checkOut(captured, remarks.trim() || undefined);
      setRemarks('');
      showToast('Checked out successfully', 'success');
    } catch (error) {
      console.error('[AttendanceScreen] check-out failed', { error });
      showToast(normalizeError(error, 'Unable to check out - try again'), 'error');
    }
  };

  const handleCheckOut = async () => {
    const captured = await captureLocation();
    if (!captured) {
      reportLocationFailure();
      return;
    }

    const minutesSinceCheckIn = checkInAt
      ? (new Date(captured.capturedAt).getTime() - new Date(checkInAt).getTime()) / 60000
      : null;

    if (minutesSinceCheckIn != null && minutesSinceCheckIn < SHORT_SHIFT_WARNING_MINUTES) {
      setShortShiftConfirm({ captured, minutes: Math.max(0, Math.round(minutesSinceCheckIn)) });
      return;
    }

    await submitCheckOut(captured);
  };

  const confirmShortShiftCheckOut = () => {
    const pending = shortShiftConfirm;
    setShortShiftConfirm(null);
    if (pending) void submitCheckOut(pending.captured);
  };

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen} onRefresh={refetch}>
      <AppHeader
        title="Attendance"
        right={
          <Pressable onPress={() => guardNavigation(() => router.push('/attendance/history'))} style={styles.headerAction}>
            <CalendarDays size={21} color="#FFFFFF" />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[typography.label, { color: colors.muted }]}>Checking attendance...</Text>
        </View>
      ) : isCheckedInToday && checkInLocation ? (
        <View style={styles.content}>
          <Card style={styles.markedCard}>
            <View style={[styles.successIcon, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={24} color={colors.green} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.text }]}>
                {isCheckedOutToday ? 'Attendance Completed' : 'Checked In'}
              </Text>
              <Text style={[typography.label, { color: colors.muted }]}>
                In: {formatTime(checkInAt)} : {formatDate(checkInAt)}
              </Text>
              {isCheckedOutToday ? (
                <Text style={[typography.label, { color: colors.muted }]}>
                  Out: {formatTime(checkOutAt)} : {formatDate(checkOutAt)}
                </Text>
              ) : null}
              <View style={styles.locationLine}>
                <MapPin size={14} color={colors.primary} />
                <Text style={[typography.label, { color: colors.text }]} numberOfLines={2}>
                  {checkInLocation.address ?? `${checkInLocation.latitude.toFixed(5)}, ${checkInLocation.longitude.toFixed(5)}`}
                </Text>
              </View>
            </View>
          </Card>

          <LocationMapView
            latitude={(checkOutLocation ?? checkInLocation).latitude}
            longitude={(checkOutLocation ?? checkInLocation).longitude}
            label={(checkOutLocation ?? checkInLocation).address ?? 'Attendance captured here'}
          />

          {!isCheckedOutToday ? (
            <>
              <TextInput
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Add a remark for check-out (optional)"
                placeholderTextColor={colors.muted}
                multiline
                style={[
                  styles.remarksInput,
                  { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
              />
              <Button
                label="Check Out"
                loading={captureLoading || checkingOut}
                onPress={handleCheckOut}
                icon={<Navigation size={18} color="#FFFFFF" />}
              />
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.markCard}>
            <View style={[styles.pendingIcon, { backgroundColor: colors.softOrange }]}>
              <Navigation size={24} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Check In</Text>
            <Text style={[styles.description, { color: colors.muted }]}>
              Your current location will be captured with the check-in record.
            </Text>
            <Text style={[typography.label, { color: colors.text }]}>
              {formatDate(new Date())}
            </Text>
          </Card>

          <Button
            label="Check In"
            loading={captureLoading || checkingIn}
            onPress={handleCheckIn}
            icon={<Navigation size={18} color="#FFFFFF" />}
          />
        </View>
      )}

      <ConfirmSheet
        visible={Boolean(shortShiftConfirm)}
        title="Check out already?"
        message={`You checked in only ${shortShiftConfirm?.minutes ?? 0} minute(s) ago. Are you sure you want to check out now?`}
        confirmLabel="Check Out Anyway"
        cancelLabel="Cancel"
        onConfirm={confirmShortShiftCheckOut}
        onCancel={() => setShortShiftConfirm(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.lg,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  content: {
    gap: spacing.md,
  },
  remarksInput: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  markCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
  },
  markedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
  },
  pendingIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  successIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginTop: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.h2,
    fontSize: 16,
    lineHeight: 21,
  },
  description: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
