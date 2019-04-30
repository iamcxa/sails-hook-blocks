module.exports = {
  attributes: {

    icon: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    iconType: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    title: {
      type: Sequelize.STRING(127),
      allowNull: true,
    },

    model: {
      type: Sequelize.STRING(127),
      allowNull: true,
    },

    href: {
      type: Sequelize.STRING(767),
      allowNull: true,
    },

    key: {
      type: Sequelize.STRING(45),
      allowNull: true,
      unique: true,
    },

    order: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },
  },
  associations() {
    MenuItem.hasMany(MenuItem, {
      foreignKey: 'ParentMenuItemId',
      as: 'SubMenuItems',
    });
  },
  options: {
    "paranoid": false,
    "timestamps": true,
    classMethods: {
      ...sails.config.models.classMethods['MenuItem'],
      associations() {
        return {
          "belongsTo": [],
          "hasMany": ["MenuItem"],
          "hasOne": [],
          "belongsToMany": []
        };
      },
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods['MenuItem'],
    },
    hooks: {
      ...sails.config.models.hooks['MenuItem'],
    },
  },
};