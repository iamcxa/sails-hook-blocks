import Loader from 'sails-util-micro-apps';
import bootstrap from './bootstrap';

module.exports = function (sails) {
  const loader = Loader(sails);
  return {
    bootstrap,
    defaults: {
      __configKey__: {
        name: 'blacksails',
        _exposeToGlobal: true,
        _hookTimeout: 120 * 1000,
        enable: true,
      },
    },
    configure() {
      loader.configure({
        policies: `${__dirname}/api/policies`,
        config: `${__dirname}/config`,
        assets: `${__dirname}/assets`,
        views: `${__dirname}/views`,
      });
    },
    initialize(next) {
      loader.inject({
        models: `${__dirname}/api/models`,
        helpers: `${__dirname}/api/helpers`,
        services: `${__dirname}/api/services`,
        responses: `${__dirname}/api/responses`,
        controllers: `${__dirname}/api/controllers`,
      }, err => next(err));
    },
  };
};
