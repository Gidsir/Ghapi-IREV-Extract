import React, { useCallback } from 'react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, disabled }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected, disabled]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        disabled ? 'border-gray-200 bg-gray-50 cursor-not-allowed' : 'border-primary hover:bg-green-50 cursor-pointer'
      }`}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer block">
        <div className="flex flex-col items-center justify-center space-y-3">
          <svg className={`w-12 h-12 ${disabled ? 'text-gray-300' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div className="text-lg font-medium text-gray-700">
            {disabled ? 'Processing...' : 'Drop EC 8A images here or click to upload'}
          </div>
          <p className="text-sm text-gray-500">Supports JPG, PNG (Batch processing supported)</p>
        </div>
      </label>
    </div>
  );
};