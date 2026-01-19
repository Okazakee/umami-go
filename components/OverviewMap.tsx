import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import WebView from 'react-native-webview';

export type MapCountryValue = {
  // ISO 3166-1 numeric code as a string (matches world-atlas feature ids)
  ccn3: string;
  label: string;
  value: number;
};

export function OverviewMap({
  height = 170,
  countries = [],
}: {
  height?: number;
  countries?: MapCountryValue[];
}) {
  const theme = useTheme();
  const isDark = (theme as unknown as { dark?: boolean }).dark === true;

  // Leaflet via CDN for a lightweight, F-Droid-friendly preview.
  // This is UI-only; we render an Umami-like choropleth plus optional bubbles.
  const bg = theme.colors.surfaceVariant;
  const primary = theme.colors.primary;
  const outline = theme.colors.onSurfaceVariant;

  const countryData = React.useMemo(() => {
    const safe = Array.isArray(countries) ? countries : [];
    const filtered = safe
      .filter((c) => typeof c.ccn3 === 'string' && c.ccn3.trim().length > 0)
      .filter((c) => Number.isFinite(c.value))
      .filter((c) => typeof c.label === 'string' && c.label.trim().length > 0)
      .map((c) => ({
        ccn3: c.ccn3.trim(),
        label: c.label.trim(),
        value: Math.max(0, Number(c.value)),
      }))
      .slice(0, 60);

    const max = filtered.reduce((m, c) => Math.max(m, c.value), 0);
    const values: Record<string, number> = {};
    const labels: Record<string, string> = {};
    for (const c of filtered) {
      values[c.ccn3] = (values[c.ccn3] ?? 0) + c.value;
      labels[c.ccn3] = c.label;
    }
    return { items: filtered, max, values, labels };
  }, [countries]);

  const dataKey = React.useMemo(() => {
    // Force a reload if the data payload changes.
    // Keep it short to avoid huge keys.
    const a = countryData.items
      .slice(0, 12)
      .map((c) => `${c.ccn3}:${Math.round(c.value)}`)
      .join('|');
    return a;
  }, [countryData.items]);

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
    <script src="https://unpkg.com/topojson-client@3/dist/topojson-client.min.js"></script>
    <script>
      (function () {
        var VALUES = ${JSON.stringify(countryData.values)};
        var LABELS = ${JSON.stringify(countryData.labels)};
        var MAX_COUNTRY = ${JSON.stringify(countryData.max)};

        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          preferCanvas: true,
          worldCopyJump: true
        });

        map.setView([20, 0], 1.6);

        function alphaFor(value) {
          if (!MAX_COUNTRY || MAX_COUNTRY <= 0) return 0;
          var t = Math.sqrt(Math.max(0, value) / MAX_COUNTRY);
          return 0.05 + t * 0.55;
        }

        function outlineColor() {
          // Use a low-contrast outline that works on both themes.
          return '${outline}';
        }

        function countryStyle(feature) {
          var id = feature && feature.id != null ? String(feature.id) : '';
          var v = VALUES[id] || 0;
          var fillOpacity = v > 0 ? alphaFor(v) : 0;
          return {
            color: outlineColor(),
            weight: 0.6,
            opacity: ${isDark ? '0.35' : '0.22'},
            fillColor: '${primary}',
            fillOpacity: fillOpacity
          };
        }

        function onEachCountry(feature, layer) {
          var id = feature && feature.id != null ? String(feature.id) : '';
          var v = VALUES[id] || 0;
          if (v > 0) {
            var name = LABELS[id] || 'Country';
            layer.bindTooltip(name + ': ' + v, { direction: 'top', opacity: 0.9 });
          }
        }

        // Load a lightweight world countries topology (110m) and render a choropleth.
        // We use ISO numeric codes (ccn3) to match feature ids.
        fetch('https://unpkg.com/world-atlas@2/countries-110m.json')
          .then(function (r) { return r.json(); })
          .then(function (topo) {
            var geo = topojson.feature(topo, topo.objects.countries);
            var countriesLayer = L.geoJSON(geo, { style: countryStyle, onEachFeature: onEachCountry }).addTo(map);
            if (countriesLayer.getBounds && countriesLayer.getBounds().isValid()) {
              map.fitBounds(countriesLayer.getBounds(), { padding: [8, 8], maxZoom: 2 });
            }
          })
          .catch(function () {
            // Ignore map data failures; keep a blank map background.
          });

      })();
    </script>
  </body>
</html>`,
    [bg, countryData.labels, countryData.max, countryData.values, isDark, outline, primary]
  );

  return (
    <View style={[styles.wrap, { height, backgroundColor: theme.colors.surface }]}>
      <WebView
        // Ensure tile filter updates immediately when theme toggles.
        key={`${isDark ? 'dark' : 'light'}:${dataKey}`}
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
