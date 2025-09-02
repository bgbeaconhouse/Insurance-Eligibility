-- database/schema.sql
-- Insurance Eligibility Verification System Database Schema

-- Create database (run this first if needed)
-- CREATE DATABASE insurance_eligibility;

-- Connect to the database before running the rest
-- \c insurance_eligibility;

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(50) UNIQUE NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create eligibility_checks table
CREATE TABLE IF NOT EXISTS eligibility_checks (
    id SERIAL PRIMARY KEY,
    eligibility_id VARCHAR(100) UNIQUE NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    member_number VARCHAR(100) NOT NULL,
    insurance_company VARCHAR(255) NOT NULL,
    service_date DATE NOT NULL,
    check_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Inactive', 'Unknown')),
    
    -- Coverage details (nullable for inactive/unknown status)
    deductible DECIMAL(10,2),
    deductible_met DECIMAL(10,2),
    copay DECIMAL(10,2),
    out_of_pocket_max DECIMAL(10,2),
    out_of_pocket_met DECIMAL(10,2),
    
    -- Store messages as JSON array
    messages JSONB DEFAULT '[]'::jsonb,
    
    -- Error information
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_patient_id ON eligibility_checks(patient_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_member_number ON eligibility_checks(member_number);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_check_datetime ON eligibility_checks(check_datetime);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_status ON eligibility_checks(status);

-- Composite index for patient history queries
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_patient_datetime 
    ON eligibility_checks(patient_id, check_datetime DESC);

-- Insert some sample data for testing
INSERT INTO patients (patient_id, patient_name, date_of_birth) VALUES
('P123456', 'John Doe', '1980-05-15'),
('P789012', 'Jane Smith', '1975-08-22'),
('P555555', 'Bob Wilson', '1990-12-01')
ON CONFLICT (patient_id) DO NOTHING;

-- Insert sample eligibility checks
INSERT INTO eligibility_checks (
    eligibility_id, patient_id, member_number, insurance_company, 
    service_date, check_datetime, status, deductible, deductible_met, 
    copay, out_of_pocket_max, out_of_pocket_met, messages
) VALUES
('ELG-2024-001', 'P123456', 'INS123456', 'BlueCross BlueShield', 
 '2024-02-15', '2024-02-01T10:30:00Z', 'Active', 
 1500.00, 300.00, 25.00, 5000.00, 450.00, '[]'::jsonb),
 
('ELG-2024-002', 'P789012', 'INS789017', 'Aetna', 
 '2024-02-20', '2024-02-10T14:15:00Z', 'Active', 
 3000.00, 0.00, 50.00, 8000.00, 0.00, 
 '["High deductible plan", "Specialist visits require prior authorization"]'::jsonb),
 
('ELG-2024-003', 'P555555', 'INS555559', 'Cigna', 
 '2024-02-25', '2024-02-15T09:45:00Z', 'Inactive', 
 null, null, null, null, null, 
 '["Policy is inactive", "Please contact insurance company"]'::jsonb)
ON CONFLICT (eligibility_id) DO NOTHING;

-- Verify the data
SELECT 'Patients count:' as info, COUNT(*) as count FROM patients
UNION ALL
SELECT 'Eligibility checks count:' as info, COUNT(*) as count FROM eligibility_checks;