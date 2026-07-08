import { FileSpreadsheet, ArrowRight, X } from 'lucide-react';

export default function CsvPreviewTable({ file, previewData, onConfirm, onCancel }) {
  const { headers, rows } = previewData;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="preview-container">
      <div className="file-info-card" style={{ marginBottom: '2rem', marginTop: 0 }}>
        <div className="file-info-details">
          <div className="file-info-icon">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div className="file-info-name">{file?.name}</div>
            <div className="file-info-size">
              {formatFileSize(file?.size || 0)} • {rows.length} rows detected • {headers.length} columns
            </div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '0.5rem' }}>
          <X size={18} />
        </button>
      </div>

      <div className="columns-indicator" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Detected CSV Headers ({headers.length}):
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {headers.map((h, i) => (
            <span key={i} className="badge badge-warning" style={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.8rem' }}>
              {h}
            </span>
          ))}
        </div>
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', fontWeight: 600 }}>
        Raw Data Preview (showing first 15 rows)
      </h3>
      
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Row</th>
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 15).map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{rowIdx + 1}</td>
                {headers.map((header, colIdx) => (
                  <td key={colIdx} title={row[header]}>
                    {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-bar">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel & Upload New
        </button>
        <button className="btn btn-primary" onClick={onConfirm}>
          Confirm & Import Leads
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
