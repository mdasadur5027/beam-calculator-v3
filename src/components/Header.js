import React, { useState } from 'react';
import AboutModal from './AboutModal';
import { exportResultsToPDF } from '../utils/exportUtils';

const Header = ({ beamData, results }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportResults = async () => {
    if (!results || !results.shearForce || results.shearForce.x.length === 0) {
      alert('No analysis results to export. Please configure the beam and run analysis first.');
      return;
    }

    setIsExporting(true);
    try {
      // Wait a moment for any pending renders to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await exportResultsToPDF(beamData, results);
      if (result.success) {
        alert(`Results exported successfully as ${result.fileName}`);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Beam Calculator</h1>
              <p className="text-sm text-gray-500">SFD, BMD & Deflection Analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleExportResults}
              disabled={isExporting}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export Results</span>
                </>
              )}
            </button>
            <button className="btn-secondary text-sm">
              Save Project
            </button>
            <button 
              onClick={() => setShowAboutModal(true)}
              className="btn-primary text-sm"
            >
              About
            </button>
          </div>
        </div>
      </header>

      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
    </>
  );
};

export default Header;