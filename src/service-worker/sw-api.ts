/**
 * Service Worker API Helper
 * Provides authenticated API requests with proper base URL and auth headers
 */

import { getAuthToken } from "./auth-state";

// API URL received from main thread
let apiBaseUrl: string | null = null;

export const setApiBaseUrl = (url: string): void => {
  apiBaseUrl = url + '/api';
};

export const getApiBaseUrl = (): string => {
  return apiBaseUrl || '/api'; // Fallback if not set
};

interface SwApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | object;
}

/**
 * Make an authenticated API request from the service worker
 */
export async function swApiFetch(endpoint: string, options: SwApiOptions = {}): Promise<Response> {
  const authToken = getAuthToken();
  
  // Construct full URL
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add auth token if available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Prepare request options
  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers
  };
  
  // Add body for non-GET requests
  if (options.body && requestOptions.method !== 'GET') {
    requestOptions.body = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }
  
  return fetch(url, requestOptions);
}

/**
 * Convenience methods for common HTTP verbs
 */
export const swApi = {
  get: (endpoint: string, options?: Omit<SwApiOptions, 'method'>) => 
    swApiFetch(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, body?: object, options?: Omit<SwApiOptions, 'method' | 'body'>) => 
    swApiFetch(endpoint, { ...options, method: 'POST', body }),
    
  put: (endpoint: string, body?: object, options?: Omit<SwApiOptions, 'method' | 'body'>) => 
    swApiFetch(endpoint, { ...options, method: 'PUT', body }),
    
  delete: (endpoint: string, options?: Omit<SwApiOptions, 'method'>) => 
    swApiFetch(endpoint, { ...options, method: 'DELETE' }),
    
  patch: (endpoint: string, body?: object, options?: Omit<SwApiOptions, 'method' | 'body'>) => 
    swApiFetch(endpoint, { ...options, method: 'PATCH', body })
};