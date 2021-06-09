/**
 * Group.js
 *
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
    },
    role: {
      type: Sequelize.ENUM('USER', 'ADMIN'),
    },
  },
  associations() {
    Group.hasMany(User);
  },
  options: {
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
