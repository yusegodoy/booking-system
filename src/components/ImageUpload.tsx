import React, { useState, useRef } from 'react';
import './ImageUpload.css';

interface ImageUploadProps {
  onImageSelect: (file: File | null, previewUrl: string | null) => void;
  currentImageUrl?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImageUrl,
  label = "Upload Image",
  accept = "image/*",
  maxSizeMB = 5
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    console.log('Validating file:', file);
    
    // Check if file exists
    if (!file) {
      setError('No file selected');
      return false;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, GIF)');
      console.error('Invalid file type:', file.type);
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      console.error('File too large:', file.size, 'bytes');
      return false;
    }

    console.log('File validation passed:', file.name, file.type, file.size);
    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    console.log('Handling file select:', file);
    
    if (!validateFile(file)) {
      console.error('File validation failed');
      return;
    }

    try {
      // Create preview URL
      const url = URL.createObjectURL(file);
      console.log('Preview URL created:', url);
      setPreviewUrl(url);
      onImageSelect(file, url);
      console.log('File selection completed successfully');
    } catch (error) {
      console.error('Error creating preview URL:', error);
      setError('Error processing image file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageSelect(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">{label}</label>
      
      <div
        className={`image-upload-area ${dragActive ? 'drag-active' : ''} ${previewUrl ? 'has-preview' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {previewUrl ? (
          <div className="image-preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            <div className="image-overlay">
              <button type="button" className="change-image-btn">
                📷 Change Image
              </button>
              <button type="button" className="remove-image-btn" onClick={handleRemove}>
                🗑️ Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              <p>Click to upload or drag and drop</p>
              <p className="upload-hint">PNG, JPG, GIF up to {maxSizeMB}MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          ⚠️ {error}
        </div>
      )}

      {currentImageUrl && !previewUrl && (
        <div className="current-image-info">
          <p>📎 Current image: {currentImageUrl}</p>
          <button type="button" onClick={handleClick} className="change-current-btn">
            Change Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;