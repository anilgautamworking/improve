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
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading exams</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-red-600 mb-2">
            <GraduationCap className="w-12 h-12 mx-auto" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-black mb-2">Unable to load exams</h2>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
          <button
            onClick={loadExams}
            className="w-full py-3 bg-black text-white rounded text-base hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-black mb-2">Select your exam</h1>
          <p className="text-gray-600 text-sm">
            Choose the focus area you are preparing for
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const isSelected = selectedExamId === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={`rounded-lg px-4 py-4 text-left ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-gray-50 text-black hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                        {exam.category || 'Primary'}
                      </p>
                      <h3 className={`text-lg font-medium mt-1 ${isSelected ? 'text-white' : 'text-black'}`}>
                        {exam.name}
                      </h3>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white/20' : 'bg-gray-200'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  {exam.description && (
                    <p className={`mt-2 text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                      {exam.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {onSkip && (
            <div className="text-center">
              <button
                onClick={onSkip}
                className="text-gray-600 hover:text-black text-sm"
              >
                Skip for now
              </button>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!selectedExamId}
            className="w-full py-3 bg-black text-white rounded text-base hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


