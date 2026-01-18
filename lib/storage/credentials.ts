import AsyncStorage from '@react-native-async-storage/async-storage';

const CREDENTIALS_KEY = '@umami-go:credentials';
const INSTANCE_KEY = '@umami-go:instance';

export interface SavedCredentials {
  host: string;
  username: string;
  password: string;
  setupType: 'self-hosted' | 'cloud';
  token?: string;
  userId?: string;
}

export interface SavedInstance {
  id: string;
  name: string;
  host: string;
  setupType: 'self-hosted' | 'cloud';
  token?: string;
  apiKey?: string;
}

export async function saveCredentials(credentials: SavedCredentials): Promise<void> {
  try {
    await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Error saving credentials:', error);
    throw error;
  }
}

export async function getCredentials(): Promise<SavedCredentials | null> {
  try {
    const value = await AsyncStorage.getItem(CREDENTIALS_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error loading credentials:', error);
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CREDENTIALS_KEY);
    await AsyncStorage.removeItem(INSTANCE_KEY);
  } catch (error) {
    console.error('Error clearing credentials:', error);
    throw error;
  }
}

export async function saveInstance(instance: SavedInstance): Promise<void> {
  try {
    await AsyncStorage.setItem(INSTANCE_KEY, JSON.stringify(instance));
  } catch (error) {
    console.error('Error saving instance:', error);
    throw error;
  }
}

export async function getInstance(): Promise<SavedInstance | null> {
  try {
    const value = await AsyncStorage.getItem(INSTANCE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error loading instance:', error);
    return null;
  }
}
