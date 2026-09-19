import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quizService, QuizDetail } from '@/services/quizService';

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStartTime] = useState(Date.now());

  // Fetch quiz details
  const { data: quiz, isLoading } = useQuery<QuizDetail>({
    queryKey: ['quiz', quizId],
    queryFn: () => quizService.getQuiz(parseInt(quizId!)),
    enabled: !!quizId,
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: ({ questionId, answer }: { questionId: number; answer: string }) =>
      quizService.submitAnswer(parseInt(quizId!), { question_id: questionId, answer }),
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to submit answer');
    },
  });

  // Complete quiz mutation
  const completeQuizMutation = useMutation({
    mutationFn: (timeTaken: number) =>
      quizService.completeQuiz(parseInt(quizId!), { time_taken: timeTaken }),
    onSuccess: () => {
      toast.success('Quiz completed!');
      navigate(`/quiz/${quizId}/results`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to complete quiz');
    },
  });

  // Initialize timer
  useEffect(() => {
    if (quiz?.time_limit) {
      setTimeRemaining(quiz.time_limit);
    }
  }, [quiz]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleCompleteQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = async (answer: string) => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion.id]: answer });

    // Submit answer to backend
    await submitAnswerMutation.mutateAsync({
      questionId: currentQuestion.id,
      answer,
    });
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCompleteQuiz = () => {
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    completeQuizMutation.mutate(timeTaken);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz not found</h2>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold gradient-text">{quiz.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            {timeRemaining !== null && (
              <div className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                timeRemaining < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {currentQuestion.question}
            </h2>

            {/* Options */}
            <div className="space-y-4">
              {Object.entries(currentQuestion.options).map(([key, value]) => {
                const isSelected = selectedAnswers[currentQuestion.id] === key;

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswerSelect(key)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {key}
                      </span>
                      <span className="text-gray-800 flex-1">{value}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={handleCompleteQuiz}
                disabled={Object.keys(selectedAnswers).length < quiz.questions.length}
                className="btn btn-primary"
              >
                Complete Quiz
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="btn btn-primary"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Question Navigator */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Question Navigator</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {quiz.questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`aspect-square rounded-lg font-semibold text-sm transition-all ${
                      isCurrent
                        ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-gray-600">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-2" />
                Answered
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded mr-2" />
                Not Answered
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-indigo-500 rounded mr-2" />
                Current
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
