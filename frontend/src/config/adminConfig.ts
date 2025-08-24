// Admin Configuration
// Add your actual admin principal IDs here

export const ADMIN_PRINCIPALS = [
  'development-user-principal', // Development fallback - remove in production
  // Add actual admin principal IDs below:
  // 'rdmx6-jaaaa-aaaah-qcaiq-cai', // Example admin principal
  // 'renrk-eyaaa-aaaah-qcaiq-cai', // Another example admin principal
];

// Function to check if a principal has admin access
export const isAdminPrincipal = (principal: string): boolean => {
  return ADMIN_PRINCIPALS.includes(principal);
};

// Function to add a new admin (for runtime admin management if needed)
export const addAdminPrincipal = (principal: string): void => {
  if (!ADMIN_PRINCIPALS.includes(principal)) {
    ADMIN_PRINCIPALS.push(principal);
  }
};

// Function to remove an admin (for runtime admin management if needed)
export const removeAdminPrincipal = (principal: string): void => {
  const index = ADMIN_PRINCIPALS.indexOf(principal);
  if (index > -1) {
    ADMIN_PRINCIPALS.splice(index, 1);
  }
};

export default {
  ADMIN_PRINCIPALS,
  isAdminPrincipal,
  addAdminPrincipal,
  removeAdminPrincipal,
};