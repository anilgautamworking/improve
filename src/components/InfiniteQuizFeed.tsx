import { useEffect, useState, useRef } from 'react';
import { api, Question } from '../lib/api';
import { Clock, CheckCircle, XCircle, TrendingUp, Flame, Award, Sparkles, Settings } from 'lucide-react';
import { SettingsScreen } from './SettingsScreen';

interface QuizFeedProps {
  userId: string;
}

interface QuestionState {
  question: Question;
  selectedAnswer: string | null;
  showExplanation: boolean;
  timeLeft: number;
  answeredCorrectly: boolean | null;
  isAnswered: boolean;
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'News This Month', name: 'November 2025' },
  { id: 'News Last 3 Months', name: 'Last 3 Months' },
  { id: 'Current Affairs', name: 'Current Affairs' },
  { id: 'India GK', name: 'India GK' },
  { id: 'History', name: 'History' },
  { id: 'Economy', name: 'Economy' },
];

export function InfiniteQuizFeed({ userId }: QuizFeedProps) {
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [allowScrollWithoutAnswer, setAllowScrollWithoutAnswer] = useState(false);
  const [statementQuestionsOnly, setStatementQuestionsOnly] = useState(false);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory, statementQuestionsOnly, difficulty]);

  useEffect(() => {
    if (questionStates.length > 0 && currentIndex >= questionStates.length - 5 && !isLoadingRef.current) {
      loadQuestionsInBackground();
    }
  }, [currentIndex, questionStates.length]);

  useEffect(() => {
    const current = questionStates[currentIndex];
    if (!current || current.showExplanation || current.isAnswered) return;

    const timer = setInterval(() => {
      setQuestionStates(prev => {
        const updated = [...prev];
        if (updated[currentIndex].timeLeft <= 1) {
          handleTimeout(currentIndex);
          return updated;
        }
        updated[currentIndex] = {
          ...updated[currentIndex],
          timeLeft: updated[currentIndex].timeLeft - 1,
        };
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, questionStates]);

  const loadQuestions = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      // Get list of correctly answered question IDs
      const correctlyAnsweredIds = new Set(await api.getCorrectAnswers());

      const category = selectedCategory === 'all' ? 'Current Affairs' : selectedCategory;

      const { questions } = await api.generateQuestions(category, 2);

      if (questions && questions.length > 0) {
        // Filter out questions the user has already answered correctly
        let filteredQuestions = questions.filter((q: Question) => !correctlyAnsweredIds.has(q.id));

        // Filter questions based on statement-only setting
        if (statementQuestionsOnly) {
          filteredQuestions = filteredQuestions.filter((q: Question) => q.question_format === 'statement');
        }

        // Filter by difficulty if not 'all'
        if (difficulty !== 'all') {
          filteredQuestions = filteredQuestions.filter((q: Question) => q.difficulty === difficulty);
        }

        const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
        const states = shuffled.map((q: Question) => ({
          question: q,
          selectedAnswer: null,
          showExplanation: false,
          timeLeft: 30,
          answeredCorrectly: null,
          isAnswered: false,
        }));

        if (isLoadMore) {
          setQuestionStates(prev => [...prev, ...states]);
        } else {
          setQuestionStates(states);
          setCurrentIndex(0);
        }
      }
    } catch (err: any) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadQuestionsInBackground = async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;

      // Get list of correctly answered question IDs
      const correctlyAnsweredIds = new Set(await api.getCorrectAnswers());

      const category = selectedCategory === 'all' ? 'Current Affairs' : selectedCategory;

      const { questions } = await api.generateQuestions(category, 5);

      if (questions && questions.length > 0) {
        // Filter out questions the user has already answered correctly
        let filteredQuestions = questions.filter((q: Question) => !correctlyAnsweredIds.has(q.id));

        // Filter questions based on statement-only setting
        if (statementQuestionsOnly) {
          filteredQuestions = filteredQuestions.filter((q: Question) => q.question_format === 'statement');
        }

        // Filter by difficulty if not 'all'
        if (difficulty !== 'all') {
          filteredQuestions = filteredQuestions.filter((q: Question) => q.difficulty === difficulty);
        }

        const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
        const states = shuffled.map((q: Question) => ({
          question: q,
          selectedAnswer: null,
          showExplanation: false,
          timeLeft: 30,
          answeredCorrectly: null,
          isAnswered: false,
        }));

        setQuestionStates(prev => [...prev, ...states]);
      }
    } catch (err: any) {
      console.error('Error loading questions in background:', err);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleTimeout = (index: number) => {
    const currentState = questionStates[index];

    setQuestionStates(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        showExplanation: true,
        answeredCorrectly: false,
        isAnswered: true,
      };
      return updated;
    });
    setStreak(0);

    saveUserAnswer(currentState.question.id, null, false);
  };

  const saveUserAnswer = async (questionId: string, answer: string | null, isCorrect: boolean) => {
    try {
      await api.saveAnswer(questionId, answer, isCorrect);
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  const handleAnswerSelect = async (index: number, answer: string | null) => {
    const currentState = questionStates[index];
    if (currentState.isAnswered) return;

    const isCorrect = answer === currentState.question.correct_answer;

    setQuestionStates(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selectedAnswer: answer || 'skipped',
        showExplanation: true,
        answeredCorrectly: isCorrect,
        isAnswered: true,
      };
      return updated;
    });

    if (isCorrect) {
      setScore(prev => prev + currentState.question.points);
      setStreak(prev => prev + 1);

      await saveUserAnswer(currentState.question.id, answer, true);
    } else {
      setStreak(0);
      await saveUserAnswer(currentState.question.id, answer, false);
    }

    setTotalAnswered(prev => prev + 1);

    setTimeout(() => {
      handleNextQuestion(index);
    }, 2000);
  };

  const handleNextQuestion = (index: number) => {
    if (index < questionStates.length - 1) {
      isProgrammaticScrollRef.current = true;
      setCurrentIndex(index + 1);
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: (index + 1) * window.innerHeight,
          behavior: 'smooth',
        });
        // Reset flag after scroll animation completes
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 1000);
      }
    }
  };

  const handleScroll = () => {
    if (!containerRef.current || isProgrammaticScrollRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / window.innerHeight);
    if (newIndex !== currentIndex && newIndex < questionStates.length) {
      setCurrentIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Generating fresh questions...</p>
          <p className="text-gray-600 text-sm mt-2">Powered by AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black/95 to-transparent pointer-events-auto">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-white font-bold text-lg">{score}</span>
              </div>
              {streak > 1 && (
                <div className="flex items-center gap-2 bg-orange-600 px-3 py-1 rounded-full animate-pulse">
                  <Flame className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">{streak}x</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-white font-bold text-sm">{totalAnswered}</span>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x'
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 active:bg-gray-700'
                }`}
              >
                {cat.id === 'News This Month' && <Sparkles className="w-3 h-3 inline mr-1" />}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {questionStates.map((state, index) => (
          <QuestionCard
            key={`${state.question.id}-${index}`}
            state={state}
            index={index}
            isActive={index === currentIndex}
            onAnswerSelect={handleAnswerSelect}
          />
        ))}

        {loadingMore && (
          <div className="h-screen snap-start flex items-center justify-center bg-black">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-3" />
              <p className="text-gray-400">Loading more questions...</p>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsScreen
          userId={userId}
          onClose={() => setShowSettings(false)}
          allowScrollWithoutAnswer={allowScrollWithoutAnswer}
          onToggleScroll={setAllowScrollWithoutAnswer}
          statementQuestionsOnly={statementQuestionsOnly}
          onToggleStatementOnly={setStatementQuestionsOnly}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
        />
      )}
    </div>
  );
}

interface QuestionCardProps {
  state: QuestionState;
  index: number;
  isActive: boolean;
  onAnswerSelect: (index: number, answer: string | null) => void;
}

function QuestionCard({ state, index, isActive, onAnswerSelect }: QuestionCardProps) {
  const isStatementQuestion = state.question.question_format === 'statement';

  const options = [
    { key: 'a', text: state.question.option_a || '' },
    { key: 'b', text: state.question.option_b || '' },
    { key: 'c', text: state.question.option_c || '' },
    { key: 'd', text: state.question.option_d || '' },
  ];

  const questionWordCount = state.question.question_text.split(' ').length;
  const totalOptionWords = options.reduce((sum, opt) => sum + opt.text.split(' ').length, 0);
  const totalWords = questionWordCount + totalOptionWords;
  const explanationWordCount = state.question.explanation.split(' ').length;

  const getQuestionFontSize = () => {
    if (isStatementQuestion) return 'text-2xl md:text-3xl';
    if (questionWordCount > 40) return 'text-lg md:text-xl';
    if (questionWordCount > 25) return 'text-xl md:text-2xl';
    return 'text-2xl md:text-3xl';
  };

  const getOptionFontSize = () => {
    if (totalWords > 100) return 'text-sm';
    if (totalWords > 70) return 'text-base';
    return 'text-base';
  };

  const getExplanationFontSize = () => {
    if (explanationWordCount > 80) return 'text-sm';
    if (explanationWordCount > 50) return 'text-base';
    return 'text-base';
  };

  return (
    <div className="h-screen snap-start flex flex-col relative overflow-hidden">
      <div className={`flex items-center justify-center px-6 pt-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 ${
        state.isAnswered ? 'pb-4' : 'pb-8 flex-1'
      }`}>
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <h2 className={`text-white font-bold ${getQuestionFontSize()} leading-tight text-center mb-8`}>
            {state.question.question_text}
          </h2>

          {isActive && !state.isAnswered && (
            <div className="flex items-center justify-center gap-3 text-white">
              <Clock className="w-5 h-5" />
              <span className={`text-2xl font-bold ${
                state.timeLeft <= 10 ? 'text-red-500 animate-pulse' : ''
              }`}>
                {state.timeLeft}s
              </span>
            </div>
          )}
        </div>
      </div>

      <div className={`bg-black px-4 pt-4 ${state.isAnswered ? 'pb-8 flex-1 overflow-y-auto' : 'pb-8'}`}>
        {!state.isAnswered ? (
          <div className="space-y-3 max-w-2xl mx-auto">
            {options.map((option) => {
              return (
                <button
                  key={option.key}
                  onClick={() => onAnswerSelect(index, option.key)}
                  className="w-full text-left p-4 rounded-2xl transition-all duration-300 transform active:scale-95 bg-gray-900 border-2 border-gray-800 hover:border-blue-500 active:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                      {option.key.toUpperCase()}
                    </span>
                    <span className={`flex-1 font-semibold text-white ${getOptionFontSize()}`}>{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-l-4 border-blue-500 p-6 rounded-xl backdrop-blur-sm mb-4">
            <p className="text-blue-300 text-base font-bold mb-4">
              {state.answeredCorrectly ? '✓ Correct! Keep going!' : '✗ Incorrect - Review and learn'}
            </p>
            <p className={`text-gray-200 ${getExplanationFontSize()} leading-relaxed`}>
              {state.question.explanation}
            </p>
          </div>
        )}
      </div>

      {!state.isAnswered && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(state.timeLeft / 30) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
