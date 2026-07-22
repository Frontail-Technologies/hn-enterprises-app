import { Camera, CheckCircle2, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useImagePicker } from '@/hooks/useImagePicker';

export type PhotoRequirement = {
  id: string;
  label: string;
  required?: boolean;
};

type PhotoRequirementGridProps = {
  title?: string;
  requirements: PhotoRequirement[];
};

export function PhotoRequirementGrid({ title = 'Evidence Photos', requirements }: PhotoRequirementGridProps) {
  const { colors } = useTheme();
  const { images, pickImages, removeImage } = useImagePicker();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.grid}>
        {requirements.map((requirement, index) => {
          const image = images[index];

          return (
            <Pressable
              key={requirement.id}
              onPress={pickImages}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.card,
                  borderColor: image ? colors.green : colors.border,
                },
              ]}
            >
              <View style={styles.labelRow}>
                {requirement.required ? <Text style={[styles.required, { color: colors.red }]}>*</Text> : null}
                <Text style={[styles.tileLabel, { color: colors.text }]} numberOfLines={2}>
                  {requirement.label}
                </Text>
              </View>
              <View style={[styles.photoBox, { backgroundColor: colors.background }]}>
                {image ? <CheckCircle2 size={25} color={colors.green} /> : <Camera size={25} color={colors.primary} />}
                <Text style={[styles.photoText, { color: image ? colors.green : colors.primary }]}>
                  {image ? 'Added' : 'Photo'}
                </Text>
              </View>
              {image ? (
                <Pressable onPress={() => removeImage(image.id)} style={styles.removeButton}>
                  <X size={14} color={colors.red} />
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    position: 'relative',
    width: '48.4%',
    minHeight: 150,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  labelRow: {
    minHeight: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  required: {
    ...typography.label,
    fontSize: 14,
  },
  tileLabel: {
    ...typography.label,
    flex: 1,
    textAlign: 'center',
  },
  photoBox: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
  },
  photoText: {
    ...typography.bodyMedium,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
