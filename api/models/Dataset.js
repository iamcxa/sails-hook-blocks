module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    comment: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    model: {
      type: Sequelize.STRING(45),
      allowNull: true,
    },

    key: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },

    valueType: {
      type: Sequelize.ENUM('String', 'Int', 'Bool'),
      defaultValue: 'String',
    },

    description: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },

    value: {
      type: Sequelize.STRING(767),
      allowNull: true,
    },

    translation: {
      allowNull: true,
      type: Sequelize.JSON,
      get() {
        try {
          const val = this.getDataValue('translation');
          return val ? JSON.parse(val) : null;
        } catch (error) {
          return this.getDataValue('translation');
        }
      },
    },

    extra: {
      allowNull: true,
      type: Sequelize.JSON,
      get() {
        try {
          const val = this.getDataValue('extra');
          return val ? JSON.parse(val) : null;
        } catch (error) {
          return this.getDataValue('extra');
        }
      },
    },
  },
  associations() {
    Dataset.belongsTo(Dataset, {
      as: 'Category',
      foreignKey: 'CategoryId',
      constraints: false,
    });
  },
  options: {
    paranoid: false,
    timestamps: true,
    classMethods: {
      ...sails.config.models.classMethods.Dataset,
    },
    instanceMethods: {
      ...sails.config.models.instanceMethods.Dataset,
    },
    hooks: {
      ...sails.config.models.hooks.Dataset,
    },
  },
};
