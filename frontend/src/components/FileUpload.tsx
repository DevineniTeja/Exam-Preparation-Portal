import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { slidesService } from '@/services/slidesService';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => slidesService.uploadDocument(file, setUploadProgress),
    onSuccess: (data) => {
      toast.success(`${data.file_name} uploaded successfully! ${data.num_chunks} chunks created.`);
      setSelectedFile(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['slides'] });
      if (onUploadComplete) onUploadComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Upload failed');
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (file: File) => {
    const validTypes = ['.pdf', '.pptx', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(fileExt)) {
      toast.error('Invalid file type. Please upload PDF, PPTX, or DOCX files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Upload Study Material</h3>

      {/* Drag and Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {selectedFile ? (
            <div className="w-full">
              <p className="text-lg font-semibold text-gray-700 mb-2">{selectedFile.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>

              {uploadMutation.isPending ? (
                <div className="w-full">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                </div>
              ) : (
                <div className="flex gap-3 justify-center mt-4">
                  <button onClick={handleUpload} className="btn btn-primary">
                    Upload
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drag and drop your file here
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">
                Supported formats: PDF, PPTX, DOCX (Max 50MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* File Type Icons */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <svg className="w-8 h-8 mx-auto text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          <p className="text-xs font-semibold text-red-600">PDF</p>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <svg className="w-8 h-8 mx-auto text-orange-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          <p className="text-xs font-semibold text-orange-600">PPTX</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <svg className="w-8 h-8 mx-auto text-blue-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
          <p className="text-xs font-semibold text-blue-600">DOCX</p>
        </div>
      </div>
    </div>
  );
}
