import { useEffect, useState, useRef, type CSSProperties } from 'react';
import { useSwipeable } from 'react-swipeable';
import { api, Question, Category } from '../lib/api';
import { Settings } from 'lucide-react';
import { SettingsScreen } from './SettingsScreen';

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
}

interface QuizFeedProps {
  userId: string;
  examId?: string | null;
}

interface QuestionState {
  question: Question;
  selectedAnswer: string | null;
  showExplanation: boolean;
  timeLeft: number;
  answeredCorrectly: boolean | null;
  isAnswered: boolean;
}

export function InfiniteQuizFeed({ userId, examId }: QuizFeedProps) {
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCategoryTransitioning, setIsCategoryTransitioning] = useState(false);
  const previousCategoryRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [allowScrollWithoutAnswer, setAllowScrollWithoutAnswer] = useState(false);
  const [statementQuestionsOnly, setStatementQuestionsOnly] = useState(false);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const previousIndexRef = useRef(0);
  const [transitionDirection, setTransitionDirection] = useState<'up' | 'down'>('down');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isQuestionFadeActive, setIsQuestionFadeActive] = useState(false);
  const questionFadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFadeInitializedRef = useRef(false);

  useEffect(() => {
    const previousIndex = previousIndexRef.current;
    if (currentIndex > previousIndex) {
      setTransitionDirection('down');
    } else if (currentIndex < previousIndex) {
      setTransitionDirection('up');
    }
    previousIndexRef.current = currentIndex;
    
    if (prefersReducedMotion) {
      setIsQuestionFadeActive(false);
      if (questionFadeTimeoutRef.current) {
        clearTimeout(questionFadeTimeoutRef.current);
      }
      return;
    }

    if (!isFadeInitializedRef.current) {
      isFadeInitializedRef.current = true;
      return;
    }

    setIsQuestionFadeActive(true);
    if (questionFadeTimeoutRef.current) {
      clearTimeout(questionFadeTimeoutRef.current);
    }
    questionFadeTimeoutRef.current = setTimeout(() => {
      setIsQuestionFadeActive(false);
    }, 320);

    return () => {
      if (questionFadeTimeoutRef.current) {
        clearTimeout(questionFadeTimeoutRef.current);
      }
    };
  }, [currentIndex, prefersReducedMotion]);

  // Load categories on mount and when examId changes
  useEffect(() => {
    loadCategories();
  }, [examId]);

  useEffect(() => {
    // Check if category changed (not just filters)
    const categoryChanged = previousCategoryRef.current !== null && previousCategoryRef.current !== selectedCategory;
    const isInitialLoad = isInitialLoadRef.current;
    
    previousCategoryRef.current = selectedCategory;
    isInitialLoadRef.current = false;
    
    if (categoryChanged && !isInitialLoad) {
      // Smooth transition: don't reset immediately, load in background
      setIsCategoryTransitioning(true);
      
      // Load new questions without resetting currentIndex immediately
      loadQuestions(false, true).finally(() => {
        // After questions are loaded, smoothly scroll to top
        setTimeout(() => {
          if (containerRef.current) {
            isProgrammaticScrollRef.current = true;
            setCurrentIndex(0);
            containerRef.current.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
            setTimeout(() => {
              isProgrammaticScrollRef.current = false;
              setIsCategoryTransitioning(false);
              
              // Now scroll category button into view after transition completes
              setTimeout(() => {
                if (categoryContainerRef.current && categories.length > 0) {
                  const selectedIndex = categories.findIndex(c => c.name === selectedCategory);
                  if (selectedIndex >= 0) {
                    const buttons = categoryContainerRef.current.querySelectorAll('button');
                    const selectedButton = buttons[selectedIndex];
                    if (selectedButton) {
                      selectedButton.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                      });
                    }
                  }
                }
              }, 100);
            }, 500);
          } else {
            setIsCategoryTransitioning(false);
          }
        }, 100);
      });
    } else {
      // Initial load or just filters changed, normal load
      loadQuestions();
    }
  }, [selectedCategory, statementQuestionsOnly, difficulty]);

  // Scroll category bar to show selected category
  useEffect(() => {
    // Don't scroll during category transitions to avoid visual reset
    if (isCategoryTransitioning) return;
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (categoryContainerRef.current && categories.length > 0) {
        const selectedIndex = categories.findIndex(c => c.name === selectedCategory);
        if (selectedIndex >= 0) {
          // Find the button element for the selected category
          const buttons = categoryContainerRef.current.querySelectorAll('button');
          const selectedButton = buttons[selectedIndex];
          
          if (selectedButton) {
            // Scroll the button into view, centered if possible
            selectedButton.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
          }
        }
      }
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, categories, isCategoryTransitioning]);

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

  const loadCategories = async () => {
    try {
      const cats = await api.getCategories(examId || undefined);
      
      // Filter out categories with 0 questions (except "All")
      const categoriesWithQuestions = cats.filter(c => c.question_count > 0);
      
      // Calculate total question count for "All" category
      const totalCount = categoriesWithQuestions.reduce((sum, c) => sum + c.question_count, 0);
      
      // Only show "All" category if there are any questions
      const categoriesToShow = totalCount > 0
        ? [
            { id: 'all', name: 'all', description: 'All categories', question_count: totalCount },
            ...categoriesWithQuestions
          ]
        : [];
      
      setCategories(categoriesToShow);
      
      // If current selected category has no questions, switch to "all" or first available
      if (categoriesToShow.length > 0) {
        const currentCatExists = categoriesToShow.find(c => c.name === selectedCategory);
        if (!currentCatExists && selectedCategory !== 'all') {
          setSelectedCategory('all');
        }
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback to basic categories if API fails
      setCategories([
        { id: 'all', name: 'all', description: 'All categories', question_count: 0 }
      ]);
    }
  };

  const loadQuestions = async (isLoadMore = false, isCategoryChange = false) => {
    try {
      // Don't show loading state during category transitions for smoother UX
      if (!isLoadMore && !isCategoryChange) setLoading(true);
      else if (isLoadMore) setLoadingMore(true);

      // Get list of correctly answered question IDs
      const correctlyAnsweredIds = new Set(await api.getCorrectAnswers());

      const category = selectedCategory === 'all' ? 'all' : selectedCategory;

      // Request more questions to account for filtering
      const requestCount = isLoadMore ? 2 : 5; // Request more initially to ensure we have questions after filtering
      const { questions } = await api.generateQuestions(category, requestCount, examId || undefined);

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

        if (filteredQuestions.length === 0) {
          // All questions were filtered out - try requesting more
          if (!isLoadMore) {
            console.warn(`No questions available after filtering for category: ${category}. All questions may be answered or filtered.`);
            // Try requesting more questions
            const { questions: moreQuestions } = await api.generateQuestions(category, 10, examId || undefined);
            if (moreQuestions && moreQuestions.length > 0) {
              filteredQuestions = moreQuestions
                .filter((q: Question) => !correctlyAnsweredIds.has(q.id))
                .filter((q: Question) => !statementQuestionsOnly || q.question_format === 'statement')
                .filter((q: Question) => difficulty === 'all' || q.difficulty === difficulty);
            }
          }
        }

        if (filteredQuestions.length > 0) {
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
            // Only reset index if not a category transition (will be handled by useEffect)
            if (!isCategoryChange) {
              setCurrentIndex(0);
            }
          }
        } else {
          // No questions available after all filtering
          if (!isLoadMore) {
            setQuestionStates([]);
            if (!isCategoryChange) {
              setCurrentIndex(0);
            }
            console.warn(`No questions available for category: ${category} after filtering`);
          }
        }
      } else {
        // No questions returned from API
        if (!isLoadMore) {
          setQuestionStates([]);
          if (!isCategoryChange) {
            setCurrentIndex(0);
          }
          console.warn(`No questions returned from API for category: ${category}`);
        }
      }
    } catch (err: any) {
      console.error('Error loading questions:', err);
      if (!isLoadMore) {
        setQuestionStates([]);
        if (!isCategoryChange) {
          setCurrentIndex(0);
        }
      }
    } finally {
      if (!isCategoryChange) {
        setLoading(false);
      }
      setLoadingMore(false);
    }
  };

  const loadQuestionsInBackground = async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;

      // Get list of correctly answered question IDs
      const correctlyAnsweredIds = new Set(await api.getCorrectAnswers());

      const category = selectedCategory === 'all' ? 'all' : selectedCategory;

      const { questions } = await api.generateQuestions(category, 5, examId || undefined);

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

  const canAdvancePastQuestion = (index: number) => {
    const question = questionStates[index];
    if (!question) return false;
    return question.isAnswered || question.timeLeft <= 0;
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
        timeLeft: 0,
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
        timeLeft: 0,
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

    if (isCorrect) {
      setTimeout(() => {
        handleNextQuestion(index);
      }, 2000);
    }
  };

  const handleNextQuestion = (index: number) => {
    const canProceed = allowScrollWithoutAnswer || canAdvancePastQuestion(index);
    if (index < questionStates.length - 1 && canProceed) {
      isProgrammaticScrollRef.current = true;
      setCurrentIndex(index + 1);
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: (index + 1) * window.innerHeight,
          behavior: 'auto',
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
    
    // Task 1: Enforce "Allow Scroll Without Answer" setting
    if (!allowScrollWithoutAnswer) {
      const currentQuestion = questionStates[currentIndex];
      if (currentQuestion && !currentQuestion.isAnswered) {
        // Prevent scroll, snap back to current question
        isProgrammaticScrollRef.current = true;
        containerRef.current.scrollTo({
          top: currentIndex * window.innerHeight,
          behavior: 'smooth'
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
        return;
      }
    }
    
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / window.innerHeight);
    if (newIndex > currentIndex && !allowScrollWithoutAnswer) {
      const currentQuestion = questionStates[currentIndex];
      if (currentQuestion && !canAdvancePastQuestion(currentIndex)) {
        isProgrammaticScrollRef.current = true;
        containerRef.current.scrollTo({
          top: currentIndex * window.innerHeight,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 500);
        return;
      }
    }
    if (newIndex !== currentIndex && newIndex < questionStates.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Task 4: Category navigation swipe handlers
  // Apply to the entire header area for better swipe detection
  const categoryHandlers = useSwipeable({
    onSwipedLeft: () => {
      // Swipe left = next category
      const currentIdx = categories.findIndex(c => c.name === selectedCategory);
      if (currentIdx < categories.length - 1) {
        const nextCategory = categories[currentIdx + 1];
        setSelectedCategory(nextCategory.name);
      }
    },
    onSwipedRight: () => {
      // Swipe right = previous category
      const currentIdx = categories.findIndex(c => c.name === selectedCategory);
      if (currentIdx > 0) {
        const prevCategory = categories[currentIdx - 1];
        setSelectedCategory(prevCategory.name);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false, // Allow scrolling, but detect swipes
    delta: 80, // Minimum distance for swipe (in pixels) - increased for better detection
    swipeDuration: 500, // Maximum duration for a swipe (in ms)
  });

  // Task 10: Question navigation swipe handlers
  // Also handle horizontal swipes for category switching
  const questionHandlers = useSwipeable({
    onSwipedUp: () => {
      if (currentIndex < questionStates.length - 1) {
        const canProceed = allowScrollWithoutAnswer || canAdvancePastQuestion(currentIndex);
        if (!canProceed) {
          return; // Don't allow swipe if answer required
        }
        handleNextQuestion(currentIndex);
      }
    },
    onSwipedDown: () => {
      if (currentIndex > 0) {
        isProgrammaticScrollRef.current = true;
        setCurrentIndex(currentIndex - 1);
        if (containerRef.current) {
        containerRef.current.scrollTo({
          top: (currentIndex - 1) * window.innerHeight,
          behavior: 'auto',
        });
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 1000);
        }
      }
    },
    onSwipedLeft: () => {
      // Swipe left on content = next category
      const currentIdx = categories.findIndex(c => c.name === selectedCategory);
      if (currentIdx < categories.length - 1) {
        const nextCategory = categories[currentIdx + 1];
        setSelectedCategory(nextCategory.name);
      }
    },
    onSwipedRight: () => {
      // Swipe right on content = previous category
      const currentIdx = categories.findIndex(c => c.name === selectedCategory);
      if (currentIdx > 0) {
        const prevCategory = categories[currentIdx - 1];
        setSelectedCategory(prevCategory.name);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 80, // Minimum distance for swipe
  });

  const shouldShowQuestionFade = isQuestionFadeActive && !prefersReducedMotion;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div 
        {...categoryHandlers}
        className="fixed top-0 left-0 right-0 z-50 bg-white"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded px-3 py-1 bg-gray-50">
                <span className="text-base font-medium text-black">Score: {score}</span>
              </div>
              {streak > 1 && (
                <div className="flex items-center gap-2 bg-black text-white px-3 py-1 rounded">
                  <span className="text-sm font-medium">{streak}x</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Answered: {totalAnswered}
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded hover:bg-gray-50"
              >
                <Settings className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>

          <div
            ref={categoryContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x'
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded text-sm whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.name
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-gray-50 bg-white'
                }`}
              >
                {cat.name === 'all' ? 'All' : cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-screen">
        <div
          ref={containerRef}
          {...(() => {
            const { ref, ...handlers } = questionHandlers;
            return handlers;
          })()}
          onScroll={handleScroll}
          className={`h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide transition-opacity duration-300 ${
            isCategoryTransitioning ? 'opacity-70' : 'opacity-100'
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {!loading && questionStates.length === 0 && (
            <div className="h-screen snap-start flex items-center justify-center bg-white">
              <div className="text-center px-6">
                <h2 className="text-xl font-medium text-black mb-2">No questions available</h2>
                <p className="text-gray-600 text-sm">
                  {selectedCategory === 'all' 
                    ? "All questions have been answered or filtered out."
                    : `No questions available in "${selectedCategory === 'all' ? 'All' : selectedCategory}" category.`}
                </p>
              </div>
            </div>
          )}

          {questionStates.map((state, index) => (
            <QuestionCard
              key={`${selectedCategory}-${state.question.id}-${index}`}
              state={state}
              index={index}
              isActive={index === currentIndex}
              onAnswerSelect={handleAnswerSelect}
              transitionDirection={transitionDirection}
              prefersReducedMotion={prefersReducedMotion}
              onNextQuestion={() => handleNextQuestion(index)}
              hasNextQuestion={index < questionStates.length - 1}
            />
          ))}

          {loadingMore && (
            <div className="h-screen snap-start flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Loading more</p>
              </div>
            </div>
          )}
        </div>

        {!prefersReducedMotion && (
          <div
            className={`pointer-events-none absolute inset-0 z-40 bg-white/70 backdrop-blur-sm transition-opacity duration-500 ${
              shouldShowQuestionFade ? 'opacity-100' : 'opacity-0'
            }`}
          ></div>
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
  transitionDirection: 'up' | 'down';
  prefersReducedMotion: boolean;
  onNextQuestion: () => void;
  hasNextQuestion: boolean;
}

function QuestionCard({
  state,
  index,
  isActive,
  onAnswerSelect,
  transitionDirection,
  prefersReducedMotion,
  onNextQuestion,
  hasNextQuestion,
}: QuestionCardProps) {
  const [showLongOptionsPanel, setShowLongOptionsPanel] = useState(false);
  const [panelFocusKey, setPanelFocusKey] = useState<string | null>(null);
  const options = [
    { key: 'a', text: state.question.option_a || '' },
    { key: 'b', text: state.question.option_b || '' },
    { key: 'c', text: state.question.option_c || '' },
    { key: 'd', text: state.question.option_d || '' },
  ];
  const correctAnswerKey = (state.question.correct_answer || '').toLowerCase();
  const selectedAnswerKey = (state.selectedAnswer || '').toLowerCase();
  const OPTION_LENGTH_THRESHOLD = 220;
  const longOptions = options.filter(option => option.text.trim().length > OPTION_LENGTH_THRESHOLD);
  const displayOptions = !state.isAnswered
    ? options
    : state.answeredCorrectly
    ? []
    : options.filter(option => {
        if (!selectedAnswerKey) return option.key === correctAnswerKey;
        return option.key === correctAnswerKey || option.key === selectedAnswerKey;
      });

  const motionBase = prefersReducedMotion
    ? 'opacity-100 scale-100 translate-y-0'
    : 'transition-[transform,opacity,filter] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform opacity-100 translate-y-0';
  const inactiveOffset = prefersReducedMotion
    ? ''
    : transitionDirection === 'down'
    ? 'translate-y-16 rotate-[-1.25deg]'
    : '-translate-y-16 rotate-[1.25deg]';
  const cardMotionClasses = isActive
    ? `${motionBase} scale-100 blur-0 pointer-events-auto`
    : prefersReducedMotion
    ? 'opacity-80'
    : `opacity-0 scale-[0.95] ${inactiveOffset} blur-[2px] pointer-events-none`;

  const questionContentMotion = prefersReducedMotion
    ? 'opacity-100 translate-y-0'
    : isActive
    ? 'opacity-100 translate-y-0'
    : `opacity-0 ${transitionDirection === 'down' ? 'translate-y-8' : '-translate-y-8'}`;

  return (
    <div
      className={`h-screen snap-start flex flex-col relative overflow-hidden bg-white ${cardMotionClasses}`}
    >
      <div className={`px-4 pt-28 pb-4 sm:pt-24 sm:pb-3`}>
        <div className="w-full max-w-2xl mx-auto relative">
          <div
            className={`flex flex-col gap-3 transition-all duration-700 ${questionContentMotion}`}
          >
            <div className="space-y-2 flex-1 min-w-0 sm:pr-32">
              <div className="text-sm text-gray-600">
                Question {index + 1}
              </div>
              <h2 className="text-[14px] font-medium text-black leading-tight break-words">
                {state.question.question_text}
              </h2>
            </div>
            {isActive && !state.isAnswered && (
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto sm:absolute sm:top-0 sm:right-0 sm:flex-col sm:items-end sm:gap-1">
                <div className="text-xs uppercase tracking-wide text-gray-500 hidden sm:block">Time left</div>
                <span
                  className={`text-sm sm:text-base font-medium px-3 py-1 rounded text-center min-w-[72px] sm:min-w-[68px] ${
                    state.timeLeft <= 5
                      ? 'text-red-600 bg-red-50'
                      : state.timeLeft <= 10
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-black bg-gray-50'
                  }`}
                >
                  {state.timeLeft}s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 bg-white px-4 pt-4 sm:pt-3 ${state.isAnswered ? 'pb-16 overflow-y-auto' : 'pb-16'}`}>
        <div className="space-y-3 max-w-2xl mx-auto">
          {displayOptions.length > 0 && (
            <div className="space-y-2 pb-6">
              {displayOptions.map((option, optionIndex) => {
                const isCorrectOption = option.key === correctAnswerKey;
                const isUserSelection = option.key === selectedAnswerKey;
                const showAnswerStyles = state.isAnswered;

                let baseClasses =
                  'w-full text-left px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 text-[11px] transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg';
                let dynamicClasses = '';
                let transformStyle: CSSProperties = {};

                if (showAnswerStyles) {
                  if (isCorrectOption) {
                    dynamicClasses =
                      'bg-green-100 text-green-900 shadow-[0_20px_45px_rgba(34,197,94,0.25)] hover:shadow-[0_25px_55px_rgba(34,197,94,0.35)]';
                    transformStyle = { transform: 'perspective(800px) translateZ(25px) rotateX(1deg)' };
                  } else if (isUserSelection && !isCorrectOption) {
                    dynamicClasses =
                      'bg-red-100 text-red-900 shadow-[0_20px_45px_rgba(239,68,68,0.25)] hover:shadow-[0_25px_55px_rgba(239,68,68,0.35)]';
                    transformStyle = { transform: 'perspective(800px) translateZ(15px) rotateX(-1.5deg)' };
                  } else {
                    dynamicClasses = 'bg-gray-100 text-gray-700 opacity-70';
                    transformStyle = { transform: 'perspective(800px) translateZ(5px)' };
                  }
                }

                const needsShowMore = option.text.trim().length > OPTION_LENGTH_THRESHOLD;
                const staggerStyle: CSSProperties = {
                  ...transformStyle,
                  transitionDelay: prefersReducedMotion ? undefined : `${optionIndex * 70}ms`,
                };

                return (
                  <button
                    key={option.key}
                    onClick={() => onAnswerSelect(index, option.key)}
                    disabled={state.isAnswered}
                    className={`${baseClasses} ${dynamicClasses}`}
                    style={staggerStyle}
                  >
                    <div className="flex items-center">
                      <span className="flex-1">{option.text}</span>
                      {needsShowMore && (
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            setPanelFocusKey(option.key);
                            setShowLongOptionsPanel(true);
                          }}
                          className="text-xs font-semibold text-blue-600 underline cursor-pointer"
                        >
                          Show more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {state.isAnswered && (
            <div
              className={`rounded p-5 mt-6 transition-all duration-500 transform ${
                state.answeredCorrectly
                  ? 'bg-green-50 text-green-900 shadow-[0_20px_45px_rgba(34,197,94,0.25)]'
                  : 'bg-red-50 text-red-900 shadow-[0_20px_45px_rgba(239,68,68,0.25)]'
              }`}
              style={{
                transform: 'perspective(900px) translateZ(30px) rotateX(1deg)',
              }}
            >
              <p className="text-base font-semibold mb-3">
                {state.answeredCorrectly ? 'Perfect choice!' : 'Let’s adjust that instinct.'}
              </p>
              <p className="text-[11px] leading-relaxed">{state.question.explanation}</p>
              {hasNextQuestion && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onNextQuestion}
                    className="inline-flex items-center gap-2 rounded-full bg-black text-white text-sm font-semibold px-5 py-2 transition-colors hover:bg-gray-900"
                  >
                    Next question
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!state.isAnswered && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              state.timeLeft <= 5 
                ? 'bg-red-500' 
                : state.timeLeft <= 10 
                ? 'bg-orange-500' 
                : 'bg-gray-400'
            }`}
            style={{ width: `${(state.timeLeft / 30) * 100}%` }}
          ></div>
        </div>
      )}

      {showLongOptionsPanel && longOptions.length > 0 && (
        <div className="px-4 pb-6">
          <div className="max-w-2xl mx-auto rounded-2xl bg-white shadow-[0_25px_60px_rgba(15,23,42,0.15)] border border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-black">Full answer text</h3>
              <button
                onClick={() => setShowLongOptionsPanel(false)}
                className="text-sm text-gray-500 hover:text-black font-medium"
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
              {longOptions.map((option) => (
                <div
                  key={option.key}
                  className={`rounded-xl bg-gray-50 p-4 ${
                    panelFocusKey === option.key ? 'ring-1 ring-black shadow-lg' : ''
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Option {option.key.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{option.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
