import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const MAX_LONG_EDGE = 2048;
const JPEG_QUALITY = 0.82;

export type ProcessedImage = {
  uri: string;
  mimeType: string;
  size?: number;
};

export async function processEvidenceImage(
  uri: string,
  dimensions?: { width?: number | null; height?: number | null },
): Promise<ProcessedImage> {
  const actions: ImageManipulator.Action[] = [];
  const width = dimensions?.width ?? undefined;
  const height = dimensions?.height ?? undefined;

  if (width && height) {
    const longEdge = Math.max(width, height);
    if (longEdge > MAX_LONG_EDGE) {
      const scale = MAX_LONG_EDGE / longEdge;
      actions.push({ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } });
    }
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  let size: number | undefined;
  try {
    const info = new File(result.uri);
    size = typeof info.size === 'number' ? info.size : undefined;
  } catch {
    size = undefined;
  }

  return { uri: result.uri, mimeType: 'image/jpeg', size };
}
