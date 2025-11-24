import { useState, useEffect } from 'react';
import { api, Exam } from '../lib/api';
import { ChevronDown } from 'lucide-react';

interface ExamSelectorProps {
  selectedExamId?: string | null;
  onSelect: (examId: string | null) => void;
  required?: boolean;
  className?: string;
}

export function ExamSelector({ selectedExamId, onSelect, required = false, className = '' }: ExamSelectorProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const examList = await api.getExams();
      setExams(examList);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 rounded bg-gray-50 flex items-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-gray-600">Loading exams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm text-gray-700 mb-1">
        Select Exam {required && <span className="text-red-600">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 rounded bg-gray-50 text-left flex items-center justify-between focus:outline-none focus:bg-gray-100"
        >
          <span className={selectedExam ? 'text-black' : 'text-gray-600'}>
            {selectedExam ? selectedExam.name : 'Choose an exam...'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white rounded max-h-60 overflow-auto shadow-lg">
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm text-black"
                >
                  None (All exams)
                </button>
              )}
              {exams.map((exam) => (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => {
                    onSelect(exam.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 text-sm ${
                    selectedExamId === exam.id ? 'bg-gray-100 text-black font-medium' : 'text-black'
                  }`}
                >
                  <div className="font-medium">{exam.name}</div>
                  {exam.description && (
                    <div className="text-xs text-gray-600 mt-1">{exam.description}</div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


