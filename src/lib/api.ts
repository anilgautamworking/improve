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

  // Centralized fetch wrapper to handle auth errors
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // Check if token is expired before making request
    if (authToken && isTokenExpired(authToken)) {
      this.handleAuthError();
      throw new Error('Token expired');
    }

    const res = await fetch(url, options);
    const data = await res.json();

    // Handle authentication errors
    if (res.status === 401 || res.status === 403) {
      // Check if it's an auth error (not just any 401/403)
      if (data.error && (data.error.includes('token') || data.error.includes('Token') || data.error.includes('expired') || data.error.includes('Invalid'))) {
        this.handleAuthError();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async signup(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    authToken = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    authToken = data.token;
    localStorage.setItem('auth_token', data.token);
    return data;
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

