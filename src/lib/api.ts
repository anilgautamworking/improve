const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = localStorage.getItem('auth_token');

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

class API {
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    };
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
    const res = await fetch(`${API_URL}/questions/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ category, count }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async saveAnswer(questionId: string, selectedAnswer: string | null, isCorrect: boolean) {
    const res = await fetch(`${API_URL}/answers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer, is_correct: isCorrect }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  async getCorrectAnswers() {
    const res = await fetch(`${API_URL}/answers/correct`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.correctAnswers;
  }

  async getStats() {
    const res = await fetch(`${API_URL}/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  isAuthenticated() {
    return !!authToken;
  }
}

export const api = new API();

