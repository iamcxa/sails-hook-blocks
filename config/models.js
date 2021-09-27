const bcrypt = require('bcrypt');
const crypto = require('crypto');
const shortid = require('shortid');
const { isEmpty } = require('lodash');

shortid.characters(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-',
);
shortid.seed(2589);

/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

module.exports.models = {
  genShortUuid() {
    return shortid.generate();
  },
  /* -------------------------------------------------------- */
  /*                     CLASS-METHODS                        */
  /* -------------------------------------------------------- */
  classMethods: {
    /* ------------------------------------------------------ */
    Resource: {
      async findByPk(key) {
        const data = await Resource.findOne({
          where: {
            key,
          },
        });
        return data;
      },
    },
    /* ------------------------------------------------------ */
    Passport: {
      /**
       * 將傳入之 passport 實體中之 password 欄位做雜湊處理。
       * @param {Object} SequelizeInstance
       * @param {string} SequelizeInstance.password
       * @returns {Object.<Sequelize>} SequelizeInstance passport
       */
      async hashPassword(passportInstance) {
        try {
          if (passportInstance.password) {
            const hash = await bcrypt.hashSync(passportInstance.password, 10);
            // eslint-disable-next-line
            passportInstance.password = hash;
          }
          return passportInstance;
        } catch (error) {
          throw error;
        }
      },

      /**
       * 依據 userId 找出特定 user 之 local passport 資料。
       * (只找 local provider)
       * @param {number|string} userId
       * @returns {Object.<Sequelize>} SequelizeInstance passport
       */
      async findLocalByUserId(userId) {
        try {
          const passports = await Passport.findOne({
            where: {
              provider: 'local',
              UserId: userId,
            },
          });
          return passports;
        } catch (e) {
          throw e;
        }
      },

      /**
       * 驗證傳入的 password 是否符合該 userId 的密碼。
       * @param {number|string} userId
       * @param {string} password
       * @returns {boolean} result
       */
      async validateUserPassword(userId, password) {
        try {
          const inputHasNull = ValidatorHelper.checkNull({
            userId,
            password,
          });
          if (inputHasNull) {
            throw Error(
              MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ inputHasNull }),
            );
          }
          const passport = await Passport.findLocalByUserId(userId);
          if (!passport) {
            const user = await User.findByPk(userId);
            sails.log.warn(
              MESSAGE.AUTH.USER_PASSWORD_NOT_SET({
                username: user.username,
              }),
            );
            return false;
          }
          // console.log('passport=>', passport);
          if (passport) {
            const isPasswordValid = await passport.validatePassword(password);
            return isPasswordValid;
          }
          return false;
        } catch (e) {
          throw e;
        }
      },
    },
    /* ------------------------------------------------------ */
    User: {
      /**
       * 驗證 user {id} 之角色權限(Role)是否『完全符合』帶入的權限名稱陣列。
       * @param {number|string} id
       * @param {Array.<String>} authorities
       * @returns {boolean} 驗證結果
       */
      async matchRoles(id, authorities, { log = false } = {}) {
        const user = await User.findByPkWithRole(id);
        const isQualified =
          user.Roles.map((r) => r.authority.toLowerCase()).filter((r) =>
            authorities.some((a) => a.toLowerCase() === r),
          ).length === authorities.length;
        if (log) {
          if (isQualified) {
            sails.log.info(
              `---- check UserName "${user.username}" matches "${authorities}"--> ${isQualified}`,
            );
          } else {
            sails.log.info(
              `---- check UserName "${user.username}" NOT matches "${authorities}"--> ${isQualified}`,
            );
          }
        }
        return isQualified;
      },

      /**
       * 驗證 user 之角色權限(Role)是否『部分符合』帶入的權限名稱陣列。
       * @param {number|string} id
       * @param {Array.<String>} authorities
       * @returns {boolean} 驗證結果
       */
      async someRoles(id, authorities, { log = false } = {}) {
        const user = await User.findByPkWithRole(id);
        const isQualified =
          user.Roles.map((r) => r.authority.toLowerCase()).filter((r) =>
            authorities.some((a) => a.toLowerCase() === r),
          ).length > 0;
        if (log) {
          if (isQualified) {
            sails.log(
              `---- check UserName "${user.username}" has one of ["${authorities}"]--> ${isQualified}`,
            );
          } else {
            sails.log.info(
              `---- check UserName "${user.username}" has NO one of ["${authorities}"]--> ${isQualified}`,
            );
          }
        }
        return isQualified;
      },

      /**
       * 依據傳入權限名稱陣列，更新 user 之現有角色權限。
       * @param {number|string} id
       * @param {Array.<String>} authorities
       * @returns {Object} user object
       */
      async setRoles(id, authorities) {
        const user = await User.findByPk(id);

        // console.log('model authorities=>', authorities);
        const roleIds = await Promise.all(
          authorities.map(async (authority) => {
            const role = await Role.findOne({
              where: { authority },
            });
            if (role) {
              return role.id;
            }
            return null;
          }),
        );
        await user.setRoles(roleIds.filter((e) => e !== null));
        // await user.setRoles(authorities);
        return user;
      },

      /**
       * 更新 user 登入失敗時的相關紀錄。
       * @param {number|string} id
       * @returns {Object} user object
       */
      async loginFail(id) {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw Error(MESSAGE.BAD_REQUEST.NO_TARGET_FOUNDED({ id }));
          }
          return await user.loginFail();
        } catch (e) {
          throw e;
        }
      },

      /**
       * 更新 user 登入成功時的相關紀錄。
       * @param {number|string} id
       * @returns {Object} user object
       */
      async loginSuccess({ id, userAgent, locales, lastLoginIP }) {
        try {
          const user = await User.findByPk(id);
          if (!user) {
            throw Error(MESSAGE.BAD_REQUEST.NO_TARGET_FOUNDED({ id }));
          }
          return await user.loginSuccess({
            userAgent,
            locales,
            lastLoginIP,
          });
        } catch (e) {
          sails.log.error(e);
          throw e;
        }
      },

      /**
       * 依據傳入之新密碼，更新 user 現有密碼。
       * @param {number|string} id
       * @param {string} newPassword
       */
      async setPassword(userId, newPassword) {
        try {
          let passport = await Passport.findOne({
            where: {
              provider: 'local',
              UserId: userId,
            },
          });
          if (!passport) {
            sails.log.warn(
              `User id "${userId}" has no default local password, so create a new one for it.`,
            );
            passport = await Passport.create({
              provider: 'local',
              password: newPassword.trim(),
              UserId: userId,
            });
          }
          passport.password = newPassword.trim();
          await passport.save();
        } catch (e) {
          throw e;
        }
      },

      /**
       * 依據 id 取回包含角色權限的 user 實體。
       * @param {number|string} id
       * @returns {Object} user object
       */
      findByPkWithRole: async (id) => {
        // sails.log.info('findByPkWithRole id=>', id);
        try {
          const result = await User.findOne({
            where: {
              id,
            },
            include: [Role],
          });
          return result;
        } catch (e) {
          throw e;
        }
      },
    },

    /* ------------------------------------------------------ */
    MenuItem: {
      async findAllWithSubMenu() {
        try {
          const { environment } = sails.config;
          const where = {
            ParentMenuItemId: null,
          };
          const menuItems = await MenuItem.findAll({
            where,
            include: [
              {
                model: MenuItem,
                as: 'SubMenuItems',
              },
            ],
            // order: ['MenuItem.order', 'SubMenuItems.order'],
          });
          // console.log('menuItems=>', menuItems);
          return menuItems;
        } catch (e) {
          sails.log.error('menuItem findAllWithSubMenu error=>', e);
          throw e;
        }
      },
    },
  },

  /* -------------------------------------------------------- */
  /*                     INSTANCE-METHODS                     */
  /* -------------------------------------------------------- */
  instanceMethods: {
    /* ------------------------------------------------------ */
    Passport: {
      async validatePassword(inputPassword) {
        try {
          const that = this;
          // eslint-disable-next-line
          let result = await new Promise((defer, reject) => {
            if (inputPassword === that.password) {
              defer(true);
            }
            // eslint-disable-next-line
            bcrypt.compare(inputPassword, that.password, (err, result) => {
              if (err) defer(false);
              else defer(result);
            });
          });
          sails.log('=== result ===', result);
          if (result) return result;

          sails.log('=== this.salt ===', that.salt);
          if (!this.salt) return result;

          sails.log('=== check two ===');
          const comparePassword = crypto
            .pbkdf2Sync(
              inputPassword,
              Buffer.from(this.salt, 'base64'),
              10000,
              64,
            )
            .toString('base64');
          if (comparePassword === that.password) {
            result = true;
          }
          return result;
        } catch (e) {
          throw e;
        }
      },
    },
    /* ------------------------------------------------------ */
    User: {
      async setPassword(newPassword) {
        try {
          let passport = await Passport.findOne({
            where: { UserId: this.id },
          });
          if (!passport) {
            sails.log.warn(
              `User id "${this.id}" has no default local password, so create a new one for it.`,
            );
            passport = await Passport.create({
              provider: 'local',
              password: newPassword.trim(),
              UserId: this.id,
            });
          } else {
            passport.password = newPassword.trim();
            await passport.save();
          }
          return this;
        } catch (e) {
          sails.log.error(e);
          throw e;
        }
      },
      async loginFail() {
        try {
          sails.log.warn(`[!] User id ${this.id} login failed.`);
          if (!this.lastLoginFailedCount) {
            this.lastLoginFailedCount = 0;
          }
          this.lastLoginFailedCount += 1;
          return this.save();
        } catch (e) {
          sails.log.error(e);
          throw e;
        }
      },
      async loginSuccess({ userAgent, locales, lastLoginIP }) {
        try {
          const now = new Date();
          this.locales = locales;
          this.userAgent = userAgent;
          this.lastLoginIP = lastLoginIP;
          this.lastLoginAt = now.getTime();
          this.lastLoginFailedCount = 0;
          sails.log(
            `[!] User id ${
              this.id
            } login at ${now.getTime()} so record information.`,
          );
          return await this.save();
        } catch (e) {
          sails.log.error(e);
          throw e;
        }
      },
    },
  },

  /* -------------------------------------------------------- */
  /*                          HOOKS                           */
  /* -------------------------------------------------------- */
  hooks: {
    /* ------------------------------------------------------ */
    Passport: {
      beforeCreate: async (passport) => {
        const hashedPassport = await Passport.hashPassword(passport);
        // console.log('hashedPassport=>', hashedPassport);
        return hashedPassport;
      },
      beforeUpdate: async (passport) => {
        const hashedPassport = await Passport.hashPassword(passport);
        // console.log('hashedPassport=>', hashedPassport);
        return hashedPassport;
      },
    },
    /* ------------------------------------------------------ */
    User: {
      async afterCreate(user) {
        return new Promise(async (resolve, reject) => {
          try {
            const userRole = await Role.findOne({
              where: { authority: 'user' },
            });
            if (userRole) {
              await user.addRole(userRole);
            }
            const verifyEmailToken = crypto
              .randomBytes(32)
              .toString('hex')
              .substr(0, 32);
            // eslint-disable-next-line
            user.tokenVerifyEmail = verifyEmailToken;
            await user.save();
            return resolve(user);
          } catch (e) {
            return reject(e);
          }
        });
      },
      async afterSave(user) {
        return new Promise(async (resolve, reject) => {
          try {
            // const verifyEmailToken = crypto.randomBytes(32).toString('hex').substr(0, 32);
            // user.verificationEmailToken = verifyEmailToken;
            // await user.save();
            return resolve(user);
          } catch (e) {
            return reject(e);
          }
        });
      },
    },
  },
};
