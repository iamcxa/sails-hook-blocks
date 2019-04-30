import faker from 'faker';

describe('about VerifyHelper operations.', () => {
  let user;

  before('', async () => {
    user = await User.create({
      username: faker.internet.userName(),
      email: faker.internet.email(),
    });
  });

  it('VerifyHelper.validateJson should success.', async () => {
    const data = {
      userId: user.id,
      email: 'wwqe@weew.ew',
      age: 5,
      password: '123456789',
      everyRulePass: 'name11@mail.com',
      username: 'name@mail.com',
    };
    const schema = {
      everyRulePass: {
        value: data.everyRulePass,
        required: false,
        validator: [
          ['isTypeof', ['string']],
          ['isEmail'],
          ['isLength', {
            min: 0,
            max: 20,
          }],
        ],
      },
      username: {
        // mode: 'some',
        value: data.username,
        required: false,
        validator: [
          ['isEmail'],
          // ['isLength', {
          //   min: 0,
          //   max: 20,
          // }],
        ],
      },
      email: {
        value: data.email,
        required: true,
        validator: [
          ['isEmail'],
        ],
      },
      notExist: {
        value: data.notExist,
        required: false,
        validator: [
          ['isEmail'],
        ],
      },
      age: {
        value: data.age,
        required: true,
        validator: [
          ['isTypeof', ['number']],
        ],
      },
      password: {
        value: data.password,
        // type: ['number', 'string'],
        required: false,
        validator: [
          ['isPassword', {
            isOnlyAlphabet: false,
            isOnlyNumeric: false,
            isAlphanumeric: true,
            isNoSpace: true,
            allowSymbol: ['@'],
          }],
          ['isLength', {
            min: 5,
            max: 10,
          }],
        ],
      },
      userId: {
        value: data.userId,
        // type: ['number', 'string'],
        required: false,
        validator: [
          ['isTypeof', ['number', 'string']],
          ['isModel', {
            modelName: 'User',
            column: 'id',
          }],
          ['isUnique', {
            modelName: 'User',
            column: 'id',
          }],
          ['isLength', {
            min: 0,
            max: 10,
          }],
        ],
      },
    };
    const result = VerifyHelper.validateJson({ schema, data }, {
      debug: true,
    });
    console.log('result=>');
    console.dir(result);

    result.isValid.should.be.eq(true);
  });

  it('VerifyHelper use Joi should success.', async () => {
    const joi = VerifyHelper.getJoi();
    const schema = VerifyHelper
      .getJoiObjectSchema({
        username: joi.string().alphanum().min(3).max(30)
          .required(),
        password: joi.string().regex(/^[a-zA-Z0-9]{3,30}$/),
        access_token: [joi.string(), joi.number()],
        birthyear: joi.number().integer().min(1900).max(2013),
        email: joi.string().email({ minDomainAtoms: 2 }),
      })
      .with('username', 'birthyear')
      .without('password', 'access_token');

    // Return result.
    const result = VerifyHelper
      .getJoi()
      .validate({ username: 'abc', birthyear: 1994 }, schema);
    // result.error === null -> valid

    console.log('result=>');
    console.dir(result);

    should.not.exist(result.error);
  });

  it('VerifyHelper use Joi should failed.', async () => {
    const data = {
      username: 'ab',
      birthyear: 1894,
    };
    const j = VerifyHelper.getJoi();
    const schema = VerifyHelper
      .getJoiObjectSchema({
        username: j.string().alphanum().min(3).max(30)
          .required(),
        password: j.string().regex(/^[a-zA-Z0-9]{3,30}$/),
        access_token: [j.string(), j.number()],
        birthyear: j.number().integer().min(1900).max(2013),
        email: j.string().email({ minDomainAtoms: 2 }),
      })
      .with('username', 'birthyear')
      .without('password', 'access_token');
    const result = VerifyHelper.getJoiValidate({
      value: data,
      schema,
    });
    // result.error === null -> valid

    console.log('result=>', result.error.message);
    console.dir(result);

    result.error.should.not.be.eq(null);
  });
});
