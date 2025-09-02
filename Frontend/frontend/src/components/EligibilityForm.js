// src/components/EligibilityForm.js
import React, { useState } from 'react';
import axios from 'axios';

const EligibilityForm = ({ onResult, onViewHistory, onClearAll }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    dateOfBirth: '',
    memberNumber: '',
    insuranceCompany: '',
    serviceDate: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/eligibility/check', formData);
      
      if (response.data.success) {
        onResult(response.data.data, formData.patientId);
      } else {
        setError('Eligibility check failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during the eligibility check');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    if (formData.patientId.trim()) {
      onViewHistory(formData.patientId.trim());
    } else {
      setError('Please enter a Patient ID to view history');
    }
  };

  const handleClearForm = () => {
    setFormData({
      patientId: '',
      patientName: '',
      dateOfBirth: '',
      memberNumber: '',
      insuranceCompany: '',
      serviceDate: ''
    });
    setError(null);
    // Clear all results and tables below
    onClearAll();
  };

  const isFormValid = () => {
    return Object.values(formData).every(value => value.trim() !== '');
  };

  return (
    <div className="eligibility-form">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="patientId">Patient ID *</label>
            <input
              type="text"
              id="patientId"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="patientName">Patient Name *</label>
            <input
              type="text"
              id="patientName"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">Date of Birth *</label>
            <input
              type="text"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="memberNumber">Member Number *</label>
            <input
              type="text"
              id="memberNumber"
              name="memberNumber"
              value={formData.memberNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="insuranceCompany">Insurance Company *</label>
            <select
              id="insuranceCompany"
              name="insuranceCompany"
              value={formData.insuranceCompany}
              onChange={handleChange}
              required
            >
              <option value="">Select Insurance Company</option>
              <option value="BlueCross BlueShield">BlueCross BlueShield</option>
              <option value="Aetna">Aetna</option>
              <option value="Cigna">Cigna</option>
              <option value="UnitedHealthcare">UnitedHealthcare</option>
              <option value="Humana">Humana</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="serviceDate">Service Date *</label>
            <input
              type="text"
              id="serviceDate"
              name="serviceDate"
              value={formData.serviceDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="form-buttons">
          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="btn btn-primary"
          >
            {loading ? 'Checking Eligibility...' : 'Check Eligibility'}
          </button>

          <button
            type="button"
            onClick={handleViewHistory}
            disabled={!formData.patientId.trim()}
            className="btn btn-secondary"
          >
            View Patient History
          </button>

          <button
            type="button"
            onClick={handleClearForm}
            className="btn btn-outline"
          >
            🔄 Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default EligibilityForm;