/**
 * User.js
 *
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
    },
    age: {
      type: Sequelize.INTEGER,
    },
  },
  associations() {
    User.hasOne(Image, { onDelete: 'cascade' });
    User.belongsTo(Group);
  },
  options: {
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
