import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { quizService } from '@/services/quizService';
import { slidesService } from '@/services/slidesService';
import { mcqService } from '@/services/mcqService';

interface QuizCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuizCreationModal({ isOpen, onClose }: QuizCreationModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    slide_id: '',
    num_questions: '10',
    time_limit: '20',
  });

  // Fetch slides for dropdown
  const { data: slides } = useQuery({
    queryKey: ['slides'],
    queryFn: slidesService.getSlides,
    enabled: isOpen,
  });

  // Fetch MCQs count
  const { data: mcqs } = useQuery({
    queryKey: ['mcqs'],
    queryFn: mcqService.getAllUserMCQs,
    enabled: isOpen,
  });

  const createQuizMutation = useMutation({
    mutationFn: quizService.createQuiz,
    onSuccess: async (quiz) => {
      toast.success('Quiz created successfully!');
      onClose();
      // Start the quiz immediately
      try {
        await quizService.startQuiz(quiz.id);
        navigate(`/quiz/${quiz.id}`);
      } catch (error) {
        console.error('Error starting quiz:', error);
        toast.error('Quiz created but failed to start');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create quiz');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a quiz title');
      return;
    }

    if (!mcqs || mcqs.length === 0) {
      toast.error('No MCQs available. Please generate some MCQs first.');
      return;
    }

    const numQuestions = parseInt(formData.num_questions);
    const slideId = formData.slide_id ? parseInt(formData.slide_id) : undefined;

    // Filter MCQs by slide if selected
    const availableMCQs = slideId
      ? mcqs.filter(m => m.slide_id === slideId)
      : mcqs;

    if (availableMCQs.length < numQuestions) {
      toast.error(`Only ${availableMCQs.length} MCQs available${slideId ? ' for this document' : ''}. Please reduce the number of questions or generate more MCQs.`);
      return;
    }

    createQuizMutation.mutate({
      title: formData.title,
      slide_id: slideId,
      num_questions: numQuestions,
      time_limit: formData.time_limit ? parseInt(formData.time_limit) : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New Quiz</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quiz Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Chapter 5 Practice Quiz"
                className="input w-full"
                required
              />
            </div>

            {/* Select Document (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Document (Optional)
              </label>
              <select
                value={formData.slide_id}
                onChange={(e) => setFormData({ ...formData, slide_id: e.target.value })}
                className="input w-full"
              >
                <option value="">All Documents</option>
                {slides?.map((slide) => (
                  <option key={slide.id} value={slide.id}>
                    {slide.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.slide_id ? 'Questions from selected document only' : 'Questions from all your MCQs'}
              </p>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Questions
              </label>
              <select
                value={formData.num_questions}
                onChange={(e) => setFormData({ ...formData, num_questions: e.target.value })}
                className="input w-full"
              >
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
                <option value="15">15 questions</option>
                <option value="20">20 questions</option>
                <option value="25">25 questions</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Available MCQs: {mcqs?.length || 0} total
                {formData.slide_id && mcqs && `, ${mcqs.filter(m => m.slide_id === parseInt(formData.slide_id)).length} from selected document`}
              </p>
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <select
                value={formData.time_limit}
                onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                className="input w-full"
              >
                <option value="">No time limit</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={createQuizMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={createQuizMutation.isPending || !mcqs || mcqs.length === 0}
              >
                {createQuizMutation.isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create & Start Quiz'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
