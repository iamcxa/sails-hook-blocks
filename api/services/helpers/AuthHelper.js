/* eslint-disable no-continue */
import _ from 'lodash';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const AuthService = {

  async afterLogout(req, res, user) {
    sails.log('=============================================');
    sails.log('===== AuthService After Logout Callback =====');
    sails.log('=============================================');
  },

  async authenticate({
    req,
    res,
    strategy = 'local',
    handler,
  }) {
    try {
      // To verify if requested strategy is exists.
      sails.log.info('[!] Requested Login Auth-Strategy =>', strategy);
      if (!sails.config.strategies[strategy]) {
        throw Error(MESSAGE.AUTH.STRATEGY_NOT_EXISTS({ strategy }));
      }
      return passport.authenticate(strategy, handler)(req, res, (e) => { throw e; });
    } catch (e) {
      throw e;
    }
  },

  getSessionUser(req) {
    // console.log('req.session=>', req.session);
    // console.log('req.session.passport=>', req.session.passport);
    if (req.session && !_.isNil(req.session.passport) && req.session.passport.user) {
      return req.session.passport.user;
    }
    return null;
  },

  getJWTToken(user, deviceToken) {
    const { jwtExpireAges, secret } = sails.config.session;

    // FIXME: JWT expiresIn https://github.com/auth0/node-jsonwebtoken
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        deviceToken,
      },
      secret,
      { expiresIn: jwtExpireAges },
    );
  },

  isWebView(userAgent) {
    return userAgent.indexOf('React-Native') !== -1;
  },

  getSessionEncodeToJWT(req, deviceToken) {
    const user = this.getSessionUser(req);
    let jwtToken = '';
    // console.log('user=>', user);
    if (user) {
      const isWebView = this.isWebView(req.headers['user-agent']);
      if ((req.session.needJwt || isWebView) && user) {
        try {
          jwtToken = this.getJWTToken(user, deviceToken);
        } catch (e) {
          sails.log.error(e);
          throw new Error(e);
        }
      }
      req.session.needJwt = false;
    }
    // console.log('req.session.needJwt=>', req.session.needJwt);
    return jwtToken;
  },

  /**
   * 用來檢查 user 的 roles 是否符合給予的 roles 陣列。
   * @method
   * @param {String[]} targetRoles - role 的名稱。
   * @param {User} user - 要檢查的使用者（不帶入會從 Request 找）。
   * return {Boolean} user role 是否符合 targetRoles 陣列
   */
  isMatchedRoles(targetRoles, user) {
    return user.Roles
      ? user.Roles
        .map(r => r.authority.toLowerCase())
        .every(targetRoles.map(tr => tr.authority.toLowerCase()))
      : false;
  },

  getHexToken(length) {
    return crypto.randomBytes(length).toString('hex').substr(0, length);
  },

  getNumberToken(length) {
    const range = Math.pow(10, (length + 1));
    const num = Math.floor(Math.random() * range);
    const numString = Array(length).join('0') + num.toString();
    return numString.substr(numString.length - length, length);
  },

  verifyUser(user, url) {
    /* offAuth 是個早期還沒有 mockAdmin 的時候用的測試開關，可以拔掉了 */
    if (!user) {
      return { success: false, reason: { message: 'no user' } };
    }

    // console.log('verifyUser user=>', user);

    const policies = ConfigHelper.getAuthConfig();

    const excludeRole = (policies.ignoreRole && _.uniq((policies.ignoreRole))
      ? policies.ignoreRole
      : ['super-admin']);
    sails.log.info('Roles below will be skipping check.', excludeRole);
    const isExclude = this.isMatchedRoles(excludeRole, user);
    // console.log('isExclude=>', isExclude);
    if (isExclude) {
      sails.log('ignore all check');
      return { success: true, reason: { message: 'inExcludeArray' } };
    }
    const conditions = _.uniqBy(policies.verifyUser, 'name');

    for (const condition of conditions) {
      if (condition.enable !== true) {
        // sails.log(`${condition.name} not enable`);
        continue;
      }

      const isLoginRoleMatch = (
        condition.enableRole[0] === '*'
        || this.isMatchedRoles(condition.enableRole, user)
      );
      if (isLoginRoleMatch !== true) {
        sails.log(`${condition.name} not enable for this user`);
        continue;
      }

      // console.log('condition=>', condition);
      // console.log('url=>', url);
      if (condition.skipPath && condition.skipPath.indexOf(url) >= 0) {
        sails.log(`${condition.name} not enable for this url: ${url}`);
        continue;
      }

      sails.log(`[!] Checking Rule "${condition.name}"...`);
      for (const field of condition.verifyField) {
        if (!user[field]) {
          return {
            success: false,
            reason: { message: 'someCheckFailed', condition, field },
          };
        }
      }
    }

    const expireCondition = policies;
    if (expireCondition || expireCondition.enable !== true) {
      return { success: true, reason: { message: 'allPassExcludeExpire' } };
    }

    // write expiration check here
    return { success: true, reason: { message: 'allPass' } };
  },
};

/** @module AuthService */
module.exports = AuthService;
