import type { UmamiApiError } from '@/lib/api/umami';
import {
  type SessionErrorCode,
  ensureSessionWithOptions,
  invalidateSession,
  isHostDown,
} from '@/lib/session/session';

export type RequestErrorCode = SessionErrorCode | 'http_error' | 'parse_error';

export class RequestError extends Error {
  code: RequestErrorCode;
  status?: number;

  constructor(code: RequestErrorCode, message: string, status?: number) {
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
}

export async function sessionFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const path = normalizeEndpoint(endpoint);

  const session = await ensureSessionWithOptions();
  if (!session.ok) {
    throw new RequestError(session.code, session.message);
  }

  const url = `${session.baseUrl}${path}`;
  const requestInit: RequestInit = {
    ...init,
    headers: mergeHeaders(init.headers, session.headers, { Accept: 'application/json' }),
  };

  try {
    let res = await fetch(url, requestInit);

    if (res.status === 401 || res.status === 403) {
      invalidateSession();
      const refreshed = await ensureSessionWithOptions({ forceRevalidate: true });
      if (!refreshed.ok) {
        throw new RequestError(refreshed.code, refreshed.message, res.status);
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
      throw new RequestError('host_down', apiErr.message || 'Unable to reach host.');
    }
    throw new RequestError(
      'host_down',
      err instanceof Error ? err.message : 'Network error occurred'
    );
  }
}

export async function sessionFetchJson<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const res = await sessionFetch(endpoint, init);

  if (!res.ok) {
    const message = (await readErrorMessage(res)) || `Request failed with status ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new RequestError('invalid_credentials', message, res.status);
    }
    throw new RequestError('http_error', message, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new RequestError(
      'parse_error',
      err instanceof Error ? err.message : 'Failed to parse response JSON'
    );
  }
}
