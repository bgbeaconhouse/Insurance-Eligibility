// server.js
const express = require('express');
const cors = require('cors');
const { checkEligibility } = require('./mockInsuranceService');
const { testConnection, patientDb, eligibilityDb } = require('./database/db');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Insurance Eligibility Verification System',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// POST /eligibility/check - Perform new eligibility check
app.post('/eligibility/check', async (req, res) => {
  try {
    console.log('Received eligibility check request:', req.body);
    
    // Basic input validation
    const { patientId, patientName, dateOfBirth, memberNumber, insuranceCompany, serviceDate } = req.body;
    
    if (!patientId || !patientName || !dateOfBirth || !memberNumber || !insuranceCompany || !serviceDate) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['patientId', 'patientName', 'dateOfBirth', 'memberNumber', 'insuranceCompany', 'serviceDate']
      });
    }

    // 1. Store/update patient in database
    await patientDb.upsertPatient({
      patientId,
      patientName,
      dateOfBirth
    });

    // 2. Call mock insurance service
    const eligibilityResult = checkEligibility(req.body);
    console.log('Eligibility check result:', eligibilityResult);

    // 3. Store eligibility result in database
    const storedResult = await eligibilityDb.storeEligibilityCheck({
      eligibilityId: eligibilityResult.eligibilityId,
      patientId: eligibilityResult.patientId,
      memberNumber,
      insuranceCompany,
      serviceDate,
      checkDateTime: eligibilityResult.checkDateTime,
      status: eligibilityResult.status,
      coverage: eligibilityResult.coverage,
      messages: eligibilityResult.messages,
      errorMessage: null
    });

    // 4. Return result
    res.json({
      success: true,
      data: eligibilityResult,
      stored: true,
      storedId: storedResult.id
    });
    
  } catch (error) {
    console.error('Error in eligibility check:', error);
    
    // Try to store error in database if we have patient info
    try {
      const { patientId, memberNumber, insuranceCompany, serviceDate } = req.body;
      if (patientId && memberNumber) {
        await eligibilityDb.storeEligibilityCheck({
          eligibilityId: `ERR-${Date.now()}`,
          patientId,
          memberNumber: memberNumber || 'UNKNOWN',
          insuranceCompany: insuranceCompany || 'UNKNOWN',
          serviceDate: serviceDate || new Date().toISOString().split('T')[0],
          checkDateTime: new Date().toISOString(),
          status: 'Unknown',
          coverage: null,
          messages: [],
          errorMessage: error.message
        });
      }
    } catch (dbError) {
      console.error('Failed to store error in database:', dbError);
    }

    res.status(500).json({
      success: false,
      error: 'Eligibility check failed',
      message: error.message
    });
  }
});

// GET /eligibility/history/:patientId - Retrieve eligibility history for a patient
app.get('/eligibility/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit } = req.query; // Optional limit parameter
    
    console.log(`Fetching eligibility history for patient: ${patientId}`);
    
    // Get patient info
    const patient = await patientDb.getPatient(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found',
        patientId
      });
    }

    // Get eligibility history
    const history = await eligibilityDb.getPatientEligibilityHistory(
      patientId, 
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      patient: {
        patientId: patient.patient_id,
        patientName: patient.patient_name,
        dateOfBirth: patient.date_of_birth
      },
      history: history.map(record => ({
        eligibilityId: record.eligibility_id,
        checkDateTime: record.check_datetime,
        status: record.status,
        insuranceCompany: record.insurance_company,
        memberNumber: record.member_number,
        serviceDate: record.service_date,
        coverage: record.status === 'Active' ? {
          deductible: record.deductible,
          deductibleMet: record.deductible_met,
          copay: record.copay,
          outOfPocketMax: record.out_of_pocket_max,
          outOfPocketMet: record.out_of_pocket_met
        } : null,
        messages: record.messages || [],
        errorMessage: record.error_message
      })),
      totalRecords: history.length
    });
    
  } catch (error) {
    console.error('Error fetching eligibility history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligibility history',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection on startup
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.log('⚠️  Server started but database connection failed');
  }
});

module.exports = app;