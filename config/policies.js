const apiPrefix = 'api';
const area = '/auth';
const version = '';
const prefix = `${apiPrefix}${area}${version}`;

module.exports.policies = {
  // 登出入
  [`${prefix}/AuthController`]: {
    Register: ['nocache', 'jwtEncode'],
    Logout: ['nocache', 'jwtDecode'],
    Login: ['nocache', 'jwtEncode'],
    ResetPassword: ['nocache'],
    VerifyEmail: ['nocache'],
  },
};
