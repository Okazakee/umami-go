import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import WebView from 'react-native-webview';

export function OverviewMap({ height = 170 }: { height?: number }) {
  const theme = useTheme();

  // Leaflet via CDN for a lightweight, F-Droid-friendly preview.
  // This is UI-only for now; later we can inject markers/heat layers.
  const bg = theme.colors.surfaceVariant;
  const html = React.useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body { margin:0; padding:0; height:100%; width:100%; background:${bg}; }
      #map { height:100%; width:100%; }
      .leaflet-container { background:${bg}; }
      .leaflet-control-attribution { display:none; }
      .leaflet-control-zoom { display:none; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      (function () {
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
          worldCopyJump: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);
        map.setView([20, 0], 1.6);
      })();
    </script>
  </body>
</html>`,
    [bg]
  );

  return (
    <View style={[styles.wrap, { height, backgroundColor: theme.colors.surface }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
