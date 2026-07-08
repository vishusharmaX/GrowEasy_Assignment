import { useState, useRef } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';

export default function UploadZone({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Constants
  const MAX_SIZE_MB = 10;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const validateAndSelectFile = (file) => {
    if (!file) return;

    // Check extension
    if (!file.name.endsWith('.csv')) {
      setError('Invalid file type. Only CSV files (.csv) are accepted.');
      return;
    }

    // Check file size limit
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File is too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setError('');
    onFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="upload-container">
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div 
        className={`dropzone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          accept=".csv"
          onChange={handleChange}
        />
        
        <div className="dropzone-icon">
          <UploadCloud size={48} style={{ margin: '0 auto' }} />
        </div>
        
        <p className="dropzone-text">
          Drag and drop your leads CSV file here, or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span>
        </p>
        <p className="dropzone-sub">
          Only standard CSV files up to {MAX_SIZE_MB}MB are supported
        </p>
      </div>
    </div>
  );
}
