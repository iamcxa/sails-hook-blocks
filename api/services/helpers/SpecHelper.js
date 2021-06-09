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
   * strictMode = true，
   * @param {Object} {
   *     source,
   *     target,
   *   } 參數
   * @param {Object} {
   *     strictMode = false, 可以驗證 source 與 target 是否全等於(should.be.eq)。q
   *   } 選項
   * @returns {boolean} spec testing result
   */
  validateEach({
    source,
    target,
  }, {
    strictMode = false,
    log = false,
  } = {}) {
    const keyName = [];
    const title = [];
    const compare = [];
    const expect = [];
    const actual = [];
    try {
      Object.keys(source).forEach((key, i) => {
        keyName[i] = `${_.padEnd(key, 25, ' ')}\t`;
        title[i] = _.padEnd(`expect: ${source[key]}(${typeof source[key]})`, 40, ' ');
        compare[i] = (_.isString(source[key]) && source[key].length > 20)
          ? `\n${_.padStart('', 30, ' ')}`
          : '';
        expect[i] = `${title[i]}${compare[i]}`;
        actual[i] = `actual: ${target[key]}(${typeof target[key]})`;

        const checkValue = (sourceVal, targetVal) => {
          (typeof sourceVal).should.be.eq(typeof targetVal);
          if (strictMode) {
            targetVal.should.be.eql(sourceVal);
          }
        }

        const checkArray = (sourceArr, targetArr) => {
          should.exist(targetArr);
          targetArr.should.be.an('array');
          sourceArr.forEach((sourceArrItem, i) => {
            // source/target 內的 array 裡對應的 index 皆存在時進行比對
            if (!_.isUndefined(targetArr[i])) {
              checkType(sourceArrItem, targetArr[i]);
            }
          });
        }

        const checkObject = (sourceObj, targetObj) => {
          // 有 object 時進行遞迴比對
          (typeof sourceObj).should.be.eq((typeof targetObj));
          this.validateEach({
            source: sourceObj,
            target: targetObj,
          }, {
            strictMode,
            log,
          });
        }

        const checkType = (sourceItem, targetItem) => {
          if (_.isNil(sourceItem)) {
            should.not.exist(targetItem);
          } else if (Array.isArray(sourceItem)) {
            checkArray(sourceItem, targetItem);
          } else if (sourceItem instanceof Object) {
            checkObject(sourceItem, targetItem);
          } else {
            checkValue(sourceItem, targetItem);
          }
        }

        if (log) {
          console.info(`== ${keyName[i]}`.grey, ` - ${expect[i]}`.grey, ` - ${actual[i]}`.grey);
        }

        checkType(source[key], target[key]);
      });

      return true;
    } catch (e) {
      if (!e.logger) {
        // 只顯示第一個抓到的錯誤
        e.logger = this.logger({
          target,
          keyName,
          expect,
          actual,
        });
      }
      throw e;
    }
  },

  logger({
    target,
    keyName,
    expect,
    actual,
  }) {
    const key = `
=================================================================================
=                             Spec Error information                            =
=================================================================================`.red.bold;
    console.group(key);
    console.error('Output detail:'.yellow, '\n=>'.white);
    console.dir(target);
    console.error('\nComparison (last 3 elements):'.yellow);
    const startAtIndex = (keyName.length > 3)
      ? keyName.length - 3
      : keyName.length - 1;
    for (let i = startAtIndex; i < keyName.length; i += 1) {
      // console.log(i);
      if ((i === keyName.length - 1)) {
        console.error(`=> ${keyName[i]}`.bold.red, ` + ${expect[i]}`.green, ` - ${actual[i]}`.bold.red);
      } else {
        console.error(`== ${keyName[i]}`.grey, ` - ${expect[i]}`.grey, ` - ${actual[i]}`.grey);
      }
    }
    console.groupEnd(key);
    console.error('\n');
    return true;
  },
};
