import AsyncStorage from '@react-native-async-storage/async-storage';

function keyFor(instanceId: string): string {
  return `@umami-go:selected-website:${instanceId}`;
}

export async function getSelectedWebsiteId(instanceId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(keyFor(instanceId));
  } catch {
    return null;
  }
}

export async function setSelectedWebsiteId(
  instanceId: string,
  websiteId: string | null
): Promise<void> {
  const key = keyFor(instanceId);
  if (!websiteId) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await AsyncStorage.setItem(key, websiteId);
}
