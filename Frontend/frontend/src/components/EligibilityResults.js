
import React from 'react';

const EligibilityResults = ({ result }) => {
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

  return (
    <div className="eligibility-results">
      <div className="result-header">
        <div className={`status-badge status-${getStatusColor(result.status)}`}>
          {result.status}
        </div>
        <div className="result-meta">
          <p><strong>Eligibility ID:</strong> {result.eligibilityId}</p>
          <p><strong>Check Time:</strong> {formatDate(result.checkDateTime)}</p>
        </div>
      </div>

      <div className="result-details">
        <div className="detail-section">
          <h4>Patient Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Patient ID:</label>
              <span>{result.patientId}</span>
            </div>
            <div className="detail-item">
              <label>Member Number:</label>
              <span>{result.memberNumber}</span>
            </div>
            <div className="detail-item">
              <label>Insurance Company:</label>
              <span>{result.insuranceCompany}</span>
            </div>
          </div>
        </div>

        {result.coverage && (
          <div className="detail-section">
            <h4>Coverage Details</h4>
            <div className="coverage-grid">
              <div className="coverage-item">
                <label>Deductible:</label>
                <span>{formatCurrency(result.coverage.deductible)}</span>
              </div>
              <div className="coverage-item">
                <label>Deductible Met:</label>
                <span>{formatCurrency(result.coverage.deductibleMet)}</span>
              </div>
              <div className="coverage-item">
                <label>Copay:</label>
                <span>{formatCurrency(result.coverage.copay)}</span>
              </div>
              <div className="coverage-item">
                <label>Out-of-Pocket Max:</label>
                <span>{formatCurrency(result.coverage.outOfPocketMax)}</span>
              </div>
              <div className="coverage-item">
                <label>Out-of-Pocket Met:</label>
                <span>{formatCurrency(result.coverage.outOfPocketMet)}</span>
              </div>
              <div className="coverage-item">
                <label>Remaining Deductible:</label>
                <span className="calculated">
                  {formatCurrency(result.coverage.deductible - result.coverage.deductibleMet)}
                </span>
              </div>
            </div>
          </div>
        )}

        {result.messages && result.messages.length > 0 && (
          <div className="detail-section">
            <h4>Important Messages</h4>
            <ul className="messages-list">
              {result.messages.map((message, index) => (
                <li key={index} className="message-item">
                  {message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.status === 'Inactive' && (
          <div className="detail-section">
            <div className="alert alert-warning">
              <h4>⚠️ Coverage Inactive</h4>
              <p>This patient's insurance coverage appears to be inactive. Please verify with the insurance company before providing services.</p>
            </div>
          </div>
        )}

        {result.status === 'Unknown' && (
          <div className="detail-section">
            <div className="alert alert-danger">
              <h4>❌ Verification Failed</h4>
              <p>Unable to verify coverage at this time. Please try again or contact the insurance company directly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityResults;