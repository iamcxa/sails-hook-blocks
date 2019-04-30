const apiPrefix = 'api';
const area = '/auth';
const version = '';
const prefix = `${apiPrefix}${area}${version}`;

module.exports.routes = {
  // Local User Register
  [`post /${prefix}/register/:strategy`]: `${prefix}/AuthController.Register`,

  // Local User Login
  [`post /${prefix}/login/:strategy`]: `${prefix}/AuthController.Login`,

  // Local User Logout
  [`post /${prefix}/logout`]: `${prefix}/AuthController.Logout`,

  [`post /${prefix}/verify-email`]: [`${prefix}/AuthController.VerifyEmail`],
  [`post /${prefix}/reset-password`]: [`${prefix}/AuthController.ResetPassword`],

  // Compatible Logout endpoint
  'get /logout': `${prefix}/AuthController.Logout`,
};
