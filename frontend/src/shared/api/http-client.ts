export type ApiClientOptions = {
  apiBaseUrl: string;
  fetchFn?: typeof fetch;
  getToken?: () => string | null;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST";
  authenticated?: boolean;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export class ApiError extends Error {
  status: number;
  requestId: string | null;

  constructor(message: string, status: number, requestId: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

function buildUrl(baseUrl: string, path: string, query?: ApiRequestOptions["query"]) {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseResponseError(response: Response) {
  const requestId = response.headers.get("X-Request-ID");
  const rawText = await response.text();

  let message = rawText || `API error: ${response.status}`;
  try {
    const parsed = JSON.parse(rawText);
    if (typeof parsed === "string") {
      message = parsed;
    } else if (typeof parsed?.detail === "string") {
      message = parsed.detail;
    }
  } catch {
    // Keep raw text fallback.
  }

  if (requestId) {
    message = `${message} (request: ${requestId})`;
  }

  return new ApiError(message, response.status, requestId);
}

export function createApiClient({ apiBaseUrl, fetchFn = fetch, getToken }: ApiClientOptions) {
  async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    const body = options.body ? JSON.stringify(options.body) : undefined;

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    if (options.authenticated && getToken) {
      const token = getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetchFn(buildUrl(apiBaseUrl, path, options.query), {
      method: options.method || "GET",
      headers,
      body,
    });

    if (!response.ok) {
      throw await parseResponseError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    get<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
      return request<T>(path, { ...options, method: "GET" });
    },
    post<T>(path: string, options?: Omit<ApiRequestOptions, "method">) {
      return request<T>(path, { ...options, method: "POST" });
    },
  };
}
