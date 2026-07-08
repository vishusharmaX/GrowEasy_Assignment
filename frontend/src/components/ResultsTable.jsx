import { useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Download, RotateCcw, ShieldCheck, ShieldAlert } from 'lucide-react';

const COLUMN_WIDTHS = {
  created_at: 180,
  name: 150,
  email: 220,
  country_code: 80,
  mobile_without_country_code: 160,
  crm_status: 200,
  data_source: 160,
  company: 150,
  city: 120,
  state: 120,
  country: 120,
  lead_owner: 120,
  possession_time: 140,
  crm_note: 250,
  description: 300,
};

const COLUMNS = Object.keys(COLUMN_WIDTHS);
const TOTAL_TABLE_WIDTH = Object.values(COLUMN_WIDTHS).reduce((sum, width) => sum + width, 0);

export default function ResultsTable({ results, onReset }) {
  const { records = [], skipped = [] } = results;
  const [activeTab, setActiveTab] = useState('imported'); // 'imported' | 'skipped'

  const exportToCsv = () => {
    if (records.length === 0) return;

    // Create CSV content
    const csvHeaders = COLUMNS.join(',');
    const csvRows = records.map((record) => {
      return COLUMNS.map((col) => {
        let value = record[col];
        if (col === 'created_at' && value) {
          value = new Date(value).toISOString();
        }
        const valStr = value !== undefined && value !== null ? String(value) : '';
        // Escape quotes
        const escaped = valStr.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `groweasy_imported_crm_leads_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="results-container">
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'imported' ? 'active' : ''}`}
          onClick={() => setActiveTab('imported')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} />
            Imported Leads ({records.length})
          </span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`}
          onClick={() => setActiveTab('skipped')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            Skipped Rows ({skipped.length})
          </span>
        </button>
      </div>

      {activeTab === 'imported' ? (
        records.length === 0 ? (
          <div className="empty-state">
            <p>No leads were successfully imported.</p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              CRM Mapped Leads List (Virtualized Scroll)
            </h3>
            
            <div className="table-wrapper">
              <div style={{ width: TOTAL_TABLE_WIDTH }}>
                {/* Fixed Virtual Table Header */}
                <div className="vt-header">
                  {COLUMNS.map((col) => (
                    <div 
                      key={col} 
                      className="vt-header-cell" 
                      style={{ width: COLUMN_WIDTHS[col], flexShrink: 0 }}
                    >
                      {col.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  ))}
                </div>
                
                {/* Virtualized Rows List */}
                <List
                  height={380}
                  itemCount={records.length}
                  itemSize={48}
                  width={TOTAL_TABLE_WIDTH}
                >
                  {({ index, style }) => {
                    const record = records[index];
                    return (
                      <div 
                        className="vt-row" 
                        style={{ ...style, width: TOTAL_TABLE_WIDTH, display: 'flex' }}
                      >
                        {COLUMNS.map((col) => {
                          let value = record[col];
                          if (col === 'created_at' && value) {
                            value = new Date(value).toLocaleDateString() + ' ' + new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          }
                          const displayVal = value !== undefined && value !== null ? String(value) : '';
                          
                          return (
                            <div 
                              key={col} 
                              className="vt-cell" 
                              style={{ width: COLUMN_WIDTHS[col], flexShrink: 0 }}
                              title={displayVal}
                            >
                              {col === 'crm_status' && displayVal ? (
                                <span className={`badge ${
                                  displayVal === 'GOOD_LEAD_FOLLOW_UP' ? 'badge-success' : 
                                  displayVal === 'SALE_DONE' ? 'badge-success' : 
                                  displayVal === 'BAD_LEAD' ? 'badge-error' : 'badge-warning'
                                }`} style={{ fontSize: '0.7rem' }}>
                                  {displayVal.replace(/_/g, ' ')}
                                </span>
                              ) : col === 'data_source' && displayVal ? (
                                <span className="badge badge-warning" style={{ fontSize: '0.7rem', textTransform: 'none' }}>
                                  {displayVal}
                                </span>
                              ) : (
                                displayVal
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                </List>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Skipped / Invalid list view */
        skipped.length === 0 ? (
          <div className="empty-state">
            <p>No rows were skipped. Perfect mapping!</p>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 600 }}>
              Skipped Leads Reason Log
            </h3>
            <div className="table-wrapper">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>CSV Row Index</th>
                    <th>Reason / Validation Failure</th>
                  </tr>
                </thead>
                <tbody>
                  {skipped.map((skip, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {skip.rowIndex + 1}
                      </td>
                      <td style={{ color: 'var(--error)', fontWeight: 500 }}>
                        <span className="badge badge-error" style={{ marginRight: '0.5rem', fontSize: '0.7rem' }}>
                          Skipped
                        </span>
                        {skip.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      <div className="action-bar">
        <button className="btn btn-secondary" onClick={onReset}>
          <RotateCcw size={18} />
          Start New Import
        </button>
        
        {activeTab === 'imported' && records.length > 0 && (
          <button className="btn btn-primary" onClick={exportToCsv}>
            <Download size={18} />
            Export Mapped CSV
          </button>
        )}
      </div>
    </div>
  );
}
