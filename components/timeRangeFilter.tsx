import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Portal, TextInput, useTheme } from 'react-native-paper';

export type TimeRangeValue =
  | { kind: 'preset'; preset: string }
  | { kind: 'custom'; from: string; to: string };

export type TimeRangePreset = { key: string; label: string };

export function formatTimeRangeLabel(value: TimeRangeValue, presets: TimeRangePreset[]): string {
  if (value.kind === 'preset') {
    return presets.find((p) => p.key === value.preset)?.label ?? value.preset;
  }
  const from = value.from.trim();
  const to = value.to.trim();
  if (!from && !to) return 'Custom';
  if (from && !to) return `From ${from}`;
  if (!from && to) return `Until ${to}`;
  return `${from} → ${to}`;
}

export function TimeRangeFilter({
  value,
  onChange,
  presets,
  customLabel = 'Custom',
  dialogTitle = 'Custom range',
}: {
  value: TimeRangeValue;
  onChange: (next: TimeRangeValue) => void;
  presets: TimeRangePreset[];
  customLabel?: string;
  dialogTitle?: string;
}) {
  const theme = useTheme();
  const dialogStyle = React.useMemo(() => ({ borderRadius: 12 }), []);

  const [open, setOpen] = React.useState(false);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const openDialog = React.useCallback(() => {
    if (value.kind === 'custom') {
      setFrom(value.from);
      setTo(value.to);
    } else {
      setFrom('');
      setTo('');
    }
    setOpen(true);
  }, [value]);

  const apply = React.useCallback(() => {
    onChange({ kind: 'custom', from, to });
    setOpen(false);
  }, [from, onChange, to]);

  return (
    <>
      <View style={styles.row}>
        {presets.map((p) => (
          <Chip
            key={p.key}
            selected={value.kind === 'preset' && value.preset === p.key}
            onPress={() => onChange({ kind: 'preset', preset: p.key })}
          >
            {p.label}
          </Chip>
        ))}
        <Chip selected={value.kind === 'custom'} onPress={openDialog}>
          {customLabel}
        </Chip>
      </View>

      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={dialogStyle}>
          <Dialog.Title>{dialogTitle}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              mode="outlined"
              label="From"
              placeholder="YYYY-MM-DD"
              value={from}
              onChangeText={setFrom}
            />
            <TextInput
              mode="outlined"
              label="To"
              placeholder="YYYY-MM-DD"
              value={to}
              onChangeText={setTo}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)} textColor={theme.colors.onSurfaceVariant}>
              Cancel
            </Button>
            <Button onPress={apply}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dialogContent: {
    gap: 10,
  },
});
