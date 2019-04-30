module.exports = {
  attributes: {

    protocol: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    password: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    accessToken: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    provider: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    identifier: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    tokens: {
      allowNull: true,
      type: Sequelize.JSON,
      get() {
        try {
          const val = this.getDataValue('tokens');
          return val ? JSON.parse(val) : null;
        } catch (error) {
          return this.getDataValue('tokens');
        }
      },
    },
    salt: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
  },
  associations() {
    Passport.belongsTo(User);
    User.hasMany(Passport);
  },
  options: {
    "paranoid": false,
    "timestamps": true,
    classMethods: {
      ...sails.config.models.classMethods['Passport'],
      associations() {
        return {
          "belongsTo": ["User"],
          "hasMany": ["Passport"],
          "hasOne": [],
          "belongsToMany": []
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods['Passport'],
    },
    hooks: {
      ...sails.config.models.hooks['Passport'],
    },
  },
};