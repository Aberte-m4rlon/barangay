// Barangay Configuration
// Update this file with your barangay information

export const barangayInfo = {
  // Basic Information
  name: 'Labasan',
  municipality: 'Bongabong',
  province: 'Oriental Mindoro',
  region: 'MIMAROPA',
  
  // Contact Information
  address: 'Barangay Labasan, Bongabong, Oriental Mindoro',
  contactNumber: '+63 XXX XXX XXXX',
  email: 'barangay.labasan@bongabong.gov.ph',
  
  // Officials (Update with actual names)
  officials: {
    captain: {
      name: '[Barangay Captain Name]',
      title: 'Barangay Captain'
    },
    secretary: {
      name: '[Barangay Secretary Name]',
      title: 'Barangay Secretary'
    },
    treasurer: {
      name: '[Barangay Treasurer Name]',
      title: 'Barangay Treasurer'
    }
  },
  
  // Certificate Settings
  certificate: {
    validityMonths: 6,
    footer: 'Not valid without official seal',
    validityNote: 'This certificate is valid for six (6) months from the date of issue'
  },
  
  // System Settings
  system: {
    name: 'Barangay Operations and Records System',
    shortName: 'BORS',
    version: '1.0.0'
  }
};

export default barangayInfo;
