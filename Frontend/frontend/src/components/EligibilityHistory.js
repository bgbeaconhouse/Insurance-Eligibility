// src/components/EligibilityHistory.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EligibilityHistory = ({ patientId, refreshTrigger }) => {
  const [history, setHistory] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchHistory();
    }
  }, [patientId, refreshTrigger]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:3000/eligibility/history/${patientId}`);
      
      if (response.data.success) {
        setHistory(response.data.history);
        setPatient(response.data.patient);
      } else {
        setError('Failed to fetch history');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch eligibility history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'danger';
      case 'Unknown': return 'warning';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading eligibility history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
        <button onClick={fetchHistory} className="btn btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="history-empty">
        <p>No eligibility history found for this patient.</p>
        <button onClick={fetchHistory} className="btn btn-secondary">
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="eligibility-history">
      {patient && (
        <div className="patient-info">
          <h4>{patient.patientName}</h4>
          <p>DOB: {formatDateOnly(patient.dateOfBirth)} | Patient ID: {patient.patientId}</p>
        </div>
      )}

      <div className="history-controls">
        <button onClick={fetchHistory} className="btn btn-secondary btn-sm">
          🔄 Refresh
        </button>
        <span className="history-count">{history.length} records found</span>
      </div>

      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Check Date</th>
              <th>Status</th>
              <th>Insurance</th>
              <th>Member #</th>
              <th>Service Date</th>
              <th>Deductible</th>
              <th>Copay</th>
              <th>Messages</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={record.eligibilityId} className={index === 0 ? 'latest-record' : ''}>
                <td>{formatDate(record.checkDateTime)}</td>
                <td>
                  <span className={`status-badge status-${getStatusColor(record.status)} small`}>
                    {record.status}
                  </span>
                </td>
                <td>{record.insuranceCompany}</td>
                <td>{record.memberNumber}</td>
                <td>{formatDateOnly(record.serviceDate)}</td>
                <td>
                  {record.coverage ? (
                    <div className="deductible-info">
                      <div>{formatCurrency(record.coverage.deductible)}</div>
                      <small>({formatCurrency(record.coverage.deductibleMet)} met)</small>
                    </div>
                  ) : 'N/A'}
                </td>
                <td>{record.coverage ? formatCurrency(record.coverage.copay) : 'N/A'}</td>
                <td>
                  {record.messages && record.messages.length > 0 ? (
                    <div className="messages-cell">
                      {record.messages.slice(0, 2).map((msg, i) => (
                        <div key={i} className="message-snippet">{msg}</div>
                      ))}
                      {record.messages.length > 2 && (
                        <small>+{record.messages.length - 2} more</small>
                      )}
                    </div>
                  ) : record.errorMessage ? (
                    <div className="error-snippet">⚠️ {record.errorMessage}</div>
                  ) : (
                    <span className="no-messages">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {history.length >= 10 && (
        <div className="history-note">
          <small>Showing most recent 10 records</small>
        </div>
      )}
    </div>
  );
};

export default EligibilityHistory;