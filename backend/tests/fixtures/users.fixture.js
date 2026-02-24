// User test fixtures
export const validAdmin = {
  name: 'Test Admin',
  email: 'admin@test.com',
  password: 'Password@123',
  role: 'SUPER_ADMIN',
  is_active: true,
  email_verified: true,
  approval_status: 'APPROVED'
};

export const validBuyer = {
  name: 'Test Buyer',
  email: 'buyer@test.com',
  password: 'Password@123',
  role: 'BUYER',
  company_name: 'Test Company Pvt Ltd',
  phone: '+91-9876543210',
  is_active: true,
  email_verified: true,
  approval_status: 'APPROVED'
};

export const validSubAdmin = {
  name: 'Test Sub Admin',
  email: 'subadmin@test.com',
  password: 'Password@123',
  role: 'SUB_ADMIN',
  is_active: true,
  email_verified: true,
  approval_status: 'APPROVED',
  permissions: ['manage_users', 'manage_products']
};

export const pendingBuyer = {
  name: 'Pending Buyer',
  email: 'pending@test.com',
  password: 'Password@123',
  role: 'BUYER',
  company_name: 'Pending Company',
  phone: '+91-9876543211',
  is_active: false,
  email_verified: true,
  approval_status: 'PENDING'
};

export const invalidUser = {
  name: '',  // Invalid - empty name
  email: 'invalid-email',  // Invalid email format
  password: '123',  // Too weak
  role: 'INVALID_ROLE'
};

export const weakPasswords = [
  'password',      // No uppercase, no number, no special
  'PASSWORD',      // No lowercase, no number, no special
  'Password',      // No number, no special
  'Password1',     // No special character
  'Pass@1',        // Too short
];

export const strongPasswords = [
  'Password@123',
  'MyP@ssw0rd!',
  'Str0ng$Pass',
  'Test@User2024',
];
