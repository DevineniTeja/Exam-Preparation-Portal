import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizService, QuizDetail } from '@/services/quizService';

export default function QuizResultsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const { data: quiz, isLoading } = useQuery<QuizDetail>({
    queryKey: ['quiz', quizId],
    queryFn: () => quizService.getQuiz(parseInt(quizId!)),
    enabled: !!quizId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading results...</div>
      </div>
    );
  }

  if (!quiz || !quiz.is_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Results not available</h2>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const correctAnswers = quiz.questions.filter(q => q.is_correct).length;
  const score = quiz.score || 0;
  const timeTaken = quiz.time_taken || 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! Outstanding performance!';
    if (score >= 80) return 'Great job! You did very well!';
    if (score >= 70) return 'Good work! Keep it up!';
    if (score >= 60) return 'Not bad! Room for improvement.';
    return 'Keep studying! You can do better!';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold gradient-text">Quiz Results</h1>
          <p className="text-gray-600 mt-1">{quiz.title}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Card */}
        <div className="card p-8 mb-8 text-center bg-gradient-to-br from-white to-indigo-50">
          <div className={`text-7xl font-bold mb-4 ${getScoreColor(score)}`}>
            {score.toFixed(0)}%
          </div>
          <p className="text-2xl font-semibold text-gray-800 mb-2">{getScoreMessage(score)}</p>
          <p className="text-gray-600">
            You answered {correctAnswers} out of {quiz.total_questions} questions correctly
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center bg-gradient-to-br from-green-50 to-green-100">
            <div className="text-4xl font-bold text-green-600 mb-2">{correctAnswers}</div>
            <div className="text-sm text-green-700 font-semibold">Correct Answers</div>
          </div>
          <div className="card p-6 text-center bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {quiz.total_questions - correctAnswers}
            </div>
            <div className="text-sm text-red-700 font-semibold">Incorrect Answers</div>
          </div>
          <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-4xl font-bold text-blue-600 mb-2">{formatTime(timeTaken)}</div>
            <div className="text-sm text-blue-700 font-semibold">Time Taken</div>
          </div>
        </div>

        {/* Question Review */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Question Review</h2>
          <div className="space-y-6">
            {quiz.questions.map((question, idx) => (
              <div
                key={question.id}
                className={`p-6 rounded-lg border-2 ${
                  question.is_correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-3">{question.question}</p>

                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      {Object.entries(question.options).map(([key, value]) => {
                        const isUserAnswer = question.user_answer === key;
                        const isCorrectAnswer = question.mcq_id && key === question.options[question.user_answer as keyof typeof question.options];

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg ${
                              isCorrectAnswer && question.is_correct
                                ? 'bg-green-200 border-2 border-green-400'
                                : isUserAnswer && !question.is_correct
                                ? 'bg-red-200 border-2 border-red-400'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <span className="font-semibold mr-2">{key}.</span>
                            {value}
                            {isUserAnswer && (
                              <span className="ml-2 text-sm font-semibold">
                                (Your answer)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Result Badge */}
                    <div className="flex items-center gap-2">
                      {question.is_correct ? (
                        <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-semibold rounded-full flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Correct
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-200 text-red-800 text-sm font-semibold rounded-full flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Incorrect
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary flex-1"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary flex-1"
          >
            Review Again
          </button>
        </div>
      </main>
    </div>
  );
}
