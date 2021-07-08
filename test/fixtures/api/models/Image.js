/**
 * Image.js
 *
 */

module.exports = {
  attributes: {
    url: {
      type: Sequelize.STRING,
    },
  },
  associations() {
    Image.belongsTo(User);
  },
  options: {
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
