const faker = require('faker');

describe('about UtilHelper operations.', () => {
  it('UtilHelper decodeAndParseParams Array should success.', async () => {
    const result = UtilHelper.decodeAndParseParams(
      encodeURIComponent(JSON.stringify([{ name: 'abc', type: 'big' }])),
      Array,
    );
    // console.log('result=>', result);
  });

  it('UtilHelper decodeAndParseParams Object should success.', async () => {
    const result = UtilHelper.decodeAndParseParams(
      encodeURIComponent(JSON.stringify({ name: 'abc', type: 'big' })),
      Object,
    );
    // console.log('result=>', result);
  });


  it('UtilHelper decodeAndParseParams Object should success.', async () => {
    try {
      UtilHelper.decodeAndParseParams(
        encodeURIComponent(JSON.stringify({ name: 'abc', type: 'big' })),
        Array,
      );
    } catch (err) {
      err.message.should.be.eq(MESSAGE.ERROR.UTIL.PARSE_ARRAY_FAILED);
    }
  });

  it('UtilHelper decodeAndParseParams parse json should failure.', async () => {
    try {
      UtilHelper.decodeAndParseParams(
        "{ name: 'abc', type: 'big' /}",
        Array,
      );
      // console.log('result=>', result);
    } catch (err) {
      // console.log('err=>', err);
      // console.log('err.message=>', err.message);
      // console.log('err.toString()=>', err.toString());
      err.message.should.be.eq(MESSAGE.ERROR.UTIL.JSON_PARSE_ERROR);
    }
  });

  it('UtilHelper decodeAndParseParams with wrong class type should failure.', async () => {
    try {
      UtilHelper.decodeAndParseParams(
        encodeURIComponent(JSON.stringify({ name: 'abc', type: 'big' })),
        'Object',
      );
      // console.log('result=>', result);
    } catch (err) {
      // console.log('err=>', err);
      // console.log('err=>', err.toString());
      // console.log('err=>', err.message);
      err.message.should.be.eq(MESSAGE.ERROR.UTIL.PARAM_SHOULD_BE_ARRAY_OR_OBJECT);
    }
  });
});
