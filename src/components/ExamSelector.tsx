import { useState, useEffect } from 'react';
import { api, Exam } from '../lib/api';
import { GraduationCap, ChevronDown } from 'lucide-react';

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
        <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-500">Loading exams...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full pl-10 pr-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Exam {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white text-left flex items-center justify-between"
        >
          <div className="flex items-center">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <span className={selectedExam ? 'text-gray-900' : 'text-gray-500'}>
              {selectedExam ? selectedExam.name : 'Choose an exam...'}
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition text-gray-700"
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
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition ${
                    selectedExamId === exam.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{exam.name}</div>
                  {exam.description && (
                    <div className="text-sm text-gray-500 mt-1">{exam.description}</div>
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


