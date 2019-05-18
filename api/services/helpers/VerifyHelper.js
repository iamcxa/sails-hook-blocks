import _ from 'lodash';
import Validator from 'validator';
import Joi from 'joi';
import jsonValidator from './lib/jsonValidator';

const vAllowSymbol = (payload, symbols) => {
  const rule = `^[${symbols.reduce((f, r) => `${f}${r}`)}]*$`;
  // console.log('symbols.rule=>', rule);
  return payload.match(rule);
};

const theValidator = {
  /**
   * 傳入參數以檢查是否存在該筆資料
   * @deprecated 使用 isModelColumn 取代
   * @param {*} payload
   * @returns
   */
  async checkNullData(payload) {
    return this.isModelColumn(payload);
  },

  /**
   * 傳入參數以檢查是否存在該筆資料
   * @deprecated 使用 isModelColumn 取代
   * @param {*} payload
   * @returns
   */
  async isNotExists(payload) {
    return this.isModelColumn(payload);
  },

  /**
   * 參數需傳入{}形式，表示其中一個不為 null 即可
   * @export
   * @deprecated 使用 checkInput 取代
   * @param {array} payload
   * @returns result
   */
  checkNull(payload, options) {
    return this.checkInput(payload, options);
  },

  /**
   * 傳入參數以檢查是否存在該筆資料
   *
   * @param {array} payload:[[Model, columnName, value]]
   * @returns {boolean} verification result
   */
  async isModelColumn(payload) {
    sails.log.info('VerifyHelper isModelColumn payload=>\n', payload);
    try {
      if (!payload) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ payload }));
      }
      if (!_.isArray(payload)) {
        throw Error(MESSAGE.BAD_REQUEST.CHECK_INPUT_PARAMETER_TYPE({ payload: 'Array' }));
      }
      let itemShouldExists;
      for (const item of payload) {
        if (item.length !== 3) {
          // eslint-disable-next-line
          continue;
        }
        // console.log('item[0]=>', item[0].name);
        if (!item[0]) {
          throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({
            message: '1st parameter: model or model name',
          }));
        }
        const modelName = item[0].name || item[0];
        const model = sails.models[modelName.toLowerCase()];
        // console.log('model=>', model);
        if (!model) {
          throw Error(MESSAGE.BAD_REQUEST.MODEL_NOT_EXISTS({ model }));
        }
        const key = item[1];
        const value = item[2];
        const where = {
          [key]: value,
        };
        // eslint-disable-next-line
        itemShouldExists = await model.findOne({
          where,
          attributes: ['id'],
        });
        if (!itemShouldExists) {
          return `${model.name}.${key}=${value}`;
        }
      }
      return false;
    } catch (e) {
      throw e;
    }
  },

  /**
   * 參數需傳入{}形式，表示其中一個不為 null
   * @param {object} payload
   * @param {object} [{
   *     allowNull = true,
   *     allowUndefined = true,
   *     allowSymbols = null,
   *     assertType = null,
   *   }={}]
   * @returns {boolean} verification result
   */
  checkInput(payload, {
    allowNull = false,
    allowUndefined = false,
    allowSymbols = null,
    assertType = null,
  } = {}) {
    // sails.log.debug('VerifyHelper checkInput payload=>\n', payload);
    try {
      if (!payload) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ payload }));
      }
      if (!_.isObject(payload)) {
        throw Error(MESSAGE.BAD_REQUEST.PARAMETER_FORMAT_INVALID({ payload: typeof payload }));
      }
      // console.log('Object.keys(payload)=>', Object.keys(payload));
      const nullItemIndex = Object
        .keys(payload)
        .findIndex((e) => {
          // console.log('payload[e]=>', payload[e]);
          const value = payload[e];
          // 檢查 null
          if (!allowNull && _.isNull(value)) {
            return true;
          }
          // 檢查 Undefined
          if (!allowUndefined && _.isUndefined(value)) {
            return true;
          }
          // 檢查 array 內容
          if (!_.isNil(value) && _.isArray(value)) {
            return !value.some(i => !_.isNil(i));
          }
          // 如果不是 Undefined/null，則檢查型別是否符合
          if (!_.isNil(value)
              && _.isString(assertType)) {
            // eslint-disable-next-line valid-typeof
            return typeof value !== assertType.toLowerCase();
          }
          // 檢查特殊字元
          if (allowSymbols) {
            const symbols = allowSymbols;
            return vAllowSymbol(payload, symbols);
          }
          return false;
        });
      return (nullItemIndex === -1)
        ? null
        : Object.keys(payload)[nullItemIndex];
    } catch (err) {
      throw err;
    }
  },

  /**
   *  檢查輸入的 payload 是否全部都是純數字
   * @param {string|number} payload
   * @returns {boolean} verification result
   */
  isNotNumeric(payload, {
    allowNull = false,
    allowUndefined = false,
  } = {}) {
    sails.log.debug('VerifyHelper isNumeric payload=>\n', payload);
    try {
      if (!payload) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ payload }));
      }
      if (!_.isObject(payload)) {
        throw Error(MESSAGE.BAD_REQUEST.PARAMETER_FORMAT_INVALID({ payload: typeof payload }));
      }
      const targetIndex = Object
        .keys(payload)
        .findIndex((e) => {
          if (typeof payload[e] === 'string') {
            return !Validator.isNumeric(payload[e], { no_symbols: true });
          }
          return !_.isFinite(payload[e]);
        });
      // console.log('targetIndex=>', targetIndex);
      return (targetIndex === -1)
        ? null
        : Object.keys(payload)[targetIndex];
      // return this.checkInput(payload, {
      //   allowNull,
      //   allowUndefined,
      //   assertType: 'number',
      // });
    } catch (e) {
      throw e;
    }
  },

  /**
   *  檢查輸入的 payload 是否全部都是字串
   * @param {string|number} payload
   * @returns {boolean} verification result
   */
  isNotString(payload, {
    allowNull = false,
    allowUndefined = false,
  } = {}) {
    sails.log.debug('VerifyHelper isNotString payload=>\n', payload);
    try {
      return this.checkInput(payload, {
        allowNull,
        allowUndefined,
        assertType: 'string',
      });
    } catch (e) {
      throw e;
    }
  },

  /**
   * 驗證傳入的值是否為合格密碼。
   * @param {string|number} payload
   * @param {object} {
   *     isAlphabet = true,
   *     isAlphanumeric = false,
   *     locale = ['en-US'],
   *     minLength = 1,
   *     isNoSpace = true,
   *   }
   * @returns {boolean} validation result
   */
  isPassword(payload, {
    isOnlyAlphabet = false,
    isOnlyNumeric = false,
    isAlphanumeric = true,
    isNoSpace = true,
    allowSymbols = null,
    minLength = 1,
  } = {}) {
    sails.log.debug('VerifyHelper isPassword payload=>\n', payload);
    let result = {
      isValid: true,
      rule: null,
    };
    try {
      if (!payload) {
        throw Error(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER({ payload }));
      }
      // allowSymbols.reduce((f, r) => `/${f}/${r}`)
      const vNumeric = () => Validator.isNumeric(payload, { no_symbols: true });
      const vMinLength = () => Validator.isLength(payload, { min: minLength });
      const vNoSpace = () => !Validator.isEmpty(payload);
      // 檢查是否為純字母組合
      if (isOnlyAlphabet && !vAllowSymbol(payload, ['a-z', 'A-Z'])) {
        result = {
          isValid: false,
          rule: { ...result.rule, isOnlyAlphabet },
        };
      }
      // 檢查是否為純數字組合
      if (isOnlyNumeric && !vNumeric()) {
        result = {
          isValid: false,
          rule: { ...result.rule, isOnlyNumeric },
        };
      }
      // 檢查是否有數字字母組合
      if (isAlphanumeric && !vAllowSymbol(payload, ['a-z', 'A-Z', '0-9'])) {
        result = {
          isValid: false,
          rule: {
            ...result.rule,
            isAlphanumeric,
          },
        };
      }
      // 檢查長度
      if (minLength && !vMinLength()) {
        result = {
          isValid: false,
          rule: { ...result.rule, minLength },
        };
      }
      // 檢查空白字元
      if (isNoSpace && !vNoSpace()) {
        result = {
          isValid: false,
          rule: { ...result.rule, isNoSpace },
        };
      }
      // 檢查特殊字元
      if (allowSymbols) {
        let symbols = allowSymbols;
        if (isOnlyAlphabet) {
          symbols = symbols.concat(['a-z', 'A-Z']);
        }
        if (isAlphanumeric) {
          symbols = symbols.concat(['a-z', 'A-Z', '0-9']);
        }
        result = {
          isValid: vAllowSymbol(payload, symbols),
          rule: { ...result.rule, allowSymbols },
        };
      }
      return result;
    } catch (e) {
      throw e;
    }
  },

  validateJson({
    schema = null,
    data = null,
  }, {
    debug = false,
  } = {}) {
    try {
      const Logger = (...message) => (debug
        ? console.debug(...message)
        : null);
      if (!_.isObject(schema)) {
        throw Error(MESSAGE.BAD_REQUEST.PARAMETER_FORMAT_INVALID({ schema: typeof schema }));
      }
      if (!_.isObject(data)) {
        throw Error(MESSAGE.BAD_REQUEST.PARAMETER_FORMAT_INVALID({ data: typeof data }));
      }
      // console.log('Object.keys(data)=>', Object.keys(data));
      let validatorRule;
      const index = Object
        .keys(schema)
        .findIndex((eachKey) => {
          const eachSchema = schema[eachKey];
          const eachItem = data[eachKey];
          const isRequired = eachSchema.required;
          Logger('\n\n===============\n');
          Logger('validate key=>', eachKey, ', value=>', eachItem);
          if (isRequired && _.isNil(eachItem)) {
            Logger('_.isNil(eachItem)=>', _.isNil(eachItem));
            validatorRule = ['isRequired'];
            return true;
          }
          if (!_.isNil(eachItem)) {
            const mode = eachSchema.mode || 'some';
            return eachSchema.validator[mode]((rule) => {
              Logger('------------');
              Logger('rule=>', rule);
              validatorRule = rule;
              const validatorName = _.first(rule);
              const validator = jsonValidator[validatorName];
              Logger('validator=>', validatorName);
              if (_.isNil(validator)) {
                throw Error(`[!] target validator "${validatorName}" not exists!`);
              }
              const options = _.last(rule);
              // const runnable = new Promise((resolve, reject) => {
              return !validator(eachItem, options);
              // .then(res => resolve(res))
              // .catch(err => reject(err));
              // });
              // const result = runnable();
              // Logger('res=>', !result);
              // return !result;
            });
          }
          return false;
        });
      Logger('index=>', index);
      const isValid = (index === -1);
      const errorKey = Object.keys(schema)[index];
      return {
        isValid,
        errorKey: isValid
          ? null
          : errorKey,
        errorValue: isValid
          ? null
          : data[errorKey],
        errorRule: isValid
          ? null
          : validatorRule,
      };
    } catch (err) {
      throw err;
    }
  },

  getJoi: () => Joi,

  getJoiObjectSchema(keys) {
    return _.isFunction(keys)
      ? Joi.object().keys(keys(Joi))
      : Joi.object().keys(keys);
  },

  getJoiValidate({
    value,
    schema,
    options,
    callback,
  }) {
    console.log('options=>', options);
    const funcSchema = _.isObject(options)
      ? Joi
        .object()
        .options(options)
        .keys(schema(Joi))
      : Joi
        .object()
        .keys(schema(Joi));
    return Joi.validate(
      value,
      _.isFunction(schema)
        ? funcSchema
        : schema,
      options,
      callback,
    );
  },

  getJoiBasicListParamSchema() {
    const j = this.getJoi();
    return {
      langCode: j.string().optional(),
      curPage: j.number().integer().min(1).optional(),
      perPage: j.number().integer().min(1).optional(),
      sort: j.string().optional(),
      sortBy: j.string().optional(),
      keyword: j.string().optional().empty(''),
    };
  },

  getJoiRequiredSchemaByKey({ schema, requiredKeys }) {
    const schemaWithRequiredKeys = Object.assign({}, schema);
    requiredKeys.forEach((e) => {
      schemaWithRequiredKeys[e] = schema[e].required();
    });
    // console.log('scheme=>', schema);
    return schemaWithRequiredKeys;
  },
};

module.exports = {
  ...Validator,
  ...theValidator,
};
