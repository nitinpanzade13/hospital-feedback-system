import React, { useState } from 'react';

function ExportButton({ data }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const exportToCSV = () => {
    try {
      setIsExporting(true);
      setError(null);

      if (!data || data.length === 0) {
        setError('No data to export');
        return;
      }

      // Get all keys from all objects
      const keys = Array.from(
        new Set(data.flatMap(obj => Object.keys(obj)))
      );

      // Create CSV header
      const header = keys.join(',');

      // Create CSV rows
      const rows = data.map(obj =>
        keys.map(key => {
          const value = obj[key];
          // Handle special cases
          if (value === null || value === undefined) {
            return '';
          }
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          if (typeof value === 'object') {
            return `"${JSON.stringify(value)}"`;
          }
          return value;
        }).join(',')
      );

      // Combine header and rows
      const csv = [header, ...rows].join('\n');

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `feedback-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setError(null);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    try {
      setIsExporting(true);
      setError(null);

      if (!data || data.length === 0) {
        setError('No data to export');
        return;
      }

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `feedback-export-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setError(null);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-button-group">
      <button
        onClick={exportToCSV}
        disabled={isExporting || !data || data.length === 0}
        className="btn-export btn-csv"
        title="Download feedback as CSV"
      >
        📥 CSV
      </button>
      <button
        onClick={exportToJSON}
        disabled={isExporting || !data || data.length === 0}
        className="btn-export btn-json"
        title="Download feedback as JSON"
      >
        📥 JSON
      </button>
      {error && <span className="export-error">{error}</span>}
      {isExporting && <span className="export-loading">Exporting...</span>}
    </div>
  );
}

export default ExportButton;
