/* eslint-disable no-unused-vars */

export default async function init({
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
