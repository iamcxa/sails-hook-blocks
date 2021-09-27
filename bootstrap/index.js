/* eslint-disable no-unused-vars */

module.exports = async function init({
  isDevMode = sails.config.environment === 'development',
  isProdMode = sails.config.environment === 'production',
  isInitSeedData = true,
  isInitExtendData = true,
} = {}) {
  try {
    console.log('bootstrap blacksails');
  } catch (e) {
    throw e;
  }
}
