/**
 * Authentication Controller
#
 * This is merely meant as an example of how your Authentication controller
 * should look. It currently includes the minimum amount of functionality for
 * the basics of Passport.js to work.
 */
import _ from 'lodash';

const message = 'success';

module.exports = {

  async Logout(req, res) {
    sails.log('=== API:AuthController:Logout ===');
    return res.logout();
  },

  async Register(req, res) {
    sails.log('=== API:AuthController:Register ===');
    // sails.log('req.allParams()=>', req.allParams());
    try {
      // get blacksails default redirect endpoint.
      const {
        successRedirect,
        failureRedirect,
      } = sails.config.blacksails;

      // get requested strategy from params pool,
      // if not targeted, use 'local' as default.
      const {
        strategy = 'local',
        url = successRedirect,
        email,
        username,
        password,
      } = req.allParams();

      // verify if user has not input required params.
      const inputHasNull = ValidatorHelper.checkNull({
        email,
        username,
        password,
      });
      if (inputHasNull) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ inputHasNull }));
      }

      // the handler support standard API format and form-redirect request.
      const handler = (err, user, info) => {
        if (err || !user) {
          // if passport throw special error
          if (info && info.message === 'Missing credentials') {
            return res.error(Error(MESSAGE.AUTH.INVALID_PASSWORD()));
          }
          return res.error(err || info);
        }
        return res.ok({
          message: info.message,
          data: {
            user,
            url,
          },
        });
        // // if passport verification good, login user in.
        // return req.login(user, async (loginErr) => {
        //   if (loginErr) {
        //     return res.error(loginErr);
        //   }
        //   // record user's login information
        //   await User.loginSuccess({
        //     id: user.id,
        //     lastLoginIP: req.ip,
        //     userAgent: req.headers['user-agent'],
        //     locals: req.headers['accept-language'] 'en',
        //   });
        // });
      };
      return AuthHelper.authenticate({
        strategy: `${strategy}-register`,
        handler,
        req,
        res,
      });
    } catch (e) {
      return res.error(e);
    }
  },

  async Login(req, res) {
    sails.log('=== API:AuthController:Login ===');
    // sails.log('req.allParams()=>', req.allParams());
    try {
      // get blacksails default redirect endpoint.
      const {
        successRedirect,
        failureRedirect,
      } = sails.config.blacksails;

      // get requested strategy from params pool,
      // if not targeted, use 'local' as default.
      const {
        strategy = 'local',
        url = successRedirect,
        identifier,
        password,
      } = req.allParams();

      // verify if user has not input required params.
      const inputHasNull = ValidatorHelper.checkNull({
        identifier,
        password,
      });
      if (inputHasNull) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ inputHasNull }));
      }

      // the handler support standard API format and form-redirect request.
      const handler = async (err, user, info) => {
        if (err || !user) {
          // redirect user to url depends on `req.wantsJSON` param.
          // this is a compatible handler, do not do this in formal REST api.
          if (req.wantsJSON) {
            // if passport throw special error
            if (info && info.message === 'Missing credentials') {
              return res.error(Error(MESSAGE.AUTH.INVALID_PASSWORD()));
            }
            return res.error(err || info);
          }
          return res.redirect(failureRedirect);
        }
        // if passport verification good, login user in.
        return req.login(user, async (loginErr) => {
          if (loginErr) {
            return res.error(loginErr);
          }
          // record user's login information
          await User.loginSuccess({
            id: user.id,
            lastLoginIP: req.ip,
            userAgent: req.headers['user-agent'],
            locales: req.headers['accept-language'] || 'en',
          });
          if (req.wantsJSON) {
            return res.ok({
              message: info.message,
              data: {
                Authorization: AuthHelper.getSessionEncodeToJWT(req),
                user,
                url,
              },
            });
          }
          return res.redirect(url);
        });
      };
      return AuthHelper.authenticate({
        strategy: `${strategy}-login`,
        handler,
        req,
        res,
      });
    } catch (e) {
      return res.error(e);
    }
  },

  async ResetPassword(req, res) {
    sails.log('=== API:AuthContoller:ResetPassword ===');
    try {
      const {
        resetPasswordRedirect,
      } = sails.config;

      const {
        url = resetPasswordRedirect,
        token = null,
        password = null,
        verify = null,
      } = req.allParams();

      const inputHasNull = ValidatorHelper.checkNull({
        token,
        password,
      });
      if (inputHasNull) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
          inputHasNull,
        }));
      }
      const user = await User.findOne({
        where: {
          tokenResetPassword: token,
        },
      });
      if (!user) {
        throw Error(MESSAGE.ERROR.UTIL.USER_NOT_FOUND);
      }
      user.tokenResetPassword = null;
      if (verify) {
        user.isConfirmed = true;
      }
      await user.save();
      await User.setPassword(user.id, password);

      return res.ok({
        message,
        data: {
          url,
        },
      });
    } catch (e) {
      sails.log.error(e.stack);
      return res.error(e);
    }
  },

  async VerifyEmail(req, res) {
    sails.log('=== API:AuthContoller:VerifyEmail ===');
    try {
      const {
        token = null,
      } = req.allParams();

      // FIXME: 應改用joi下去驗證token
      const inputHasNull = ValidatorHelper.checkNull({
        token,
      });
      if (inputHasNull) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ inputHasNull }));
      }

      const user = await User.findOne(
        {
          where: {
            tokenVerifyEmail: token,
          },
        },
      );
      if (!user) {
        throw Error(MESSAGE.ERROR.UTIL.USER_NOT_FOUND);
      }
      user.tokenResetPassword = null;
      user.isConfirmed = true;
      await user.save();

      return res.ok({
        message,
      });
    } catch (e) {
      sails.log.error(e.stack);
      return res.error(e);
    }
  },
};
