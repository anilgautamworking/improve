import { getUserFriendlyError, isRetryableError, getRetryDelay, isNetworkError } from '../utils/errorMessages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Initialize token from localStorage
let authToken: string | null = localStorage.getItem('auth_token');

// Refresh token from localStorage (useful when localStorage is updated elsewhere)
export function refreshToken() {
  authToken = localStorage.getItem('auth_token');
}

// Helper to decode JWT token (without verification, just to check expiration)
function decodeToken(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
}

export interface Question {
  id: string;
  category_id: string;
  question_format: 'multiple_choice' | 'statement';
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  question_count: number;
}

class API {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    };
  }

  // Handle authentication errors (401/403) by logging out
  private handleAuthError() {
    this.logout();
    // Redirect to login page
    window.location.href = '/';
  }

  // Centralized fetch wrapper to handle auth errors with retry logic
  private async fetchWithAuth(
    url: string, 
    options: RequestInit = {}, 
    retries: number = 3,
    currentAttempt: number = 0
  ): Promise<any> {
    // Check if token is expired before making request
    if (authToken && isTokenExpired(authToken)) {
      this.handleAuthError();
      throw new Error('Token expired');
    }

    try {
      // Add timeout to fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      let data: any;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } else {
          // Non-JSON response (e.g., HTML error page)
          const text = await res.text();
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
      } catch (parseError: any) {
        // JSON parsing failed
        if (parseError instanceof SyntaxError) {
          throw new Error('Invalid response from server. Please try again.');
        }
        throw parseError;
      }

      // Handle authentication errors
      if (res.status === 401 || res.status === 403) {
        // Check if it's an auth error
        if (data.error_code?.startsWith('AUTH_') || 
            data.error && (data.error.includes('token') || data.error.includes('Token') || data.error.includes('expired') || data.error.includes('Invalid'))) {
          this.handleAuthError();
          throw new Error(getUserFriendlyError(data));
        }
      }

      if (!res.ok) {
        // Check if error is retryable
        if (currentAttempt < retries && isRetryableError(data, res.status)) {
          const delay = getRetryDelay(currentAttempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithAuth(url, options, retries, currentAttempt + 1);
        }
        
        // Throw user-friendly error
        throw new Error(getUserFriendlyError(data));
      }

      return data;
    } catch (error: any) {
      // Handle network errors
      if (isNetworkError(error) && currentAttempt < retries) {
        const delay = getRetryDelay(currentAttempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithAuth(url, options, retries, currentAttempt + 1);
      }
      
      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      // Re-throw with user-friendly message
      throw new Error(getUserFriendlyError(error));
    }
  }

  async signup(email: string, password: string) {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      let data: any;
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } else {
          const text = await res.text();
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
      } catch (parseError: any) {
        if (parseError instanceof SyntaxError) {
          throw new Error('Invalid response from server. Please try again.');
        }
        throw parseError;
      }
      
      if (!res.ok) {
        throw new Error(getUserFriendlyError(data));
      }
      authToken = data.token;
      localStorage.setItem('auth_token', data.token);
      return data;
    } catch (error: any) {
      throw new Error(getUserFriendlyError(error));
    }
  }

  async login(email: string, password: string) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      let data: any;
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } else {
          const text = await res.text();
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
        }
      } catch (parseError: any) {
        if (parseError instanceof SyntaxError) {
          throw new Error('Invalid response from server. Please try again.');
        }
        throw parseError;
      }
      
      if (!res.ok) {
        throw new Error(getUserFriendlyError(data));
      }
      authToken = data.token;
      localStorage.setItem('auth_token', data.token);
      return data;
    } catch (error: any) {
      throw new Error(getUserFriendlyError(error));
    }
  }

  logout() {
    authToken = null;
    localStorage.removeItem('auth_token');
  }

  async generateQuestions(category: string, count: number = 2) {
    return this.fetchWithAuth(`${API_URL}/questions/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ category, count }),
    });
  }

  async saveAnswer(questionId: string, selectedAnswer: string | null, isCorrect: boolean) {
    return this.fetchWithAuth(`${API_URL}/answers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer, is_correct: isCorrect }),
    });
  }

  async getCorrectAnswers() {
    const data = await this.fetchWithAuth(`${API_URL}/answers/correct`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return data.correctAnswers;
  }

  async getStats() {
    return this.fetchWithAuth(`${API_URL}/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async getCategories(): Promise<Category[]> {
    const data = await this.fetchWithAuth(`${API_URL}/categories`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return data.categories;
  }

  isAuthenticated() {
    // Check if token exists and is not expired
    if (!authToken) return false;
    return !isTokenExpired(authToken);
  }

  // Get user info from token (without making API call)
  getUserFromToken() {
    if (!authToken) return null;
    if (isTokenExpired(authToken)) return null;
    
    const decoded = decodeToken(authToken);
    if (!decoded) return null;
    
    return {
      id: decoded.userId || decoded.user_id || null,
      email: decoded.email || null,
    };
  }
}

export const api = new API();

