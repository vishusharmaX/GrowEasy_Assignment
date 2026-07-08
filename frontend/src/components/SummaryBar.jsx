import { FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SummaryBar({ totalRows, totalImported, totalSkipped }) {
  return (
    <div className="summary-bar">
      <div className="summary-card">
        <div className="summary-card-icon blue">
          <FileSpreadsheet size={24} />
        </div>
        <div className="summary-card-info">
          <div className="summary-card-value">{totalRows}</div>
          <div className="summary-card-label">Total Leads Extracted</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card-icon green">
          <CheckCircle2 size={24} />
        </div>
        <div className="summary-card-info">
          <div className="summary-card-value" style={{ color: 'var(--success)' }}>
            {totalImported}
          </div>
          <div className="summary-card-label">Imported to CRM</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-card-icon red">
          <AlertTriangle size={24} />
        </div>
        <div className="summary-card-info">
          <div className="summary-card-value" style={{ color: 'var(--error)' }}>
            {totalSkipped}
          </div>
          <div className="summary-card-label">Skipped Leads</div>
        </div>
      </div>
    </div>
  );
}
