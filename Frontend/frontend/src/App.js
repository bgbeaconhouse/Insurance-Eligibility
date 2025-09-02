// src/App.js
import React, { useState } from 'react';
import EligibilityForm from './components/EligibilityForm';
import EligibilityResults from './components/EligibilityResults';
import EligibilityHistory from './components/EligibilityHistory';
import './App.css';

function App() {
  const [currentResult, setCurrentResult] = useState(null);
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleEligibilityResult = (result, patientId) => {
    setCurrentResult(result);
    setCurrentPatientId(patientId);
    // Trigger history refresh
    setRefreshHistory(prev => prev + 1);
  };

  const handleViewHistory = (patientId) => {
    setCurrentPatientId(patientId);
    setCurrentResult(null); // Clear current result when viewing history
  };

  const handleClearAll = () => {
    setCurrentResult(null);
    setCurrentPatientId(null);
    setRefreshHistory(0);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Insurance Eligibility Verification System</h1>
        <p>Healthcare Provider Portal</p>
      </header>

      <main className="App-main">
        <div className="container">
          {/* Eligibility Check Form */}
          <section className="form-section">
            <h2>Check Patient Eligibility</h2>
            <EligibilityForm 
              onResult={handleEligibilityResult}
              onViewHistory={handleViewHistory}
              onClearAll={handleClearAll}
            />
          </section>

          {/* Current Results */}
          {currentResult && (
            <section className="results-section">
              <h2>Eligibility Results</h2>
              <EligibilityResults result={currentResult} />
            </section>
          )}

          {/* Patient History */}
          {currentPatientId && (
            <section className="history-section">
              <h2>Eligibility History for Patient {currentPatientId}</h2>
              <EligibilityHistory 
                patientId={currentPatientId} 
                refreshTrigger={refreshHistory}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;