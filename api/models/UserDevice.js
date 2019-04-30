module.exports = {
  attributes: {

    platform: {
      type: Sequelize.ENUM('ANDROID', 'IOS_FCM', 'IOS_APNS'),
    },

    deviceToken: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    sdkLevel: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    brand: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    buildVersion: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    isTablet: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },

    carrier: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    deviceCountry: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },
  },
  associations() {
    if (!User) {
      throw Error('sails-hook-notification needs an User model!');
    }
    UserDevice.belongsTo(User);
    User.hasMany(UserDevice);
  },
  options: {
    paranoid: false,
    timestamps: true,
    classMethods: {
      ...sails.config.models.classMethods.UserDevice,
      associations() {
        return {
          belongsTo: ['User'],
          hasMany: ['UserDevice'],
          hasOne: [],
          belongsToMany: [],
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods.UserDevice,
    },
    hooks: {
      ...sails.config.models.hooks.UserDevice,
    },
  },
};
