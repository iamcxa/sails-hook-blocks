/** @module jsonValidator */

import Validator from 'validator';

const jsonValidator = {
  /**
   * 驗證型別是否為傳入參數中的其中一種。
   * @param {any} value
   * @param {Array.<string>} [types=[]]
   * @returns {boolean} validation result
   */
  isTypeof(value, types = []) {
    return new Promise((resolve) => {
      // eslint-disable-next-line valid-typeof
      resolve(types.some(type => typeof value === type.toLowerCase()));
    });
  },

  isPassword(value, options = {}) {
    return new Promise((resolve) => {
      resolve(VerifyHelper.isPassword(value, options));
    });
  },

  isEmail(value) {
    return new Promise((resolve) => {
      resolve(Validator.isEmail(value));
    });
  },

  isLength(value, {
    max = Number.MAX_SAFE_INTEGER,
    min = 0,
  } = {}) {
    return new Promise((resolve) => {
      const stringifyValue = value && value.toString();
      resolve((value && stringifyValue && stringifyValue.length)
        ? (stringifyValue.length > min && stringifyValue.length < max)
        : false);
    });
  },

  isModel(value, {
    modelName,
    column,
  } = {}) {
    return new Promise((resolve, reject) => {
      const model = sails.models[modelName.toLowerCase()];
      console.log('model=>', model);
      if (!model) { throw Error(`model "${modelName}" not exists.`); }
      return model
        .count({
          where: { [column]: value },
        })
        .then(res => resolve(!!res))
        .catch(err => reject(err));
    });
  },

  isUnique(value, {
    modelName,
    column,
  } = {}) {
    return new Promise((resolve, reject) => {
      const model = sails.models[modelName.toLowerCase()];
      if (!model) { throw Error(`model "${modelName}" not exists.`); }
      // const count = await model.count({
      //   where: { [column]: value },
      //   attributes: ['id'],
      // });
      // console.log('count=>', count);
      // resolve(!((count > 0)));
      return model
        .count({
          where: { [column]: value },
        })
        .then(res => {
          console.log('res=>', res);
          return resolve(!!res);
        })
        .catch(err => reject(err));
    });
  },
};

export default jsonValidator;
