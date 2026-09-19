import { useQuery } from '@tanstack/react-query';
import { mcqService, MCQ } from '@/services/mcqService';
import { useState, useEffect } from 'react';

interface MCQListProps {
  slideId?: number;
}

export default function MCQList({ slideId }: MCQListProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  // Visibility state for the MCQ block
  const [mcqsVisible, setMcqsVisible] = useState<boolean>(true);

  const { data: mcqs, isLoading } = useQuery({
    queryKey: slideId ? ['mcqs', 'slide', slideId] : ['mcqs'],
    queryFn: () => slideId ? mcqService.getSlideMCQs(slideId) : mcqService.getAllUserMCQs(),
  });

  // When new MCQs arrive, automatically show the block again
  useEffect(() => {
    if (Array.isArray(mcqs) && mcqs.length > 0) {
      setMcqsVisible(true);
    }
  }, [mcqs]);

  const handleAnswerSelect = (mcqId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [mcqId]: answer }));
    setShowExplanations(prev => ({ ...prev, [mcqId]: true }));
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  // If there are no MCQs at all, show the "No MCQs yet" card
  if (!mcqs || mcqs.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No MCQs yet</h3>
          <p className="text-gray-500">Generate MCQs from your documents to start practicing!</p>
        </div>
      </div>
    );
  }

  // If MCQs exist but the user cleared them, vanish (render nothing)
  if (!mcqsVisible) {
    return null;
  }

  return (
    <div className="card">
      {/* Clear button to hide the MCQs block */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setMcqsVisible(false)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Clear MCQs
        </button>
      </div>

      <h3 className="text-xl font-bold mb-6 text-gray-800">Practice Questions</h3>

      <div className="space-y-6">
        {mcqs.map((mcq: MCQ, index: number) => {
          const isAnswered = selectedAnswers[mcq.id] !== undefined;
          const isCorrect = selectedAnswers[mcq.id] === mcq.correct_answer;

          return (
            <div key={mcq.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-4">{mcq.question}</h4>

                  <div className="space-y-2">
                    {Object.entries(mcq.options).map(([key, value]) => {
                      const isSelected = selectedAnswers[mcq.id] === key;
                      const isCorrectAnswer = key === mcq.correct_answer;

                      let optionClasses = "p-4 rounded-lg border-2 transition-all cursor-pointer ";

                      if (isAnswered) {
                        if (isCorrectAnswer) {
                          optionClasses += "border-green-500 bg-green-50 ";
                        } else if (isSelected && !isCorrect) {
                          optionClasses += "border-red-500 bg-red-50 ";
                        } else {
                          optionClasses += "border-gray-200 bg-white ";
                        }
                      } else {
                        optionClasses += "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 ";
                      }

                      return (
                        <div
                          key={key}
                          className={optionClasses}
                          onClick={() => !isAnswered && handleAnswerSelect(mcq.id, key)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center font-semibold text-sm">
                              {key}
                            </span>
                            <span className="flex-1">{value}</span>
                            {isAnswered && isCorrectAnswer && (
                              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {isAnswered && isSelected && !isCorrect && (
                              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {showExplanations[mcq.id] && (
                    <div className={`mt-4 p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                      <div className="flex items-start gap-2">
                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCorrect ? 'text-green-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className={`font-semibold mb-1 ${isCorrect ? 'text-green-800' : 'text-blue-800'}`}>
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                          </p>
                          <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-blue-700'}`}>
                            {mcq.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                <span className={`px-2 py-1 rounded ${
                  mcq.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  mcq.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {mcq.difficulty.charAt(0).toUpperCase() + mcq.difficulty.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
