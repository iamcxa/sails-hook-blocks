/* eslint-disable no-multi-assign */
/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */
const _ = require('lodash');

const util = require('util');

module.exports.bootstrap = async (done) => {
  sails.log('\n.\n===============================< Sails Bootstrapping >===============================\n.');
  const tag = 'Sails-Bootstrapping';
  try {
    console.time(tag);
    sails.config.passport();
    {
      // 讓 console.dir 加深物件輸出深度，並且套用顏色。
      const depth = 5;
      util.inspect.defaultOptions.colors = true;
      util.inspect.styles.name = 'bold';
      util.inspect.styles.string = undefined;
      // const customInspect =  = true;
      console.dir = (output, opt) => {
        const options = Object.assign({
          depth,
          colors: util.inspect.defaultOptions.colors,
          customInspect: util.inspect.defaultOptions.customInspect,
        }, opt);
        console.log(util.inspect(output, options));
      };
      // TODO: 修正 Sequelize hack
      // hack Sequelize，讓 instance 輸出都會自動 toJSON()，可以方便 debug，
      // 關閉方式為把 console.dir 的 customInspect 選項設為 false。
      // 參考：https://nodejs.org/api/util.html#util_util_inspect_object_options
      // 使用範例：
      // console.dir(await Job.findAll());
      // 等於
      // const results = (await Job.findAll()).map((result) => result.toJSON());
      // console.log(util.inspect(results, {depth: 4, colors: true}));
      // Sequelize.prototype.Instance.prototype[util.inspect.custom] = function (depth) {
      //   return this.toJSON();
      // };
    }
    // console.log('!!! sails.hooks=>');
    // console.dir(sails.hooks);
    const { models } = sails.config;
    // init 每個 hook
    await HookHelper.bootstrap({
      isInitSeedData: models.isInitSeedData,
      isInitExtendData: models.isInitExtendData,
    });
    // 強制同步最新的 configs
    await ConfigHelper.sync();
    console.timeEnd(tag);
    if (_.isFunction(done)) return done();
    return done;
  } catch (e) {
    sails.log.error(e.stack);
    // if (!_.isNil(cb) && _.isFunction(cb)) return cb(e);
    throw e;
  }
};
