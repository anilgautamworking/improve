/**
 * Tests for ExamSelector component
 * Note: Requires Jest and React Testing Library setup
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExamSelector } from '../ExamSelector';
import { api } from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  api: {
    getExams: vi.fn(),
  },
}));

describe('ExamSelector', () => {
  const mockExams = [
    { id: '1', name: 'JEE', category: 'Engineering', description: 'Joint Entrance Examination' },
    { id: '2', name: 'NEET', category: 'Medical', description: 'National Eligibility Test' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getExams as any).mockResolvedValue(mockExams);
  });

  it('renders loading state initially', async () => {
    const onSelect = vi.fn();
    render(<ExamSelector onSelect={onSelect} />);
    
    expect(screen.getByText(/loading exams/i)).toBeInTheDocument();
  });

  it('renders exams dropdown after loading', async () => {
    const onSelect = vi.fn();
    render(<ExamSelector onSelect={onSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText(/choose an exam/i)).toBeInTheDocument();
    });
  });

  it('calls onSelect when exam is selected', async () => {
    const onSelect = vi.fn();
    render(<ExamSelector onSelect={onSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText(/choose an exam/i)).toBeInTheDocument();
    });

    const button = screen.getByText(/choose an exam/i);
    fireEvent.click(button);

    await waitFor(() => {
      const jeeOption = screen.getByText('JEE');
      fireEvent.click(jeeOption);
    });

    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('shows selected exam name', async () => {
    const onSelect = vi.fn();
    render(<ExamSelector selectedExamId="1" onSelect={onSelect} />);
    
    await waitFor(() => {
      expect(screen.getByText('JEE')).toBeInTheDocument();
    });
  });
});


