import { UmamiApiClient, type UmamiApiError } from '@/lib/api/umami';
import type { InstanceSecrets } from '@/lib/storage/instances';
import { getInstance, getSecrets, setInstance, setSecrets } from '@/lib/storage/singleInstance';

export type SessionErrorCode =
  | 'missing_instance'
  | 'missing_secrets'
  | 'host_down'
  | 'invalid_credentials';

export type SessionResult =
  | {
      ok: true;
      baseUrl: string;
      headers: Record<string, string>;
    }
  | {
      ok: false;
      code: SessionErrorCode;
      message: string;
    };

type CacheEntry = {
  token?: string;
  verifiedAt?: number;
  inFlight?: Promise<SessionResult>;
};

const cache: CacheEntry = {};
const VERIFY_TTL_MS = 5 * 60 * 1000;

export function isAuthError(err: UmamiApiError): boolean {
  return err.status === 401 || err.status === 403;
}

export function isHostDown(err: UmamiApiError): boolean {
  return err.status === 0;
}

async function ensureSelfHostedJwt(options?: {
  forceRevalidate?: boolean;
}): Promise<SessionResult> {
  const instance = await getInstance();
  if (!instance) {
    return { ok: false, code: 'missing_instance', message: 'No instance configured.' };
  }

  const secrets = await getSecrets();
  const username = instance.username ?? undefined;

  const client = new UmamiApiClient(instance.host);
  const baseUrl = client.getBaseUrl();

  const now = Date.now();
  const cachedToken = cache.token ?? secrets.token;
  const recentlyVerified =
    !options?.forceRevalidate && cache.verifiedAt && now - cache.verifiedAt < VERIFY_TTL_MS;

  if (cachedToken) {
    client.setToken(cachedToken);
    if (recentlyVerified) {
      return { ok: true, baseUrl, headers: { Authorization: `Bearer ${cachedToken}` } };
    }

    try {
      const user = await client.verifyToken();
      cache.token = cachedToken;
      cache.verifiedAt = Date.now();

      // Best-effort sync of username/userId without touching display name.
      if (
        user?.id &&
        (instance.umamiUserId !== user.id || (user.username && instance.username !== user.username))
      ) {
        await setInstance({
          name: instance.name,
          host: instance.host,
          setupType: instance.setupType,
          username: user.username ?? instance.username,
          umamiUserId: user.id ?? instance.umamiUserId,
          createdAt: instance.createdAt,
        });
      }

      return { ok: true, baseUrl, headers: { Authorization: `Bearer ${cachedToken}` } };
    } catch (err) {
      const apiErr = err as UmamiApiError;
      if (isHostDown(apiErr)) {
        return { ok: false, code: 'host_down', message: 'Unable to reach host.' };
      }
      if (!isAuthError(apiErr)) {
        return {
          ok: false,
          code: 'invalid_credentials',
          message: apiErr.message || 'Session validation failed.',
        };
      }
      // Fall through to login below.
    }
  }

  if (!username || !secrets.password) {
    return {
      ok: false,
      code: 'missing_secrets',
      message: 'Missing stored credentials. Reset and reconnect.',
    };
  }

  try {
    const login = await client.login({
      host: instance.host,
      username,
      password: secrets.password,
    });

    await setSecrets({ token: login.token });
    cache.token = login.token;
    cache.verifiedAt = Date.now();

    if (login.user?.id) {
      await setInstance({
        name: instance.name,
        host: instance.host,
        setupType: instance.setupType,
        username: login.user.username ?? instance.username,
        umamiUserId: login.user.id ?? instance.umamiUserId,
        createdAt: instance.createdAt,
      });
    }

    return { ok: true, baseUrl, headers: { Authorization: `Bearer ${login.token}` } };
  } catch (err) {
    const apiErr = err as UmamiApiError;
    if (isHostDown(apiErr)) {
      return { ok: false, code: 'host_down', message: 'Unable to reach host.' };
    }
    if (isAuthError(apiErr)) {
      return {
        ok: false,
        code: 'invalid_credentials',
        message: 'Username or password no longer valid.',
      };
    }
    return { ok: false, code: 'invalid_credentials', message: apiErr.message || 'Login failed.' };
  }
}

async function ensureCloudSession(): Promise<SessionResult> {
  const instance = await getInstance();
  if (!instance) {
    return { ok: false, code: 'missing_instance', message: 'No instance configured.' };
  }
  const secrets: InstanceSecrets = await getSecrets();
  if (!secrets.apiKey) {
    return { ok: false, code: 'missing_secrets', message: 'Missing API key. Reset and reconnect.' };
  }

  return {
    ok: true,
    baseUrl: instance.host.replace(/\/$/, ''),
    headers: { 'x-umami-api-key': secrets.apiKey },
  };
}

export async function ensureSession(): Promise<SessionResult> {
  return ensureSessionWithOptions();
}

export async function ensureSessionWithOptions(options?: {
  forceRevalidate?: boolean;
}): Promise<SessionResult> {
  if (cache.inFlight) return cache.inFlight;

  const promise = (async () => {
    const instance = await getInstance();
    if (!instance) {
      return { ok: false, code: 'missing_instance', message: 'No instance configured.' } as const;
    }
    if (instance.setupType === 'cloud') {
      return ensureCloudSession();
    }
    return ensureSelfHostedJwt(options);
  })().finally(() => {
    cache.inFlight = undefined;
  });

  cache.inFlight = promise;
  return promise;
}

export function invalidateSession(): void {
  cache.token = undefined;
  cache.verifiedAt = undefined;
  cache.inFlight = undefined;
}
