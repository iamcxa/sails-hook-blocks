module.exports = {
  attributes: {

    name: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    api: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },
  },
  associations() {
    RoleMenuItem.belongsTo(Role);

    RoleMenuItem.belongsTo(MenuItem);
    Role.hasMany(RoleMenuItem);
    MenuItem.hasMany(RoleMenuItem);
  },
  options: {
    "paranoid": false,
    "timestamps": true,
    classMethods: {
      ...sails.config.models.classMethods['RoleMenuItem'],
      associations() {
        return {
          "belongsTo": ["Role", "MenuItem"],
          "hasMany": ["RoleMenuItem", "RoleMenuItem"],
          "hasOne": [],
          "belongsToMany": []
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods['RoleMenuItem'],
    },
    hooks: {
      ...sails.config.models.hooks['RoleMenuItem'],
    },
  },
};