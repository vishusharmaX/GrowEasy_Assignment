import { Loader2 } from 'lucide-react';

export default function ProgressIndicator({ progressDetails, filename }) {
  const { totalRows, totalImported, totalSkipped, status, percent } = progressDetails;
  const processedCount = totalImported + totalSkipped;

  return (
    <div className="progress-card">
      <div className="spinner"></div>
      
      <h2 className="progress-header" style={{ fontWeight: 600 }}>
        AI Lead Mapping in Progress
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        Currently processing <strong>{filename}</strong> using Google Gemini AI.
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 500 }}>
        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
        <span>Chunk-by-chunk schema matching...</span>
      </div>

      <div className="progress-track">
        <div 
          className="progress-fill" 
          style={{ width: `${percent}%` }}
        ></div>
      </div>

      <div className="progress-details">
        <span>{percent}% Completed</span>
        <span>
          {processedCount} of {totalRows} rows processed
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
            {totalImported}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>
            Imported
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--warning)' }}>
            {totalSkipped}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase' }}>
            Skipped
          </div>
        </div>
      </div>
    </div>
  );
}
