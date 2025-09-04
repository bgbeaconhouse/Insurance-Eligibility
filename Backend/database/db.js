
require('dotenv').config(); 
const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'insurance_eligibility_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});



// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Patient database operations
const patientDb = {
  // Create or update patient
  async upsertPatient(patientData) {
    const { patientId, patientName, dateOfBirth } = patientData;
    const query = `
      INSERT INTO patients (patient_id, patient_name, date_of_birth)
      VALUES ($1, $2, $3)
      ON CONFLICT (patient_id) 
      DO UPDATE SET 
        patient_name = EXCLUDED.patient_name,
        date_of_birth = EXCLUDED.date_of_birth,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    try {
      const result = await pool.query(query, [patientId, patientName, dateOfBirth]);
      return result.rows[0];
    } catch (error) {
      console.error('Error upserting patient:', error);
      throw error;
    }
  },

  // Get patient by ID
  async getPatient(patientId) {
    const query = 'SELECT * FROM patients WHERE patient_id = $1';
    try {
      const result = await pool.query(query, [patientId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  }
};

// Eligibility check database operations
const eligibilityDb = {
  // Store eligibility check result
  async storeEligibilityCheck(checkData) {
    const {
      eligibilityId, patientId, memberNumber, insuranceCompany,
      serviceDate, checkDateTime, status, coverage, messages, errorMessage
    } = checkData;

    const query = `
      INSERT INTO eligibility_checks (
        eligibility_id, patient_id, member_number, insurance_company,
        service_date, check_datetime, status, deductible, deductible_met,
        copay, out_of_pocket_max, out_of_pocket_met, messages, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      eligibilityId, patientId, memberNumber, insuranceCompany,
      serviceDate, checkDateTime, status,
      coverage?.deductible || null,
      coverage?.deductibleMet || null, 
      coverage?.copay || null,
      coverage?.outOfPocketMax || null,
      coverage?.outOfPocketMet || null,
      JSON.stringify(messages || []),
      errorMessage || null
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error storing eligibility check:', error);
      throw error;
    }
  },

  // Get eligibility history for a patient
  async getPatientEligibilityHistory(patientId, limit = 10) {
    const query = `
      SELECT * FROM eligibility_checks 
      WHERE patient_id = $1 
      ORDER BY check_datetime DESC 
      LIMIT $2;
    `;

    try {
      const result = await pool.query(query, [patientId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting eligibility history:', error);
      throw error;
    }
  },

  // Get most recent eligibility check for a patient
  async getLatestEligibilityCheck(patientId) {
    const query = `
      SELECT * FROM eligibility_checks 
      WHERE patient_id = $1 
      ORDER BY check_datetime DESC 
      LIMIT 1;
    `;

    try {
      const result = await pool.query(query, [patientId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting latest eligibility check:', error);
      throw error;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database pool...');
  pool.end(() => {
    console.log('Database pool closed.');
    process.exit(0);
  });
});

module.exports = {
  pool,
  testConnection,
  patientDb,
  eligibilityDb
};

// Test connection if this file is run directly
if (require.main === module) {
  testConnection();
}