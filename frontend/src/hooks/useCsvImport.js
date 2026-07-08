import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { uploadCsvFile, fetchBatchStatus } from '../api/importApi';

export const STEPS = {
  UPLOAD: 'UPLOAD',
  PREVIEW: 'PREVIEW',
  CONFIRM: 'CONFIRM',
  RESULTS: 'RESULTS'
};

export const useCsvImport = () => {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [file, setFile] = useState(null);
  
  // Client-side preview parsed data
  const [previewData, setPreviewData] = useState({ headers: [], rows: [] });
  
  // Import tracking state
  const [batchId, setBatchId] = useState('');
  const [importStatus, setImportStatus] = useState('idle'); // idle, processing, completed, failed
  const [errorMessage, setErrorMessage] = useState('');
  
  // Live progress indicators
  const [progressDetails, setProgressDetails] = useState({
    totalRows: 0,
    totalImported: 0,
    totalSkipped: 0,
    status: 'idle',
    percent: 0,
  });

  // Final processed logs
  const [results, setResults] = useState({
    records: [],
    skipped: []
  });

  const pollIntervalRef = useRef(null);

  // Clean up polling timer if component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  /**
   * Resets import wizard to step 1
   */
  const resetImport = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    setStep(STEPS.UPLOAD);
    setFile(null);
    setPreviewData({ headers: [], rows: [] });
    setBatchId('');
    setImportStatus('idle');
    setErrorMessage('');
    setProgressDetails({
      totalRows: 0,
      totalImported: 0,
      totalSkipped: 0,
      status: 'idle',
      percent: 0,
    });
    setResults({ records: [], skipped: [] });
  };

  /**
   * Parse CSV on client-side for step 2 preview.
   * Does NOT call backend.
   */
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Please select a valid CSV (.csv) file.');
      return;
    }

    setErrorMessage('');
    setFile(selectedFile);

    // Client-side PapaParse
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      preview: 50, // Preview first 50 rows for performance
      complete: (results) => {
        const headers = results.meta.fields || [];
        setPreviewData({
          headers,
          rows: results.data
        });
        setStep(STEPS.PREVIEW);
      },
      error: (err) => {
        setErrorMessage(`Error parsing file: ${err.message}`);
      }
    });
  };

  /**
   * Starts background extraction polling.
   */
  const startPolling = (id) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const data = await fetchBatchStatus(id);
        
        const totalProcessed = data.totalImported + data.totalSkipped;
        const totalRows = data.totalRows || 1;
        const percent = Math.min(Math.round((totalProcessed / totalRows) * 100), 100);

        setProgressDetails({
          totalRows: data.totalRows,
          totalImported: data.totalImported,
          totalSkipped: data.totalSkipped,
          status: data.status,
          percent
        });

        if (data.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          setImportStatus('completed');
          setResults({
            records: data.records,
            skipped: data.skipped
          });
          setStep(STEPS.RESULTS);
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          setImportStatus('failed');
          setErrorMessage(data.errorMessage || 'AI extraction batch processing failed.');
        }
      } catch (err) {
        clearInterval(pollIntervalRef.current);
        setImportStatus('failed');
        setErrorMessage(err.message || 'Error occurred while querying batch status.');
      }
    }, 1500);
  };

  /**
   * Upload CSV file to backend to start AI processing.
   */
  const confirmAndImport = async () => {
    if (!file) {
      setErrorMessage('No file available to import.');
      return;
    }

    try {
      setErrorMessage('');
      setImportStatus('processing');
      setStep(STEPS.CONFIRM);
      
      const initialDetails = await uploadCsvFile(file);
      setBatchId(initialDetails.batchId);
      
      // Update starting progress
      setProgressDetails({
        totalRows: initialDetails.totalRows,
        totalImported: 0,
        totalSkipped: 0,
        status: 'processing',
        percent: 0
      });

      // Begin checking progress every 1.5s
      startPolling(initialDetails.batchId);
    } catch (err) {
      setImportStatus('failed');
      setErrorMessage(err.message || 'An error occurred during file upload.');
    }
  };

  return {
    step,
    file,
    previewData,
    batchId,
    importStatus,
    errorMessage,
    progressDetails,
    results,
    setStep,
    handleFileSelect,
    confirmAndImport,
    resetImport
  };
};
