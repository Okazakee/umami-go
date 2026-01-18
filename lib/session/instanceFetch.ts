import type { UmamiApiError } from '../api/umami';
import {
  ensureInstanceSessionWithOptions,
  invalidateInstanceSession,
  isAuthError,
  isHostDown,
  type InstanceSessionErrorCode,
} from './instanceSession';

export type InstanceRequestErrorCode = InstanceSessionErrorCode | 'http_error' | 'parse_error';

export class InstanceRequestError extends Error {
  code: InstanceRequestErrorCode;
  status?: number;

  constructor(code: InstanceRequestErrorCode, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeEndpoint(endpoint: string): string {
  if (!endpoint) return '/';
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

function mergeHeaders(...headers: Array<HeadersInit | undefined>): HeadersInit {
  const merged = new Headers();
  for (const h of headers) {
    if (!h) continue;
    const asHeaders = new Headers(h);
    asHeaders.forEach((value, key) => merged.set(key, value));
  }
  return merged;
}

async function readErrorMessage(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as unknown;
    if (data && typeof data === 'object') {
      const maybe =
        'message' in data && typeof data.message === 'string'
          ? data.message
          : 'error' in data && typeof data.error === 'string'
            ? data.error
            : null;
      return maybe;
    }
  } catch {
    // ignore
  }
  try {
    const text = await res.text();
    return text ? text : null;
  } catch {
    return null;
  }
  return null;
}

export async function instanceFetch(
  instanceId: string,
  endpoint: string,
  init: RequestInit = {}
): Promise<Response> {
  const path = normalizeEndpoint(endpoint);

  const session = await ensureInstanceSessionWithOptions(instanceId);
  if (!session.ok) {
    throw new InstanceRequestError(session.code, session.message);
  }

  const url = `${session.baseUrl}${path}`;
  const requestInit: RequestInit = {
    ...init,
    headers: mergeHeaders(init.headers, session.headers, { Accept: 'application/json' }),
  };

  try {
    let res = await fetch(url, requestInit);

    // If the backend says we're unauthorized, force a refresh and retry once.
    if (res.status === 401 || res.status === 403) {
      invalidateInstanceSession(instanceId);
      const refreshed = await ensureInstanceSessionWithOptions(instanceId, { forceRevalidate: true });
      if (!refreshed.ok) {
        throw new InstanceRequestError(refreshed.code, refreshed.message, res.status);
      }

      const retryInit: RequestInit = {
        ...init,
        headers: mergeHeaders(init.headers, refreshed.headers, { Accept: 'application/json' }),
      };
      res = await fetch(`${refreshed.baseUrl}${path}`, retryInit);
    }

    return res;
  } catch (err) {
    const apiErr = err as UmamiApiError;
    if (apiErr && typeof apiErr === 'object' && 'status' in apiErr && isHostDown(apiErr)) {
      throw new InstanceRequestError('host_down', apiErr.message || 'Unable to reach host.');
    }
    throw new InstanceRequestError(
      'host_down',
      err instanceof Error ? err.message : 'Network error occurred'
    );
  }
}

export async function instanceFetchJson<T>(
  instanceId: string,
  endpoint: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await instanceFetch(instanceId, endpoint, init);

  if (!res.ok) {
    const message = (await readErrorMessage(res)) || `Request failed with status ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new InstanceRequestError('invalid_credentials', message, res.status);
    }
    throw new InstanceRequestError('http_error', message, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new InstanceRequestError(
      'parse_error',
      err instanceof Error ? err.message : 'Failed to parse response JSON'
    );
  }
}

