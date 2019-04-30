import _ from 'lodash';

module.exports = {

  async findAccessLevel(userId) {
    try {
      const user = await User.find({
        where: {
          id: userId,
        },
        include: [{
          model: Role,
          include: [Group],
        }],
      });
      return user;
    } catch (e) {
      throw e;
    }
  },

  getPermissions(roles, model) {
    try {
      const result = {
        read_write: this.hasRoleMenuItemOfMenuItem({ roles, model, RoleMenuItemName: 'READ_WRITE' }),
        read: this.hasRoleMenuItemOfMenuItem({ roles, model, RoleMenuItemName: 'READ' }),
        create: this.hasRoleMenuItemOfMenuItem({ roles, model, RoleMenuItemName: 'CREATE' }),
        update: this.hasRoleMenuItemOfMenuItem({ roles, model, RoleMenuItemName: 'UPDATE' }),
        delete: this.hasRoleMenuItemOfMenuItem({ roles, model, RoleMenuItemName: 'DELETE' }),
      };
      return result;
    } catch (e) {
      throw e;
    }
  },

  hasRoleMenuItemOfMenuItem({ roles, model, RoleMenuItemName }) {
    try {
      const menuItem = roles.some(role => (role.name === RoleMenuItemName && role.MenuItemId === model.id));
      // console.log('menuItem=>', menuItem);
      return menuItem;
    } catch (e) {
      throw e;
    }
  },

  async getUserAllRole({ user }) {
    try {
      // sails.log.info(roles, model, RoleMenuItemName);
      const findUser = await User.findOne({
        where: {
          id: user.id,
        },
        include: Role,
      });
      const rolesId = findUser.Roles.map(data => data.id);
      let roleMenuItem = await RoleMenuItem.findAll({
        where: {
          RoleId: rolesId,
        },
        include: MenuItem,
      });
      roleMenuItem = roleMenuItem.map(data => data.dataValues);
      return roleMenuItem;
    } catch (e) {
      throw e;
    }
  },

  hasRole(user, roleName) {
  },

  hasRoleMenuItem(user, roleName) {
  },

  getAccessibleMenuItems({ roles }) {

  },

  canAccessApi(user, menuItem, httpMethod, apiPath) {
  },

  getRoleName(role) {
    try {
      return role.toString().split(':')[1].replace(']', '').toLowerCase();
    } catch (e) {
      throw e;
    }
  },

};
