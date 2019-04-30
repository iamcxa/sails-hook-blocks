/****************************************************************************
*                                                                           *
* Export custom response messages to global accessible, so you can use them *
* like this: MESSAGE.BAD_REQUEST.NO_TARGET_FOUNDED('something not found').  *
*                                                                           *
/****************************************************************************/

module.exports = {
  ...sails.config.messages,
};
