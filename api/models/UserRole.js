module.exports = {
  attributes: {},
  associations() {
    User.belongsToMany(Role, {
      through: 'UserRole',
      foreignKey: {
        name: 'UserId',
        as: 'Users',
      },
    });
    Role.belongsToMany(User, {
      through: 'UserRole',
      foreignKey: {
        name: 'RoleId',
        as: 'Roles',
      },
    });
  },
  options: {
    paranoid: false,
    timestamps: true,
    classMethods: {
      ...sails.config.models.classMethods.UserRole,
      associations() {
        return {
          belongsTo: [],
          hasMany: [],
          hasOne: [],
          belongsToMany: [],
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods.UserRole,
    },
    hooks: {
      ...sails.config.models.hooks.UserRole,
    },
  },
};
