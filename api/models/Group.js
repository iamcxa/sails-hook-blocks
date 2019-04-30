module.exports = {
  attributes: {

    authority: {
      type: Sequelize.STRING(45),
      allowNull: false,
      unique: true,
    },

    title: {
      type: Sequelize.STRING(127),
      allowNull: true,
    },

    description: {
      type: Sequelize.STRING(767),
      allowNull: true,
    },
  },
  associations() {},
  options: {
    "paranoid": false,
    "timestamps": true,
    classMethods: {
      ...sails.config.models.classMethods['Group'],
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
      ...sails.config.models.instanceMethods['Group'],
    },
    hooks: {
      ...sails.config.models.hooks['Group'],
    },
  },
};