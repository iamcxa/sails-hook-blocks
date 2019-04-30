module.exports = {
  attributes: {

    authority: {
      type: Sequelize.STRING(45),
      allowNull: false,
      unique: true,
    },

    title: {
      type: Sequelize.STRING(127),
      allowNull: false,
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
      ...sails.config.models.classMethods['Role'],
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
      ...sails.config.models.instanceMethods['Role'],
    },
    hooks: {
      ...sails.config.models.hooks['Role'],
    },
  },
};