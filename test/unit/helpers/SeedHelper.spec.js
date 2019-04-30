import faker from 'faker';

describe('about SeedHelper operations.', () => {
  it('SeedHelper create should success.', async () => {
    try {
      const createdUsers = await SeedHelper.create({
        size: 10,
        model: User,
        data: i => ({
          username: `SeedHelper-username_${i + 1}`,
          email: `SeedHelper-email_${i + 2}`,
        }),
      });
      // console.log('createdUsers=>', createdUsers);
      // each=> { isActivated: true,
      //   isConfirmed: false,
      //   lastLoginFailedCount: 0,
      //   id: 63,
      //   username: 'username_p_7',
      //   email: 'email5_7',
      //   updatedAt: 2018-11-20T09:18:13.710Z,
      //   createdAt: 2018-11-20T09:18:13.668Z,
      //   tokenVerifyEmail: '6646a34b7e1b745e28ab077afa7f5ee7' }
      createdUsers.length.should.be.eq(10);
      createdUsers.forEach((user, index) => {
        user.username.should.be.an('string');
        user.username.indexOf(index + 1).should.be.gt(0);
        user.email.should.be.an('string');
        user.email.indexOf(index + 2).should.be.gt(0);
        should.not.exist(user.formated);
      });
    } catch (e) {
      sails.log.error(e);
    }
  });

  it('SeedHelper with format callback create should success.', async () => {
    try {
      const createdUsers = await SeedHelper.create({
        size: 10,
        model: User,
        data: i => ({
          username: `SeedHelper-username_${faker.random.alphaNumeric()}_${i + 1}`,
          email: `SeedHelper-email${faker.random.alphaNumeric()}_${i + 2}`,
        }),
        include: [
        ],
        // eslint-disable-next-line arrow-body-style
        formatCb: (each) => {
          // console.log('each=>', each);
          return {
            ...each,
            formated: true,
          };
        },
      });
      // console.log('createdUsers=>', createdUsers);
      createdUsers.forEach((user, index) => {
        user.username.should.be.an('string');
        user.email.should.be.an('string');
        user.username.indexOf(index + 1).should.be.gt(0);
        user.email.indexOf(index + 2).should.be.gt(0);
        user.formated.should.be.eq(true);
      });
    } catch (e) {
      sails.log.error(e);
    }
  });
});
