/** @module UtilHelper */

module.exports = {
  /**
   * 將給予的數值格式化至指定位數的小數點並四捨五入。
   * @version 1.0
   * @param Required {number} num 要格式化的數值
   * @param Required {number} exponentValue 要格式化小數點位數
   * @example 依據 User ID 更新 User，並且更新連帶的 Parent 與 Student，同時有給予一組輸入格式 format。
   * UtilHelper.formatDecimalFloat(4.32, 1) == 4.3
   * @returns {number} float that fixed to
   */
  formatDecimalFloat: (num, exponentValue) => {
    const float = parseFloat(num);
    const size = Math.pow(10, (exponentValue || 1));
    return Math.round(float * size) / size;
  },

  /**
   * 將編碼過的字串解碼，並 parse 為 Object 或 Array 後回傳。
   * @version 1.0
   * @param Required {string} encodedParam 要解碼的參數。
   * @param Required {object} typeClass(Array|Object) 解碼後必須是 Object 或是 Array。
   * @example UtilHelper.decodeAndParseParams(%7B%22a%22%3A10%7D, Object) === { a: 10 }
   * @returns {Object|Array} result
   */
  decodeAndParseParams: (encodedParam, typeClass) => {
    try {
      const isTypeClassValid = (typeClass instanceof Object) || (typeClass instanceof Array);
      if (!typeClass || !isTypeClassValid) {
        throw Error(MESSAGE.ERROR.UTIL.PARAM_SHOULD_BE_ARRAY_OR_OBJECT);
      }
      let json;
      try {
        json = JSON.parse(decodeURIComponent(encodedParam));
      } catch (e) {
        throw Error(MESSAGE.ERROR.UTIL.JSON_PARSE_ERROR);
      }
      if (json instanceof typeClass) {
        return json;
      }
      if (!(typeClass instanceof Object)) {
        throw Error(MESSAGE.ERROR.UTIL.PARSE_OBJECT_FAILED);
      }
      // throw Error(MESSAGE.ERROR.UTIL.PARSE_ARRAY_FAILED);
      return json;
    } catch (e) {
      sails.log.warn(e);
      throw e;
    }
  },
};
