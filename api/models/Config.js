module.exports = {
  attributes: {

    name: {
      type: Sequelize.STRING(127),
      allowNull: false,
    },

    key: {
      type: Sequelize.STRING(127),
      allowNull: false,
    },

    value: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    type: {
      type: Sequelize.ENUM('string', 'url', 'boolean', 'array', 'object', 'text', 'number'),
      allowNull: false,
      defaultValue: 'text',
    },

    description: {
      type: Sequelize.STRING(767),
      allowNull: true,
    },
  },
  associations() {},
  options: {
    "paranoid": true,
    "timestamps": true,
    classMethods: {
      ...sails.config.models.classMethods['Config'],
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
      ...sails.config.models.instanceMethods['Config'],
    },
    hooks: {
      ...sails.config.models.hooks['Config'],
    },
  },
};