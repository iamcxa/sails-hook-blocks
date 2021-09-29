const moment = require('moment-timezone');
const timezone = require('compact-timezone-list').default;

module.exports = {
  attributes: {

    username: {
      type: Sequelize.STRING(128),
      allowNull: false,
      unique: true,
      validate: {
        async isUnique(value, next) {
          try {
            const duplicate = await User.findOne({
              where: {
                id: { $ne: this.id },
                email: value,
              },
            });
            if (duplicate) { throw new Error('username duplicated.'); }
            return next();
          } catch (e) {
            return next(e);
          }
        },
      },
    },

    email: {
      type: Sequelize.STRING(128),
      allowNull: false,
      unique: true,
      validate: {
        async isUnique(value, next) {
          try {
            const duplicate = await User.findOne({
              where: {
                id: { $ne: this.id },
                email: value,
              },
            });
            if (duplicate) { throw new Error('email duplicated.'); }
            return next();
          } catch (e) {
            return next(e);
          }
        },
      },
    },

    locale: {
      type: Sequelize.STRING(128),
      allowNull: true,
    },

    tzCode: {
      type: Sequelize.ENUM(timezone.map(e => e.tzCode)),
      allowNull: true,
      set(val) {
        if (val) {
          this.setDataValue('tzCode', val);
          this.setDataValue('tzOffset', moment.tz(val)._offset / 60);
        }
      },
    },

    tzOffset: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    isActivated: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    activatedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    isConfirmed: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },

    confirmedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    expiredAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    lastLoginAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    lastLoginIP: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    lastLoginFailedCount: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    tokenVerifyEmail: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    tokenResetPassword: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
  },
  associations() {},
  options: {
    paranoid: true,
    timestamps: true,
    instanceMethods: {
      ...sails.config.models.instanceMethods.User,
    },
    classMethods: {
      ...sails.config.models.classMethods.User,
    },
    hooks: {
      ...sails.config.models.hooks.User,
    },
  },
};
