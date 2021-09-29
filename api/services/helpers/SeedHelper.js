const _ = require('lodash');
const faker = require('faker');
const timezoneList = require('compact-timezone-list').default;

module.exports = {
  /**
   * Generate seed data by input
   * @param {*} {
   *     size,
   *     model,
   *     data,
   *     include,
   *     locales = ['zh_TW', 'zh_CN', 'en', 'de'],
   *   }
   * @returns {Array}
   */
  async create({
    size,
    model,
    data,
    include,
    formatCb = null,
    locales = ['zh_TW', 'zh_CN', 'en', 'de'],
  }) {
    const items = [];
    try {
      const { error } = VerifyHelper.getJoiValidate({
        value: {
          size,
          model,
          data,
        },
        schema: j => ({
          size: j.number().integer().required(),
          model: j.any().required(),
          data: j.func(),
        }),
      });
      if (error) {
        throw Error(MESSAGE.BAD_REQUEST.PARAMETER_FORMAT_INVALID({
          error: error.message,
        }));
      }
      sails.log.verbose(`SeedHelper: Create Seed Data for model "${model.name}"...`);
      const add = async (modelData, options) => {
        try {
          let targetModel = model;
          if (_.isString(model)) {
            targetModel = sails.models[model];
          }
          const result = await targetModel.create(modelData, options);
          // after create data successfully, reload it to get full model column outputs.
          const fullModel = await result.reload();
          return fullModel.toJSON();
        } catch (e) {
          throw e;
        }
      };
      // eslint-disable-next-line no-return-await
      _.range(size).forEach((i) => {
        faker.seed(parseInt(i + new Date().getTime(), 10));
        faker.locale = locales[faker.random.number(locales.length - 1)];
        items.push(
          add(data(i), { include }),
        );
      });
      const createdSeedData = await Promise.all(items);
      if (_.isFunction(formatCb)) {
        const formatedDataArray = [];
        for (const each of createdSeedData) {
          formatedDataArray.push(formatCb(each));
        }
        return formatedDataArray;
      }
      return createdSeedData;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  /**
   * Generate users by input
   * @param {Object} = {
   *    {Array} source
   *    {Number} size
   * @example
   * users = [{
    username: 'oakary',
    password: 'oakary-password',
    email: 'oakary@oakary.com',
    isActivated: true,
    isConfirmed: true,
    confirmedAt: new Date(),
    activatedAt: new Date(),
    roles: ['oakary'],
    includeModels: ['Hr'],
    include: {
      Hr: {
        email: 'hr1@oakary.com',
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        nameCh: faker.name.firstName(),
        phone: faker.phone.phoneNumber(),
        skypeId: faker.internet.userName(),
        wechatId: faker.internet.userName(),
      },
    },
  }];
  roles = [{
    authority: 'oakary',
    title: 'oakary admin',
    description: 'oakary admin',
  }];
   * @returns {Array} users
   */
  async buildUsers({
    source = null,
    size = 10,
  }) {
    // console.log('source=>', source);
    if (!size && !source) {
      throw Error('Parameter `size` or `source` required.');
    }
    if (!size && (typeof source !== 'object' || !source.length)) {
      throw Error('Parameter source MUST be an `array`.');
    }
    try {
      // TODO: disable role-group create for now.
      // const groups = [];
      // items.groups.forEach((group) => {
      //   groups.push(new Promise((resolve, reject) => Group
      //     .create({
      //       authority: group.authority,
      //       title: group.title,
      //       description: group.description,
      //     })
      //     .then((result) => {
      //       sails.log(`Bootstrap create role-group '${result.authority}' success.`);
      //       return resolve(result);
      //     })
      //     .catch(err => reject(err))));
      // });

      // create roles
      const roleSource = (source && source.roles)
        ? source.roles
        : [{
          authority: 'admin',
          title: 'admin',
          description: 'admin',
        }, {
          authority: 'user',
          title: 'user',
          description: 'user',
        }];
      const roles = roleSource.map(async (role) => {
        try {
          const isExist = await Role.findOne({
            where: { authority: role.authority },
          });
          if (isExist) {
            return isExist;
          }
          const newRole = await Role.create({
            authority: role.authority,
            title: role.title,
            description: role.description,
          });
          if (role.group) {
            const targetGroup = await Group.findOne({
              where: {
                authority: role.group,
              },
            });
            if (targetGroup) {
              await newRole.addGroup(targetGroup);
            } else {
              sails.log.warn(`Role Group '${role.group}' not exists.`);
            }
          }
          sails.log.info(`Bootstrap create role '${newRole.authority}' success.`);
          return newRole;
        } catch (err) {
          return err;
        }
      });

      // create users
      const userSource = (source && source.users)
        ? source.users
        : _.range(size).map(e => ({
          username: `${e}.${faker.internet.userName().toLowerCase()}`,
          password: 'user',
          email: `${e}${faker.internet.email()}`,
          isActivated: false,
          isConfirmed: false,
          locale: faker.random.locale(),
          tzCode: timezoneList[faker.random.number({ min: 0, max: timezoneList.length - 1 })].tzCode,
          confirmedAt: faker.date.past(),
          activatedAt: faker.date.past(),
          lastLogin: faker.date.past(),
          roles: roleSource
            ? [roleSource[faker.random.number({
              min: 0,
              max: roleSource.length - 1,
              step: 1,
            })].authority]
            : ['user'],
        }));
      const users = userSource.map(async (user) => {
        const userInclude = [Passport];
        // console.log('============\nuser=>', user);
        try {
          if (user.includeModels) {
            user.includeModels.forEach((model) => {
              if (_.isString(model)) {
                const targetModel = sails.models[model.toLowerCase()];
                if (!_.isNil(targetModel)) {
                  userInclude.push(targetModel);
                } else {
                  sails.log.warn(`Giving Model "${model}" is not exists in sails.models object.`);
                }
              }
              if (_.isObject(model)) {
                if (model.modelName && _.isString(model.modelName)) {
                  // eslint-disable-next-line no-param-reassign
                  model.model = sails.models[model.modelName.toLowerCase()];
                  delete model.modelName;
                  if (model.include) {
                    model.include = model.include.map(e => ({
                      ..._.omit(e, ['modelName']),
                      model: e.model || sails.models[e.modelName.toLowerCase()],
                    }));
                  }
                  userInclude.push(model);
                } else {
                  userInclude.push(model);
                }
              }
            });
          }
          let userData = {
            username: user.username,
            email: user.email,
            tzCode: user.tzCode,
            locale: user.locale,
            isActivated: user.isActivated
              ? user.isActivated
              : true,
            isConfirmed: user.isConfirmed
              ? user.isConfirmed
              : true,
            confirmedAt: user.confirmedAt
              ? new Date(user.confirmedAt)
              : null,
            activatedAt: user.activatedAt
              ? new Date(user.activatedAt)
              : null,
            Passports: {
              provider: 'local',
              password: user.password,
            },
          };
          if (user.include && _.isObject(user.include)) {
            const userDataInclude = user.include;
            userData = {
              ...userData,
              ...userDataInclude,
            };
          }
          const newUser = await User.create(userData, {
            include: userInclude,
          });
          /* eslint no-await-in-loop: 0 */
          for (const role of user.roles) {
            const targetRole = await Role.findOne({
              where: { authority: role },
            });
            await newUser.addRole(targetRole);
          }
          sails.log.info(`SeedHelper create user '${user.username}' success.`);
          const fullModel = await newUser.reload();
          return fullModel.toJSON();
        } catch (e) {
          throw e;
        }
      });
      return {
        // groups: await Promise.all(groups),
        roles: await Promise.all(roles),
        users: await Promise.all(users),
      };
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },
};
