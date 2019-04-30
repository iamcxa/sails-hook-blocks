/* eslint no-console: 0 */
/* eslint no-await-in-loop: 0 */

module.exports = {
  bootstrap: async ({
    isInitSeedData,
    isInitExtendData,
  }) => {
    try {
      const isDropMode = ConfigHelper.isDropMode();
      const isDevelopmentMode = ConfigHelper.isDevelopment();
      const shouldInitData = (isInitSeedData || (isDropMode && isDevelopmentMode));

      for (const name of Object.keys(sails.hooks).reverse()) {
        const { configKey } = sails.hooks[name];
        const hookConfig = sails.config[configKey];
        const isHookEnable = _.has(hookConfig, 'enable')
          ? hookConfig.enable
          : true;

        // 是否要匯入的判斷必須交給 init 定義的程式負責
        if (shouldInitData
            && isHookEnable
            && _.isFunction(sails.hooks[name].bootstrap)) {
          sails.log.debug('===============> Bootstrap Hook', `'${name}'`.green);
          console.time(name);
          console.group(name);
          await sails.hooks[name].bootstrap({
            isInitSeedData,
            isInitExtendData,
          });
          console.groupEnd(name);
          console.timeEnd(name);
        }
      }
    } catch (e) {
      throw e;
    }
  },
};
