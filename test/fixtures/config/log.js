/**
 * Built-in Log Configuration
 * (sails.config.log)
 *
 * Configure the log level for your app, as well as the transport
 * (Underneath the covers, Sails uses Winston for logging, which
 * allows for some pretty neat custom transports/adapters for log messages)
 *
 * For more information on the Sails logger, check out:
 * http://sailsjs.org/#!/documentation/concepts/Logging
 */
const util = require('util');
const colors = require('colors');
const tracer = require('tracer');

module.exports.log = {
  /** *************************************************************************
  *                                                                          *
  * Valid `level` configs: i.e. the minimum log level to capture with        *
  * sails.log.*()                                                            *
  *                                                                          *
  * The order of precedence for log levels from lowest to highest is:        *
  * silly, verbose, info, debug, warn, error                                 *
  *                                                                          *
  * You may also set the level to "silent" to suppress all logs.             *
  *                                                                          *
  ************************************************************************** */

  level: 'info',
  custom: tracer.colorConsole({
    stackIndex: 1,
    dateformat: 'mm-dd HH:MM:ss.L',
    preprocess(data) {
      // if (data.args['0'] instanceof Error) {
      //   data.args['0'] = `[X] ${data.args['0'].message || data.args['0']}`;
      // }
      // if (data.title === 'warn') {
      //   data.args['0'] = `[!] ${data.args['0']}`;
      // }
      // if (data.title === 'debug') {
      //   data.args['0'] = `[*] ${data.args['0']}`;
      // }
      // if (data.title === 'info') {
      //   data.args['0'] = `[-] ${data.args['0']}`;
      // }
    },
  }),
  inspect: false,
};
