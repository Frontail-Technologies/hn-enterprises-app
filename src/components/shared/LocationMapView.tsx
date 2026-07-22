import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type LocationMapViewProps = {
  latitude: number;
  longitude: number;
  label?: string;
};

export function LocationMapView({ latitude, longitude, label = 'Captured location' }: LocationMapViewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Captured Location</Text>
      <View style={styles.mapWrap}>
        <WebView
          key={`${latitude}-${longitude}`}
          originWhitelist={['*']}
          scrollEnabled={false}
          source={{ html: buildMapHtml(latitude, longitude, label) }}
          style={styles.map}
        />
      </View>
      <Text style={[typography.caption, { color: colors.muted }]}>
        Map tiles load from OpenStreetMap. Internet is required for the preview.
      </Text>
    </View>
  );
}

function buildMapHtml(latitude: number, longitude: number, label: string) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      .leaflet-control-attribution { font-size: 9px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const lat = ${latitude};
      const lng = ${longitude};
      const map = L.map('map', { zoomControl: false }).setView([lat, lng], 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'OpenStreetMap'
      }).addTo(map);
      L.marker([lat, lng]).addTo(map).bindPopup(${JSON.stringify(label)}).openPopup();
    </script>
  </body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  mapWrap: {
    height: 210,
    overflow: 'hidden',
    borderRadius: radius.sm,
  },
  map: {
    flex: 1,
  },
});
