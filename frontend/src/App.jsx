import { useCsvImport, STEPS } from './hooks/useCsvImport';
import DarkModeToggle from './components/DarkModeToggle';
import UploadZone from './components/UploadZone';
import CsvPreviewTable from './components/CsvPreviewTable';
import ProgressIndicator from './components/ProgressIndicator';
import SummaryBar from './components/SummaryBar';
import ResultsTable from './components/ResultsTable';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const {
    step,
    file,
    previewData,
    errorMessage,
    progressDetails,
    results,
    handleFileSelect,
    confirmAndImport,
    resetImport
  } = useCsvImport();

  // Wizard bar percentages
  const getProgressWidth = () => {
    switch (step) {
      case STEPS.UPLOAD: return '0%';
      case STEPS.PREVIEW: return '33.33%';
      case STEPS.CONFIRM: return '66.66%';
      case STEPS.RESULTS: return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="header">
        <div className="logo-section">
          <span className="logo-icon">🌱</span>
          <div>
            <h1 className="logo-title">GrowEasy</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              AI-Powered CSV Importer
            </p>
          </div>
        </div>
        <DarkModeToggle />
      </header>

      {/* Wizard Progress Stepper */}
      <div className="wizard-steps">
        <div className="wizard-progress-bar" style={{ width: getProgressWidth() }}></div>
        
        <div className={`step-node ${step === STEPS.UPLOAD ? 'active' : ''} ${step !== STEPS.UPLOAD ? 'completed' : ''}`}>
          <div className="step-bubble">1</div>
          <span className="step-label">Upload</span>
        </div>

        <div className={`step-node ${step === STEPS.PREVIEW ? 'active' : ''} ${[STEPS.CONFIRM, STEPS.RESULTS].includes(step) ? 'completed' : ''}`}>
          <div className="step-bubble">2</div>
          <span className="step-label">Preview</span>
        </div>

        <div className={`step-node ${step === STEPS.CONFIRM ? 'active' : ''} ${step === STEPS.RESULTS ? 'completed' : ''}`}>
          <div className="step-bubble">3</div>
          <span className="step-label">AI Mapping</span>
        </div>

        <div className={`step-node ${step === STEPS.RESULTS ? 'active' : ''}`}>
          <div className="step-bubble">4</div>
          <span className="step-label">CRM Output</span>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && step !== STEPS.CONFIRM && (
        <div className="error-banner glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <div style={{ flexGrow: 1 }}>
            <strong>Import Error:</strong> {errorMessage}
          </div>
          <button className="btn btn-secondary" onClick={resetImport} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={12} />
            Reset
          </button>
        </div>
      )}

      {/* Main Wizard Area */}
      <main className="glass-card">
        {step === STEPS.UPLOAD && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Upload Arbitrary Leads</h2>
              <p style={{ color: 'var(--text-secondary)', maxW: '600px', margin: '0 auto' }}>
                Upload any Excel or CSV dump from Facebook, Google Ads, or custom exports. 
                GrowEasy AI will map fields, clean numbers, and format entries to your exact CRM schema automatically.
              </p>
            </div>
            <UploadZone onFileSelect={handleFileSelect} />
          </div>
        )}

        {step === STEPS.PREVIEW && (
          <CsvPreviewTable
            file={file}
            previewData={previewData}
            onConfirm={confirmAndImport}
            onCancel={resetImport}
          />
        )}

        {step === STEPS.CONFIRM && (
          <ProgressIndicator
            progressDetails={progressDetails}
            filename={file?.name}
          />
        )}

        {step === STEPS.RESULTS && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Import Completed</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Successfully parsed and integrated records into CRM.
                </p>
              </div>
            </div>
            
            <SummaryBar
              totalRows={progressDetails.totalRows}
              totalImported={progressDetails.totalImported}
              totalSkipped={progressDetails.totalSkipped}
            />
            
            <ResultsTable
              results={results}
              onReset={resetImport}
            />
          </div>
        )}
      </main>
    </div>
  );
}
