
/**
 * Central Authentication Service (CAS) Authentication Protocol
#
 * CAS is a single sign-on protocol meant to give a user access to
 * more than one application by only submitting their credentials once.
#
 * @param {Object}   req
 * @param {string}   identifier
 * @param {Function} next
 */
module.exports = {
  name: 'admin-login',

  parameter: {
    usernameField: 'identifier',
    passportField: 'password',
  },

  async handler(username, password, cb) {
    // console.log('username, password=>', username, password);
    try {
      const user = await User.findOne({
        where: {
          username,
        },
        include: [Passport],
      });
      // 1. check user exists
      if (!user) {
        throw Error(MESSAGE.AUTH.USER_NOT_FOUND({
          username,
        }));
      }
      // 2. check user is active
      if (!user.isActivated) {
        throw Error(MESSAGE.AUTH.USER_SUSPENDS({
          username,
        }));
      }
      // 3. verify input password
      const isPasswordValid = await Passport.validateUserPassword(user.id, password);
      if (!isPasswordValid) {
        // record a login-fail count
        await User.loginFail(user.id);
        throw Error(MESSAGE.AUTH.INVALID_PASSWORD({
          username,
        }));
      }
      // 4. check user has correct role
      const hasAdminRole = await User.someRoles(user.id, ['admin']);
      if (!hasAdminRole) {
        throw Error(MESSAGE.AUTH.USER_NO_PERMISSION({
          username,
        }));
      }
      // 5. send back user information.
      return cb(null, {
        id: user.id,
        email: user.email,
        username: user.username,
      }, {
        ...JSON.parse(MESSAGE.AUTH.LOGIN_SUCCESS({
          username,
        })),
      });
    } catch (e) {
      return cb(e, null, {
        message: e.message,
      });
    }
  },
};
