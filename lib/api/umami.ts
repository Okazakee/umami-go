export interface UmamiCredentials {
  host: string;
  username: string;
  password: string;
}

export interface UmamiLoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    createdAt: string;
    isAdmin: boolean;
  };
}

export interface UmamiApiError {
  message: string;
  status?: number;
}

export class UmamiApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(host: string) {
    // Ensure host has protocol and no trailing slash
    this.baseUrl = host.replace(/\/$/, '');
    if (!this.baseUrl.startsWith('http://') && !this.baseUrl.startsWith('https://')) {
      this.baseUrl = `https://${this.baseUrl}`;
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: headers as HeadersInit,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        const error: UmamiApiError = {
          message: errorMessage,
          status: response.status,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        throw error as UmamiApiError;
      }
      throw {
        message: error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
      } as UmamiApiError;
    }
  }

  async login(credentials: UmamiCredentials): Promise<UmamiLoginResponse> {
    const response = await this.request<UmamiLoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
      }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async verifyToken(): Promise<UmamiLoginResponse['user']> {
    return this.request<UmamiLoginResponse['user']>('/api/auth/verify', {
      method: 'POST',
    });
  }
}
