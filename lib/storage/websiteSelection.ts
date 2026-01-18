import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@umami-go:selected-website';

export async function getSelectedWebsiteId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setSelectedWebsiteId(websiteId: string | null): Promise<void> {
  if (!websiteId) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, websiteId);
}

export async function clearSelectedWebsiteId(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
