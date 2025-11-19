import { useState, useEffect } from 'react';
import { api, Exam } from '../lib/api';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface ExamSelectionScreenProps {
  onSelect: (examId: string) => void;
  onSkip?: () => void;
}

export function ExamSelectionScreen({ onSelect, onSkip }: ExamSelectionScreenProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleContinue = () => {
    if (selectedExamId) {
      onSelect(selectedExamId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <GraduationCap className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Exams</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadExams}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Your Exam</h1>
            <p className="text-gray-600">Choose the exam you're preparing for to get personalized questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedExamId === exam.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{exam.name}</h3>
                  {selectedExamId === exam.id && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                {exam.category && (
                  <p className="text-sm text-gray-500 mb-2">{exam.category}</p>
                )}
                {exam.description && (
                  <p className="text-sm text-gray-600">{exam.description}</p>
                )}
              </button>
            ))}
          </div>

          {onSkip && (
            <div className="text-center mb-6">
              <button
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 text-sm transition"
              >
                Skip for now
              </button>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedExamId}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}


