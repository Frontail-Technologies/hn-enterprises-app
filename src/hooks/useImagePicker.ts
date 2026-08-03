import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

export type PickedImage = {
  id: string;
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export function useImagePicker() {
  const [images, setImages] = useState<PickedImage[]>([]);

  const pickImages = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return [];

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled) return [];

    const nextImages = result.assets.map((asset) => ({
      id: asset.assetId ?? asset.uri,
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    }));

    setImages((current) => [...current, ...nextImages]);
    return nextImages;
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((current) => current.filter((image) => image.id !== id));
  }, []);

  return {
    images,
    setImages,
    pickImages,
    removeImage,
  };
}
