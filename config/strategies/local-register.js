
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
  name: 'local-register',

  parameter: {
    usernameField: 'username',
    passportField: 'password',
    // allows pass back the entire request to the callback
    passReqToCallback: true,
  },

  async handler(req, username, password, cb) {
    sails.log.info('[local-register] username, password=>', username, password);
    try {
      // get other user registration information.
      const {
        email,
      } = req.allParams();
      // 1. check if username or email exists,
      // if yes, throw back an exception.
      const findUser = await User.findOne({
        where: {
          [Sequelize.Op.or]: {
            username,
            email,
          },
        },
      });
      if (findUser) {
        if (findUser.username === username) {
          throw Error(MESSAGE.AUTH.USERNAME_HAS_EXISTED({
            username,
          }));
        }
        if (findUser.email === email) {
          throw Error(MESSAGE.AUTH.EMAIL_HAS_EXISTED({
            username,
          }));
        }
      }

      // 2. create a new user
      const user = await User.create({
        email,
        username,
        Passports: {
          protocol: 'local',
          provider: 'local',
          password,
        },
      }, {
        include: [Passport],
      });

      // 3. send back user information.
      return cb(null, {
        id: user.id,
        email: user.email,
        username: user.username,
      }, {
        ...JSON.parse(MESSAGE.AUTH.REGISTER_SUCCESS({
          username,
        })),
      });
    } catch (e) {
      return cb(e, false, {
        message: e.message,
      });
    }
  },
};
