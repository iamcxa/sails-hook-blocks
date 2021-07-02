/* eslint-disable no-console */
import _ from 'lodash';
import sinon from 'sinon';

let mock = null;
let mockIsAdmin = null;

module.exports = {

  async mockAdmin() {
    try {
      this.unMockAdmin();
      const admin = await User.findOne({
        where: {
          id: 1,
        },
        include: [Role],
      });
      mock = sinon.stub(AuthHelper, 'getSessionUser').callsFake(() => ({
        ...admin.toJSON(),
        authenticated: true,
      }));
      mockIsAdmin = sinon.stub(AuthHelper, 'isAdmin').callsFake(() => true);
    } catch (e) {
      throw e;
    }
  },

  unMockAdmin() {
    try {
      // AuthHelper.getSessionUser.restore();
      if (mock && mock.restore) {
        mock.restore();
        mock = null;
      }
      if (mockIsAdmin && mockIsAdmin.restore) {
        mockIsAdmin.restore();
        mockIsAdmin = null;
      }
    } catch (e) {
      throw e;
    }
  },

  mockLogin(user, extra) {
    try {
      if (mock) {
        mock.restore();
        mock = null;
      }
      mock = sinon.stub(AuthHelper, 'getSessionUser').callsFake(() => ({
        id: user.id,
        authenticated: true,
        ...extra,
      }));
    } catch (e) {
      throw e;
    }
  },

  unMockLogin() {
    try {
      if (mock && mock.restore) mock.restore();
    } catch (e) {
      throw e;
    }
  },

  /**
   * 使用 Mocha 驗證傳入的 target 中的每個元素是否等於對應 source 中元素的型別。
   * 如果驗證發生錯誤時，會輸出完整的物件與確切發生錯誤的鍵值。
   *
   * array 在檢查時如果 target 的 index 在 source 中沒有對應 index
   * 將自動取 source 第 0 個 index 進行比對
   *
   * 在嚴格模式中, array 的每個 index 內容都必須與 source 對應 index 相符
   *
   * @param {object|array|string|number|boolean} source - 預期的資料結構
   * @param {object|array|string|number|boolean} target - 比對的對象
   * @param {boolean} strictMode - 嚴格模式, 將會詳細比較對象的內容
   * @param {boolean} log - 是否輸出 log
   * @param {boolean} autoThrowError - 是否自動拋錯
   * @param {number} shiftWidth - log 輸出時的縮排空白數
   * @param {boolean} pruneLog - 是否輸出精簡的 log
   */
  validateEach({
    source,
    target,
  }, {
    strictMode = false,
    log = false,
    autoThrowError = true,
    shiftWidth = 2,
    pruneLog = false,
  } = {}) {
    let result;
    try {
      const errlog = target;
      if (_.isNil(source)) {
        should.not.exist(target);
      } else if (Array.isArray(source)) {
        should.exist(target);
        target.should.be.an('array');
        source.forEach((sourceItem, i) => {
          // source/target 內的 array 裡對應的 index 皆存在時進行比對
          // 嚴格模式強制比對
          if (strictMode || !_.isUndefined(target[i])) {
            errlog[i] = this.validateEach({
              source: sourceItem,
              target: target[i],
            }, {
              strictMode,
              autoThrowError: false,
            });
          } else {
            // 如果沒檢查到對應的結構自動拿第一個來比對
            errlog[i] = this.validateEach({
              source: sourceItem,
              target: target[0],
            }, {
              strictMode,
              autoThrowError: false,
            });
          }
        });
      } else if (source instanceof Object) {
        // 有 object 時進行遞迴比對
        should.exist(target);
        (typeof source).should.be.eq(typeof source);
        Object.keys(source).forEach((key) => {
          errlog[key] = this.validateEach({
            source: source[key],
            target: target[key],
          }, {
            strictMode,
            autoThrowError: false,
          });
        });
      } else {
        (typeof source).should.be.eq(typeof target);
        if (strictMode) {
          target.should.be.eql(source);
        }
      }

      result = errlog;
    } catch (err) {
      err.isSpecError = true;
      err.source = source;
      err.target = target;
      result = err;
    }

    const checkError = (errItem) => {
      if (errItem instanceof Error) {
        throw errItem;
      } else if (Array.isArray(errItem)) {
        errItem.forEach((item) => {
          checkError(item);
        });
      } else if (errItem instanceof Object) {
        Object.keys(errItem).forEach((key) => {
          checkError(errItem[key]);
        });
      }
    };

    if (log) this.logger(result, shiftWidth, pruneLog);
    if (autoThrowError) checkError(result);
    return result;
  },

  logger(errlog, shiftWidth, pruneLog) {
    const logName = `
=================================================================================
=                             Spec Error information                            =
=================================================================================`.red.bold;
    const logs = [];
    const logFormater = (logItem, keyChain = [], keyName, space = 0) => {
      const keyNameLog = keyName ? `${keyName}: ` : '';
      if (logItem instanceof Error) {
        const sourcelog = `+ ${keyNameLog}${logItem.source},`.bold.green;
        const targetlog = `- ${keyNameLog}${logItem.target},`.bold.red;
        const messagelog = ` // ${logItem.message}`.bold.red;
        // throw errItem;
        logs.push({
          message: `${sourcelog}${messagelog}`,
          keyChain,
          keyName,
          type: 'error',
          space: space >= shiftWidth ? space - shiftWidth : space,
          display: false,
        });

        logs.push({
          message: targetlog,
          keyChain,
          keyName,
          type: 'error',
          space: space >= shiftWidth ? space - shiftWidth : space,
          display: false,
        });
      } else if (Array.isArray(logItem)) {
        logs.push({
          message: `${keyNameLog}[`.grey,
          keyChain,
          keyName,
          type: 'struct',
          space,
          display: false,
        });
        logItem.forEach((item, i) => {
          logFormater(item, keyChain, i, space + shiftWidth);
        });
        logs.push({
          message: '],'.grey,
          keyChain,
          keyName,
          type: 'struct',
          space,
          display: false,
        });
      } else if (logItem instanceof Object) {
        logs.push({
          message: `${keyNameLog}{`.grey,
          keyChain,
          keyName,
          type: 'struct',
          space,
          display: false,
        });
        Object.keys(logItem).forEach((key) => {
          logFormater(logItem[key], keyChain.concat(key), key, space + shiftWidth);
        });
        logs.push({
          message: '},'.grey,
          keyChain,
          keyName,
          type: 'struct',
          space,
          display: false,
        });
      } else {
        logs.push({
          message: `${keyNameLog}${logItem},`.grey,
          keyChain,
          keyName,
          type: 'log',
          space,
          display: false,
        });
      }
    };
    const hiddenLog = (index) => {
      const keys = [];
      const target = logs[index];
      for (let i = 0; i < target.keyChain.length; i += 1) {
        const arr = target.keyChain.slice(i);
        keys.push(JSON.stringify(arr));
        // eslint-disable-next-line
        target.display = true;
      }

      // 錯誤的前後一行 log 會顯示
      if (logs[index - 1]) logs[index - 1].display = true;
      if (logs[index + 1]) logs[index + 1].display = true;

      // 錯誤的結構本身會顯示
      for (let i = 0; i < logs.length; i += 1) {
        const log = logs[i];
        if (
          keys.indexOf(JSON.stringify(log.keyChain))
          && log.type === 'struct'
        ) {
          log.display = true;
        }
      }
    };

    logFormater(errlog);
    if (pruneLog) {
      for (let i = 0; i < logs.length; i += 1) {
        if (logs[i].type === 'error') hiddenLog(i);
      }
    }

    console.group(logName);
    console.error('Prune Log:'.yellow, `${pruneLog}`.white);
    console.error('Log detail:'.yellow, '\n=>'.white);
    let hiddenCount = 0;
    for (const log of logs) {
      const logMsg = log.message.padStart(log.space + log.message.length);

      if (pruneLog && log.display) {
        hiddenCount = 0;
        console.log(logMsg);
      } else if (pruneLog && !log.display) {
        hiddenCount += 1;
        if (hiddenCount === 1) {
          console.log('...'.padStart(log.space + 3).grey);
        }
      } else if (!pruneLog) {
        console.log(logMsg);
      }
    }
    console.groupEnd(logName);
    return true;
  },
};
