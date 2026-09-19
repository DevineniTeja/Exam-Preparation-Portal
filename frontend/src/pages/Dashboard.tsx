import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FileUpload from '@/components/FileUpload';
import SlidesList from '@/components/SlidesList';
import MCQList from '@/components/MCQList';
import QuizCreationModal from '@/components/QuizCreationModal';
import { slidesService } from '@/services/slidesService';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Fetch slides for stats
  const { data: slides } = useQuery({
    queryKey: ['slides'],
    queryFn: slidesService.getSlides,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  Exam Assistant
                </h1>
                <p className="text-xs text-gray-500">Your AI Study Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-700">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary text-sm px-4 py-2">
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.full_name || user?.username}!
          </h2>
          <p className="text-gray-600">Ready to ace your exams? Let's get started.</p>
        </div>

        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FileUpload />
          <SlidesList />
        </div>

        {/* MCQ Practice Section */}
        <div className="mb-8">
          <MCQList />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Generate MCQs Card */}
          <div className="card card-hover group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-full">Coming Soon</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Generate MCQs</h2>
            <p className="text-gray-600 mb-4">
              Create smart practice questions from your study materials
            </p>
            <button className="btn btn-primary w-full">
              Generate Questions
            </button>
          </div>

          {/* Take Quiz Card */}
          <div className="card card-hover group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full">New</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Take Quiz</h2>
            <p className="text-gray-600 mb-4">
              Test your knowledge with adaptive interactive quizzes
            </p>
            <button
              onClick={() => setShowQuizModal(true)}
              className="btn btn-primary w-full"
            >
              Start Quiz
            </button>
          </div>

          {/* Chat with Documents Card */}
          <div className="card card-hover group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">Coming Soon</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Ask Questions</h2>
            <p className="text-gray-600 mb-4">
              Chat with your documents using advanced AI
            </p>
            <button className="btn btn-primary w-full">
              Start Conversation
            </button>
          </div>

          {/* Analytics Card */}
          <div className="card card-hover group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full">Coming Soon</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">View Progress</h2>
            <p className="text-gray-600 mb-4">
              Track your study progress and performance analytics
            </p>
            <button className="btn btn-primary w-full">
              View Analytics
            </button>
          </div>

          {/* Research Card */}
          <div className="card card-hover group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full">Coming Soon</span>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Research Assistant</h2>
            <p className="text-gray-600 mb-4">
              Extract and analyze content from websites and articles
            </p>
            <button className="btn btn-primary w-full">
              Research
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600 font-semibold mb-1">Total Documents</div>
                  <div className="text-4xl font-bold text-blue-700">{slides?.length || 0}</div>
                </div>
                <div className="p-3 bg-blue-200 rounded-xl">
                  <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-600 font-semibold mb-1">Quizzes Taken</div>
                  <div className="text-4xl font-bold text-green-700">0</div>
                </div>
                <div className="p-3 bg-green-200 rounded-xl">
                  <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-600 font-semibold mb-1">MCQs Generated</div>
                  <div className="text-4xl font-bold text-purple-700">0</div>
                </div>
                <div className="p-3 bg-purple-200 rounded-xl">
                  <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-orange-600 font-semibold mb-1">Average Score</div>
                  <div className="text-4xl font-bold text-orange-700">0%</div>
                </div>
                <div className="p-3 bg-orange-200 rounded-xl">
                  <svg className="w-8 h-8 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Creation Modal */}
      <QuizCreationModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />
    </div>
  );
}
