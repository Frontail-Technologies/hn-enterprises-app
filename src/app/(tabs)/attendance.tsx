import { router } from 'expo-router';
import { CalendarDays, CheckCircle2, MapPin, Navigation } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { LocationMapView } from '@/components/shared/LocationMapView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { formatDate, formatTime } from '@/utils/format';

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { loading: captureLoading, captureLocation } = useCurrentLocation();
  const {
    loading,
    isCheckedInToday,
    isCheckedOutToday,
    checkInAt,
    checkOutAt,
    checkInLocation,
    checkOutLocation,
    checkIn,
    checkOut,
  } = useAttendanceStatus();

  const handleCheckIn = async () => {
    const captured = await captureLocation();
    if (!captured) {
      showToast('Location is required to check in', 'error');
      return;
    }

    await checkIn(captured);
    showToast('Checked in successfully', 'success');
  };

  const handleCheckOut = async () => {
    const captured = await captureLocation();
    if (!captured) {
      showToast('Location is required to check out', 'error');
      return;
    }

    await checkOut(captured);
    showToast('Checked out successfully', 'success');
  };

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader
        title="Attendance"
        right={
          <Pressable onPress={() => router.push('/attendance/history')} style={styles.headerAction}>
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
              <CheckCircle2 size={28} color={colors.green} />
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
            <Button
              label="Check Out"
              loading={captureLoading}
              onPress={handleCheckOut}
              icon={<Navigation size={18} color="#FFFFFF" />}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.content}>
          <Card style={styles.markCard}>
            <View style={[styles.pendingIcon, { backgroundColor: colors.softOrange }]}>
              <Navigation size={28} color={colors.primary} />
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
            loading={captureLoading}
            onPress={handleCheckIn}
            icon={<Navigation size={18} color="#FFFFFF" />}
          />
        </View>
      )}
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
    gap: spacing.lg,
  },
  markCard: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.sm,
  },
  markedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  pendingIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  successIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    marginTop: 2,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    lineHeight: 24,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  locationLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
