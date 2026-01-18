import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore keys must only contain alphanumeric characters, ".", "-", and "_"
const CREDENTIALS_KEY = 'umami_go_credentials';
const LEGACY_INSTANCE_KEY = '@umami-go:instance';

export interface SavedCredentials {
  host: string;
  username: string;
  password: string;
  setupType: 'self-hosted' | 'cloud';
  token?: string;
  userId?: string;
}

/**
 * Save credentials to SecureStore (encrypted storage).
 * Sensitive data like passwords, tokens, and API keys are stored securely.
 */
export async function saveCredentials(credentials: SavedCredentials): Promise<void> {
  try {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
}

/**
 * Get credentials from SecureStore (encrypted storage).
 */
export async function getCredentials(): Promise<SavedCredentials | null> {
  try {
    const value = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error loading credentials:', error);
    return null;
  }
}

/**
 * Clear credentials from SecureStore and instance metadata from AsyncStorage.
 */
export async function clearCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    // Clean up legacy storage if present
    await AsyncStorage.removeItem(LEGACY_INSTANCE_KEY);
  } catch (error) {
    console.error('Error clearing credentials:', error);
    throw error;
  }
}
