const authController = require('../controllers/auth-controller');
const { requireAuth } = require('../middleware/auth');

module.exports = [
  {
    method: 'POST',
    pattern: /^\/api\/auth\/register$/,
    handler: authController.registerAccount
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/login$/,
    handler: authController.loginAccount
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/logout$/,
    handler: authController.logoutAccount
  },
  {
    method: 'GET',
    pattern: /^\/api\/auth\/me$/,
    middleware: [requireAuth],
    handler: authController.me
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/verify-email$/,
    handler: authController.verifyEmailAddress
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/resend-verification$/,
    handler: authController.resendEmailVerification
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/forgot-password$/,
    handler: authController.forgotPassword
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/verify-recovery$/,
    handler: authController.verifyRecovery
  },
  {
    method: 'POST',
    pattern: /^\/api\/auth\/reset-password$/,
    middleware: [requireAuth],
    handler: authController.updatePassword
  }
];
