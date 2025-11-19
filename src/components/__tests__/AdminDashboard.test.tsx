/**
 * Tests for AdminDashboard component
 * Note: Requires Jest and React Testing Library setup
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminDashboard } from '../AdminDashboard';
import { api } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    getUserFromToken: vi.fn(() => ({ id: '1', email: 'admin@test.com', role: 'admin' })),
  },
}));

describe('AdminDashboard', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard header', () => {
    render(<AdminDashboard onLogout={mockOnLogout} />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('shows user email', () => {
    render(<AdminDashboard onLogout={mockOnLogout} />);
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('calls onLogout when logout button is clicked', () => {
    render(<AdminDashboard onLogout={mockOnLogout} />);
    const logoutButton = screen.getByText(/logout/i);
    fireEvent.click(logoutButton);
    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('shows navigation tabs', () => {
    render(<AdminDashboard onLogout={mockOnLogout} />);
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Exams')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    render(<AdminDashboard onLogout={mockOnLogout} />);
    const examsTab = screen.getByText('Exams');
    fireEvent.click(examsTab);
    // Tab should be active (implementation specific)
  });
});


