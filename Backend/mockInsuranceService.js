

function checkEligibility(patientData) {
  const { patientId, memberNumber, insuranceCompany } = patientData;
  
  // Validate required fields
  if (!patientId || !memberNumber || !insuranceCompany) {
    throw new Error('Missing required fields: patientId, memberNumber, or insuranceCompany');
  }

  // Predictable error trigger 
  if (memberNumber === 'ERROR999' || memberNumber.includes('ERROR')) {
    throw new Error('Insurance API temporarily unavailable');
  }

  // Generate eligibility ID
  const eligibilityId = `ELG-${Date.now()}`;
  
  // Simple logic based on member number ending
  const lastDigit = memberNumber.slice(-1);
  
  // Base response structure
  const baseResponse = {
    eligibilityId,
    patientId,
    checkDateTime: new Date().toISOString(),
    insuranceCompany,
    memberNumber
  };

  // Different responses based on last digit of member number
  if (lastDigit >= '0' && lastDigit <= '6') {
    // 70% - Active with full coverage
    return {
      ...baseResponse,
      status: 'Active',
      coverage: {
        deductible: 1500.00,
        deductibleMet: 300.00,
        copay: 25.00,
        outOfPocketMax: 5000.00,
        outOfPocketMet: 450.00
      },
      messages: []
    };
  } else if (lastDigit === '7' || lastDigit === '8') {
    // 20% - Active with limited coverage
    return {
      ...baseResponse,
      status: 'Active',
      coverage: {
        deductible: 3000.00,
        deductibleMet: 0.00,
        copay: 50.00,
        outOfPocketMax: 8000.00,
        outOfPocketMet: 0.00
      },
      messages: [
        'High deductible plan',
        'Specialist visits require prior authorization'
      ]
    };
  } else {
    // 10% - Inactive
    return {
      ...baseResponse,
      status: 'Inactive',
      coverage: null,
      messages: [
        'Policy is inactive',
        'Please contact insurance company'
      ]
    };
  }
}



// Test function
function testMockService() {
  console.log('Testing Mock Insurance Service...\n');
  
  const testPatients = [
    {
      patientId: 'P123456',
      patientName: 'John Doe',
      memberNumber: 'INS123456', // ends in 6 - should be Active
      insuranceCompany: 'BlueCross BlueShield'
    },
    {
      patientId: 'P789012',
      patientName: 'Jane Smith', 
      memberNumber: 'INS789017', // ends in 7 - should be Active/Limited
      insuranceCompany: 'Aetna'
    },
    {
      patientId: 'P555555',
      patientName: 'Bob Wilson',
      memberNumber: 'INS555559', // ends in 9 - should be Inactive
      insuranceCompany: 'Cigna'
    }
  ];

  testPatients.forEach(patient => {
    try {
      const result = checkEligibility(patient);
      console.log(`${patient.patientName} (${patient.memberNumber}):`);
      console.log(`Status: ${result.status}`);
      if (result.coverage) {
        console.log(`Deductible: $${result.coverage.deductible}`);
        console.log(`Copay: $${result.coverage.copay}`);
      }
      if (result.messages.length > 0) {
        console.log(`Messages: ${result.messages.join(', ')}`);
      }
      console.log('---');
    } catch (error) {
      console.log(`Error for ${patient.patientName}: ${error.message}`);
      console.log('---');
    }
  });
}

module.exports = {
  checkEligibility,
 
  testMockService
};

// Run test if this file is executed directly
if (require.main === module) {
  testMockService();
}