module.exports = {
  attributes: {},
  associations() {
    Role.belongsToMany(Group, {
      through: 'GroupRole',
      foreignKey: {
        name: 'RoleId',
        as: 'Roles',
      },
    });
    Group.belongsToMany(Role, {
      through: 'GroupRole',
      foreignKey: {
        name: 'GroupsId',
        as: 'Groups',
      },
    });
  },
  options: {
    "paranoid": false,
    "timestamps": true,
    classMethods: {
      ...sails.config.models.classMethods['GroupRole'],
      associations() {
        return {
          "belongsTo": [],
          "hasMany": [],
          "hasOne": [],
          "belongsToMany": []
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods['GroupRole'],
    },
    hooks: {
      ...sails.config.models.hooks['GroupRole'],
    },
  },
};