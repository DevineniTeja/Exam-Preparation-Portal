import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { slidesService, Slide } from '@/services/slidesService';
import { mcqService } from '@/services/mcqService';
import { useState } from 'react';

export default function SlidesList() {
  const queryClient = useQueryClient();
  const [generatingSlideId, setGeneratingSlideId] = useState<number | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<number | null>(null);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<string>('10');
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');

  const { data: slides, isLoading } = useQuery({
    queryKey: ['slides'],
    queryFn: slidesService.getSlides,
  });

  const deleteMutation = useMutation({
    mutationFn: slidesService.deleteSlide,
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['slides'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete document');
    },
  });

  const generateMCQsMutation = useMutation({
    mutationFn: mcqService.generateMCQs,
    onSuccess: (data) => {
      toast.success(`Generated ${data.num_generated} MCQs successfully!`);
      setGeneratingSlideId(null);
      setShowConfigModal(null);
      queryClient.invalidateQueries({ queryKey: ['mcqs'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate MCQs');
      setGeneratingSlideId(null);
    },
  });

  const handleDelete = (slideId: number, fileName: string) => {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteMutation.mutate(slideId);
    }
  };

  const handleGenerateMCQs = (slideId: number) => {
    const numQuestions = selectedQuestionCount === 'custom'
      ? parseInt(customQuestionCount) || 10
      : parseInt(selectedQuestionCount);

    if (numQuestions < 1 || numQuestions > 100) {
      toast.error('Please enter a number between 1 and 100');
      return;
    }

    setGeneratingSlideId(slideId);
    generateMCQsMutation.mutate({
      slide_id: slideId,
      num_questions: numQuestions,
      difficulty: 'medium',
    });
  };

  const openConfigModal = (slideId: number) => {
    setShowConfigModal(slideId);
    setSelectedQuestionCount('10');
    setCustomQuestionCount('');
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, { color: string; bg: string }> = {
      '.pdf': { color: 'text-red-600', bg: 'bg-red-100' },
      '.pptx': { color: 'text-orange-600', bg: 'bg-orange-100' },
      '.docx': { color: 'text-blue-600', bg: 'bg-blue-100' },
    };

    const iconStyle = icons[fileType] || { color: 'text-gray-600', bg: 'bg-gray-100' };

    return (
      <div className={`p-3 ${iconStyle.bg} rounded-xl`}>
        <svg className={`w-8 h-8 ${iconStyle.color}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No documents yet</h3>
          <p className="text-gray-500">Upload your first study material to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Your Documents</h3>

      <div className="space-y-3">
        {slides.map((slide: Slide) => (
          <div
            key={slide.id}
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <div className="flex items-center gap-4 flex-1">
              {getFileIcon(slide.file_type)}

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 truncate">{slide.title}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-gray-500">{slide.file_name}</p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-500">{slide.num_pages} pages</p>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-500">{formatDate(slide.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openConfigModal(slide.id)}
                disabled={generatingSlideId === slide.id}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Generate MCQs"
              >
                {generatingSlideId === slide.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Generate MCQs
                  </>
                )}
              </button>
              <button
                onClick={() => handleDelete(slide.id, slide.file_name)}
                disabled={deleteMutation.isPending}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* MCQ Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowConfigModal(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Generate MCQs</h3>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Questions
                </label>
                <select
                  value={selectedQuestionCount}
                  onChange={(e) => setSelectedQuestionCount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                  <option value="custom">Custom number</option>
                </select>
              </div>

              {selectedQuestionCount === 'custom' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Custom Number (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customQuestionCount}
                    onChange={(e) => setCustomQuestionCount(e.target.value)}
                    placeholder="Enter number of questions"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfigModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGenerateMCQs(showConfigModal)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
