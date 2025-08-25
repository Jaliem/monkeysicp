// Admin Configuration
// Add your actual admin principal IDs here

export const ADMIN_PRINCIPALS = [
  'development-user-principal', // Development fallback - remove in production
  // Actual admin principals:
  "oe63i-xkqdd-nolac-hdyjg-evw3c-4si3e-ijboe-5vwgg-x55dj-env47-jqe",
  "wp7j5-ejwvb-7jpfm-eukk7-utyas-rdffi-wvlzd-pbdnv-7sdkr-u5phb-dqe",
  "hwyrf-sst6w-mepqv-jyv4o-mxlmf-fjnvr-5buo3-y4gyu-abfnb-hjk4x-2qe",
  "usyjo-mg5fy-dsenl-ktxvv-jo4yt-lnjwk-3zx4p-gwg7l-feedi-wzmvo-qae"
];

// Function to check if a principal has admin access
export const isAdminPrincipal = (principal: string): boolean => {
  console.log('🔍 Checking admin status for principal:', principal);
  console.log('📋 Admin principals list:', ADMIN_PRINCIPALS);
  const isAdmin = ADMIN_PRINCIPALS.includes(principal);
  console.log('✅ Is admin?', isAdmin);
  return isAdmin;
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