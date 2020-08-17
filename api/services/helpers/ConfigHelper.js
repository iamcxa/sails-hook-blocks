/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
/** @module ConfigHelper
 * version: 20180301
 * lastUpdater: Kent
 */
import _ from 'lodash';
import flat from 'flattenjs';
import fs from 'fs';
// import appRootPath from 'app-root-path';

const appRootPath = sails.config.appPath;
const configProdPath = 'config/env/production';
const configDevPath = 'config/env/development';
const configTestPath = 'config/env/test';
const configLocalPath = 'config/local';
const currentConfigPath = 'config/local.current.js';

const parseBool = (value) => {
  switch (value) {
    case true:
    case 'true':
    case 1:
    case '1':
      return true;
    case false:
    case 'false':
    case 0:
    case '0':
      return false;
    default:
      return undefined;
  }
};

const parseType = (value) => {
  if (_.isNil(value)) return undefined;
  if (typeof value === 'object'
      && value instanceof Array) {
    return 'array';
  }
  if (typeof value === 'object'
      && !(value instanceof Array)) {
    return 'object';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  return 'text';
};

module.exports = {
  getAuthConfig() {
    return sails.config.authorization;
  },

  set: async (key, value) => {
    try {
      _.set(sails.config, key, value);
      return await ConfigHelper.sync();
    } catch (e) {
      throw e;
    }
  },

  async setAppConfig({
    appName, key, value,
  }) {
    try {
      // console.log('sails.config.app=>', sails.config.app);
      if (appName && sails.config.app[appName]) {
        const appConfig = sails.config.app[appName];
        const configKeys = Object.keys(appConfig);
        if (configKeys.indexOf(key) !== -1) {
          sails.log(`[ConfigHelper] Set Config to App Name \`${appName}\`, in \`${key}\`: \`${value}\`.`);
          // console.log('sails.config.app[appName][key]=>', sails.config.app[appName][key]);
          sails.config.app[appName][key] = value;
          // console.log('sails.config.app[appName][key]=>', sails.config.app[appName][key]);
          // console.log('appConfig=>', sails.config.app);
          // return true;
          return await ConfigHelper.sync({ app: sails.config.app });
        }
        throw Error(`Error: App config key should be one of: ${JSON.stringify(configKeys)}`);
      }
      throw Error(`Error: App Name should be one of: ${JSON.stringify(Object.keys(sails.config.app))}`);
    } catch (e) {
      throw e;
    }
  },

  getConfig(key) {
    try {
      if (key) {
        return sails.config[key];
      }
      return null;
    } catch (e) {
      throw e;
    }
  },

  getProjectConfig(projectName) {
    try {
      const config = sails.config.project;
      if (projectName) {
        return config[projectName];
      }
      return config;
    } catch (e) {
      throw e;
    }
  },

  getAppConfig(appName) {
    try {
      if (appName && sails.config.app[appName]) {
        return sails.config.app[appName];
      }
      throw Error('Error: App Name should be one of: ', Object.keys(sails.config.app));
    } catch (e) {
      throw e;
    }
  },

  isDropMode() {
    return (sails.config.models.migrate === 'drop');
  },

  isSafeMode() {
    return (sails.config.models.migrate === 'safe');
  },

  isInitTestData() {
    return parseBool(sails.config.models.initTestData);
  },

  isProduction() {
    return (sails.config.environment === 'production');
  },

  isDevelopment() {
    return (sails.config.environment === undefined)
        || (typeof sails.config.environment === 'undefined')
        || (sails.config.environment === 'development');
  },

  isTesting() {
    return (sails.config.environment === 'test');
  },

  getBaseUrl() {
    return sails.config.baseUrl;
  },

  getDefualtVuePath() {
    return '../../../../sails-hook-admin/views/admin/default/vue.ejs';
  },

  getDefaultLayoutPath() {
    return '../../sails-hook-admin/views/admin/default';
  },

  async update(config) {
    let modelConfig;
    try {
      const formatConfig = ConfigHelper.jsonTOPath(config);
      for (let data of formatConfig) {
        data = {
          ...data,
          key: data.key || '',
        };
        modelConfig = await Config.findOne({
          where: {
            name: data.name,
            key: data.key,
          },
        });
        if (modelConfig) {
          modelConfig.value = data.value;
          modelConfig.type = data.type;
          if (data.desc) {
            modelConfig.description = data.desc;
          }
          modelConfig = await modelConfig.save();
        } else {
          modelConfig = await Config.create(data);
        }
      }
      return modelConfig;
    } catch (e) {
      throw e;
    }
  },

  init: () => {

  },

  async sync(extraConfig) {
    sails.log.info('Syncing model config & local config');
    try {
      // 1. load extra config needs to be merge
      if (extraConfig) {
        await this.update(extraConfig);
      }

      // 2. config in local.js
      const localConfig = require(`${appRootPath}/${configLocalPath}`);

      // 3. load config in env folder
      let envConfig = {};
      if (ConfigHelper.isProduction()) {
        envConfig = require(`${appRootPath}/${configProdPath}`);
      } else if (ConfigHelper.isDevelopment()) {
        envConfig = require(`${appRootPath}/${configDevPath}`);
      } else {
        delete localConfig.port;
        delete localConfig.baseUrl;
        delete localConfig.environment;
        envConfig = require(`${appRootPath}/${configTestPath}`);
      }

      // 4. load sails-hook app config
      const { app } = sails.config;

      // 5. load config from db
      const dbConfig = await ConfigHelper.getModelJSONConfig();

      // 5. merge all configs into one object
      const allConfig = _.merge(
        {},
        // 最後載入環境 config，確保以 env config 為主
        { app },
        envConfig,
        localConfig,
        dbConfig,
      );
      delete allConfig.passport;
      delete allConfig.bootstrapTimeout;

      // 6. update db config from sails in-memory config
      await this.update(allConfig);

      return await ConfigHelper.load();
    } catch (e) {
      throw e;
    }
  },

  load: async () => {
    sails.log.info('Updating sails configs');
    try {
      const modelConfig = await ConfigHelper.getModelJSONConfig();
      sails.config = _.merge(
        {},
        sails.config,
        modelConfig,
      );
      // sails.emit('hook:admin-config:reloaded');
      // 把 config 寫入到 local.current.js
      const data = `module.exports = ${JSON.stringify({
        aws: sails.config.aws,
        project: sails.config.project,
        app: sails.config.app,
        ...modelConfig,
      }, null, 2)};`;
      await fs.writeFileSync(`${appRootPath}/${currentConfigPath}`, data, 'utf8');
      return sails.config;
    } catch (e) {
      throw e;
    }
  },

  jsonTOPath: (data) => {
    // sails.log.debug(data);
    try {
      let result = [];
      for (const key of Object.keys(data)) {
        if (_.isArray(data[key])) {
          result.push({
            name: key,
            value: JSON.stringify(data[key]),
            type: 'array',
          });
        } else if (_.isObject(data[key])) {
          // console.log('data[key]=>', data[key]);
          // let formatObject = ConfigHelper.getPath(data[key], '', []);
          let formatObject = flat.convert(data[key]);
          // eslint-disable-next-line no-loop-func
          formatObject = Object.keys(formatObject).map(e => ({
            name: key,
            key: e,
            value: formatObject[e],
            type: parseType(formatObject[e]),
          }));
          // formatObject = formatObject.map(e => ({
          //   name: key,
          //   ...e,
          // }));
          result = result.concat(formatObject);
        } else {
          const item = {
            name: key,
            value: data[key],
            type: 'text',
          };
          if (!Number.isNaN(parseInt(data[key], 10))) {
            item.type = 'number';
          }
          if (_.isBoolean(parseBool(data[key]))) {
            // console.log('data[key]=>', data[key]);
            item.type = 'boolean';
          }
          result.push(item);
        }
      }
      return result;
    } catch (e) {
      throw e;
    }
  },

  pathTOJSON: (data) => {
    try {
      const result = {};
      data.forEach((info) => {
        let { name } = info;
        if (name.startsWith('sails-app')) {
          // eslint-disable-next-line no-param-reassign
          info.key = `${name}.${info.key}`;
          name = 'app';
        }
        result[name] = result[name] || {};
        if (info.key) {
          const pathArray = info.key.split('.');
          if (pathArray.length > 0) {
            let value = info.type === 'array' ? JSON.parse(info.value) : info.value;
            if (info.type === 'boolean') {
              value = parseBool(info.value);
            } else if (info.type === 'number') {
              value = parseInt(info.value, 10);
            }
            result[name] = ConfigHelper.arrayTOObject(result[name], pathArray, value);
          } else {
            let { value } = info;
            if (info.type === 'boolean') {
              value = parseBool(info.value);
            } else if (info.type === 'number') {
              value = parseInt(info.value, 10);
            }
            result[name] = value;
          }
        } else {
          let { value } = info;
          if (info.type === 'boolean') {
            value = parseBool(info.value);
          } else if (info.type === 'number') {
            value = parseInt(info.value, 10);
          }
          result[name] = value;
        }
      });
      // sails.log.info(result);
      return result;
    } catch (e) {
      throw e;
    }
  },

  getPath(curData, path, result, allData, nowPointer) {
    const data = curData;
    try {
      if (_.isEmpty(data)) {
        // 判斷該物件內是否還有其他的物件
        for (const item in allData) {
          if (!_.isEmpty(allData[item]) && _.isObject(allData[item])) {
            ConfigHelper.getPath(allData[item], item, result, allData, item);
            break;
          }
        }
        return result;
      }
      for (const key of Object.keys(data)) {
        if (_.isArray(data[key])) {
          const value = data[key];
          result.push({
            key: `${path}${path ? '.' : ''}${key}`,
            value: JSON.stringify(value),
            type: 'array',
          });
          delete data[key];
          return ConfigHelper.getPath(data, path, result, allData, nowPointer);
        }
        if (_.isObject(data[key])) {
          return ConfigHelper.getPath(data[key], `${path}${path ? '.' : ''}${key}`, result, data, key);
        }
        const item = {
          key: `${path}${path ? '.' : ''}${key}`,
          value: data[key],
          type: 'text',
        };
        if (!Number.isNaN(parseInt(data[key], 10))) {
          item.type = 'number';
        }
        if (_.isBoolean(parseBool(data[key]))) {
          item.type = 'boolean';
        }
        result.push(item);
        delete data[key];
        return ConfigHelper.getPath(data, path, result, allData, nowPointer);
      }
      return result;
    } catch (e) {
      throw e;
    }
  },

  arrayTOObject: (obj, keys, value) => {
    try {
      const lastKey = keys.pop();
      const lastObj = keys.reduce((obj, key) => obj[key] = obj[key] || {}, obj);
      lastObj[lastKey] = value;
      return obj;
    } catch (e) {
      throw e;
    }
  },

  getModelJSONConfig: async () => {
    try {
      let modelConfig = await Config.findAll({
        raw: true,
      });
      modelConfig = ConfigHelper.pathTOJSON(modelConfig);
      // console.log('modelConfig=>', modelConfig);
      delete modelConfig.port;
      delete modelConfig.models;
      return modelConfig;
    } catch (e) {
      throw e;
    }
  },

  getApiKey(key) {
    try {
      const apiKeyObject = sails.config['api-key'];
      if (apiKeyObject) {
        const targetKey = _.get(apiKeyObject, key);
        sails.log(`[!] Get API KEY '${key}', value: '${targetKey}'.`);
        return targetKey || null;
      }
      return null;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },

  async insertMenuItem(itemArray) {
    // sails.log.debug('Inserting new menuItems...');
    try {
      if (!this.isDevelopment()) {
        return false;
      }
      const defaultRole = await Role.findOne({
        where: { authority: 'admin' },
      });
      /* eslint no-await-in-loop: 0 */
      for (const item of itemArray) {
        if (!item.title) {
          sails.log.warn(`Missing Menuitem Title founded. menu href '${item.title}' has no title('${item.title}').`);
        }
        let ParentMenuItemId = item.ParentMenuItemId;
        if (item.parentKey) {
          const parentItem = await MenuItem.findOne({
            where: {
              key: item.parentKey,
            },
          });
          if (parentItem) ParentMenuItemId = parentItem.id;
        }
        const menuItem = await MenuItem.create({
          icon: item.icon,
          iconType: item.iconType,
          model: item.model,
          href: item.href,
          title: item.title,
          key: item.key || null,
          order: item.order || 100,
          isActive: true,
          ParentMenuItemId,
        });
        if (typeof item.role === 'string' && item.role !== 'admin') {
          sails.log.info(`Menuitem's extra authority founded. menu '${item.title}' needs role '${item.role}'.`);
          const targetRole = await Role.findOne({
            where: { authority: item.role },
          });
          if (!targetRole) {
            throw Error(`Can not find target authority '${item.role}'.`);
          }
          await RoleMenuItem.create({
            name: 'READ_WRITE',
            RoleId: targetRole.id,
            MenuItemId: menuItem.id,
          });
        } else if (_.isArray(item.roles)) {
          sails.log.info('Menuitem\'s extra authority authority ARRAY founded.');
          for (const role of item.roles) {
            sails.log.info(`menu '${item.title}' needs role '${role}'.`);
            const targetRole = await Role.findOne({
              where: { authority: role },
            });
            if (!targetRole) {
              throw Error(`Can not find target authority '${role}'.`);
            }
            await RoleMenuItem.create({
              name: 'READ_WRITE',
              RoleId: targetRole.id,
              MenuItemId: menuItem.id,
            });
          }
        } else {
          await RoleMenuItem.create({
            name: 'READ_WRITE',
            RoleId: defaultRole.id,
            MenuItemId: menuItem.id,
          });
        }
      }
      return true;
    } catch (e) {
      sails.log.error(e);
      throw e;
    }
  },
};
