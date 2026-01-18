import { UmamiApiClient, type UmamiApiError } from '../api/umami';
import {
  type InstanceRecord,
  getInstanceById,
  getInstanceSecrets,
  setInstanceSecrets,
  upsertInstance,
} from '../storage/instances';

export type InstanceSessionErrorCode =
  | 'missing_instance'
  | 'missing_secrets'
  | 'host_down'
  | 'invalid_credentials';

export type InstanceSessionResult =
  | {
      ok: true;
      instance: InstanceRecord;
      baseUrl: string;
      headers: Record<string, string>;
    }
  | {
      ok: false;
      code: InstanceSessionErrorCode;
      message: string;
      instance?: InstanceRecord;
    };

type CacheEntry = {
  token?: string;
  verifiedAt?: number;
  inFlight?: Promise<InstanceSessionResult>;
};

const cache = new Map<string, CacheEntry>();
const VERIFY_TTL_MS = 5 * 60 * 1000;

export function isAuthError(err: UmamiApiError): boolean {
  return err.status === 401 || err.status === 403;
}

export function isHostDown(err: UmamiApiError): boolean {
  return err.status === 0;
}

async function ensureSelfHostedJwt(
  instance: InstanceRecord,
  options?: { forceRevalidate?: boolean }
): Promise<InstanceSessionResult> {
  const secrets = await getInstanceSecrets(instance.id);
  const username = instance.username ?? undefined;

  // If we don't have a password, we cannot auto re-login when the JWT expires.
  if (!secrets.password) {
    // We might still have a valid token, so allow verify path below.
    // If verify fails, we’ll return invalid credentials.
  }

  const client = new UmamiApiClient(instance.host);
  const baseUrl = client.getBaseUrl();

  const cached = cache.get(instance.id);
  const now = Date.now();
  const cachedToken = cached?.token ?? secrets.token;
  const recentlyVerified =
    !options?.forceRevalidate && cached?.verifiedAt && now - cached.verifiedAt < VERIFY_TTL_MS;

  if (cachedToken) {
    client.setToken(cachedToken);
    if (recentlyVerified) {
      return {
        ok: true,
        instance,
        baseUrl,
        headers: { Authorization: `Bearer ${cachedToken}` },
      };
    }

    try {
      const user = await client.verifyToken();
      cache.set(instance.id, { token: cachedToken, verifiedAt: Date.now() });

      // Best-effort sync if server-side user changed.
      if (user?.id && (instance.umamiUserId !== user.id || instance.username !== user.username)) {
        await upsertInstance({
          id: instance.id,
          name: `${instance.host} (${user.username})`,
          host: instance.host,
          username: user.username,
          umamiUserId: user.id,
          setupType: instance.setupType,
        });
      }

      return {
        ok: true,
        instance,
        baseUrl,
        headers: { Authorization: `Bearer ${cachedToken}` },
      };
    } catch (err) {
      const apiErr = err as UmamiApiError;
      if (isHostDown(apiErr)) {
        return {
          ok: false,
          code: 'host_down',
          message: 'Unable to reach host.',
          instance,
        };
      }

      if (!isAuthError(apiErr)) {
        return {
          ok: false,
          code: 'invalid_credentials',
          message: apiErr.message || 'Session validation failed.',
          instance,
        };
      }
      // Fall through to login below.
    }
  }

  if (!username || !secrets.password) {
    return {
      ok: false,
      code: 'missing_secrets',
      message: 'Missing stored credentials. Please reconnect this instance.',
      instance,
    };
  }

  try {
    const login = await client.login({
      host: instance.host,
      username,
      password: secrets.password,
    });

    await setInstanceSecrets(instance.id, { token: login.token });
    cache.set(instance.id, { token: login.token, verifiedAt: Date.now() });

    if (login.user?.id) {
      await upsertInstance({
        id: instance.id,
        name: `${instance.host} (${login.user.username})`,
        host: instance.host,
        username: login.user.username,
        umamiUserId: login.user.id,
        setupType: instance.setupType,
      });
    }

    return {
      ok: true,
      instance,
      baseUrl,
      headers: { Authorization: `Bearer ${login.token}` },
    };
  } catch (err) {
    const apiErr = err as UmamiApiError;
    if (isHostDown(apiErr)) {
      return {
        ok: false,
        code: 'host_down',
        message: 'Unable to reach host.',
        instance,
      };
    }
    if (isAuthError(apiErr)) {
      return {
        ok: false,
        code: 'invalid_credentials',
        message: 'Username or password no longer valid.',
        instance,
      };
    }
    return {
      ok: false,
      code: 'invalid_credentials',
      message: apiErr.message || 'Login failed.',
      instance,
    };
  }
}

async function ensureCloudSession(instance: InstanceRecord): Promise<InstanceSessionResult> {
  const secrets = await getInstanceSecrets(instance.id);
  if (!secrets.apiKey) {
    return {
      ok: false,
      code: 'missing_secrets',
      message: 'Missing API key. Please reconnect this instance.',
      instance,
    };
  }

  // instance.host is already normalized to api host during onboarding.
  return {
    ok: true,
    instance,
    baseUrl: instance.host.replace(/\/$/, ''),
    headers: { 'x-umami-api-key': secrets.apiKey },
  };
}

export async function ensureInstanceSession(instanceId: string): Promise<InstanceSessionResult> {
  return ensureInstanceSessionWithOptions(instanceId);
}

export async function ensureInstanceSessionWithOptions(
  instanceId: string,
  options?: { forceRevalidate?: boolean }
): Promise<InstanceSessionResult> {
  const existing = cache.get(instanceId);
  if (existing?.inFlight) return existing.inFlight;

  const promise = (async () => {
    const instance = await getInstanceById(instanceId);
    if (!instance) {
      return { ok: false, code: 'missing_instance', message: 'Instance not found.' } as const;
    }

    if (instance.setupType === 'cloud') {
      return ensureCloudSession(instance);
    }
    return ensureSelfHostedJwt(instance, options);
  })().finally(() => {
    const entry = cache.get(instanceId);
    if (entry?.inFlight) {
      delete entry.inFlight;
      cache.set(instanceId, entry);
    }
  });

  cache.set(instanceId, { ...(existing ?? {}), inFlight: promise });
  return promise;
}

export function invalidateInstanceSession(instanceId: string): void {
  cache.delete(instanceId);
}

