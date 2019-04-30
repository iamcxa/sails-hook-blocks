/* eslint no-unused-expressions: 0 */
import faker from 'faker';

faker.seed(parseInt(Math.random().toString().split('.').pop(), 10));

const apiPrefix = 'api';
const area = '/auth';
const version = '';

describe('about AuthController operations.', () => {
  const adminPassword = 'admin_password';
  const userPassword = 'user_password';
  let adminUser;
  let normalUser;
  let adminRole;

  before('before Test AuthController operations.', async () => {
    try {
      // create admin user for spec
      adminRole = await Role.findOne({
        where: { authority: 'admin' },
      });
      if (!adminRole) {
        adminRole = await Role.create({
          authority: 'admin',
          title: 'admin',
        });
      }
      // create users: an Admin.
      [adminUser] = await SeedHelper.create({
        size: 1,
        model: User,
        data: i => ({
          username: `just.admin.user.${i + 1}`,
          email: `just.admin.user.${i + 1}@gmail.com`,
          isActivated: true,
          isConfirmed: true,
          Passports: {
            provider: 'local',
            password: adminPassword,
          },
        }),
        include: [Passport],
      });
      const target = await User.findById(adminUser.id);
      await target.addRole(adminRole);
      // create users: an User.
      [normalUser] = await SeedHelper.create({
        size: 1,
        model: User,
        data: i => ({
          username: `just.user.${i + 1}`,
          email: `just.user.${i + 1}@gmail.com`,
          isActivated: true,
          isConfirmed: true,
          Passports: {
            provider: 'local',
            password: userPassword,
          },
        }),
        include: [Passport],
      });
    } catch (e) {
      throw e;
    }
  });

  describe('about Admin User Login operations.', () => {
    let adminUsers;
    let noPasswordAdminUser;
    let notActivatedAdminUser;
    let wrongPasswordAdminUser;
    before('before Test Admin Auth Operations', async () => {
      try {
        // create normal admin user
        adminUsers = await SeedHelper.create({
          size: 3,
          model: User,
          data: i => ({
            username: `admin.${i + 1}`,
            email: `admin${i + 1}@gmail.com`,
            isActivated: true,
            isConfirmed: true,
            Passports: {
              provider: 'local',
              password: adminPassword,
            },
          }),
          include: [Passport],
        });
        [notActivatedAdminUser] = await SeedHelper.create({
          size: 1,
          model: User,
          data: i => ({
            username: `admin.not.activated.${i + 1}`,
            email: `admin.not.activated.${i + 1}@gmail.com`,
            isActivated: false,
            isConfirmed: false,
            Passports: {
              provider: 'local',
              password: adminPassword,
            },
          }),
          include: [Passport],
        });
        [wrongPasswordAdminUser] = await SeedHelper.create({
          size: 1,
          model: User,
          data: i => ({
            username: `admin.wrong.password.${i + 1}`,
            email: `admin.wrong.password.${i + 1}@gmail.com`,
            isActivated: true,
            isConfirmed: true,
            Passports: {
              provider: 'local',
              password: adminPassword,
            },
          }),
          include: [Passport],
        });
        [noPasswordAdminUser] = await SeedHelper.create({
          size: 1,
          model: User,
          data: i => ({
            username: `admin.no.password.${i + 1}`,
            email: `admin.no.password.${i + 1}@gmail.com`,
            isActivated: true,
            isConfirmed: true,
          }),
        });
        for (const admin of adminUsers.concat([
          notActivatedAdminUser,
          noPasswordAdminUser,
        ])) {
          // console.log.log('admin=>', admin);
          const target = await User.findById(admin.id);
          await target.addRole(adminRole);
        }
      } catch (e) {
        throw e;
      }
    });

    it('Admin user login should success', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: adminPassword,
          })
          .expect(200);
        // console.log.log('result===>', result.body);
        result.body.success.should.be.equal(true);
        result.body.data.should.be.an('object');
        result.body.data.Authorization.should.be.a('string');
        result.body.data.user.username.should.be.a('string');
        result.body.data.user.id.should.be.a('number');
        result.body.data.user.id.should.be.equal(user.id);
        const { message } = JSON.parse(MESSAGE.AUTH.LOGIN_SUCCESS());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== admin login ========');
      await Promise.all(adminUsers.map(user => test(user)));
      // console.log('======== admin login ========');
    });

    it('Admin user login and logout should success', async () => {
      const test = async (user) => {
        // testing login
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: adminPassword,
          })
          .expect(200);
        // console.log('result===>', result.body);
        result.body.success.should.be.equal(true);
        result.body.data.should.be.an('object');
        result.body.data.Authorization.should.be.a('string');
        result.body.data.user.username.should.be.a('string');
        result.body.data.user.id.should.be.a('number');
        result.body.data.user.id.should.be.equal(user.id);
        const { message } = JSON.parse(MESSAGE.AUTH.LOGIN_SUCCESS());
        result.body.message.should.be.equal(message);

        // test login then logout
        const logoutResult = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/logout`)
          .expect(200);
        // console.log('logoutResult===>', logoutResult.body);
        result.body.success.should.be.equal(true);
        result.body.data.should.be.an('object');
      };
      // console.log('======== admin login ========');
      await Promise.all(adminUsers.map(user => test(user)));
      // console.log('======== admin login ========');
    });

    it('Admin user gives wrong password login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: 'wrong_password',
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.INVALID_PASSWORD());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== Wrong password login ========');
      await Promise.all([wrongPasswordAdminUser].map(user => test(user)));
      const loginFailedUser = await User.findById(wrongPasswordAdminUser.id);
      loginFailedUser.lastLoginFailedCount.should.be.equal(1);
      // console.log('======== Wrong password login ========');
    });

    it('Admin user gives wrong username login should fail', async () => {
      const test = async (user) => {
        const wrongIdentifier = `${user.username}_wrong`;
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: wrongIdentifier,
            password: adminPassword,
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(wrongIdentifier);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_NOT_FOUND());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== Wrong password login ========');
      await Promise.all(adminUsers.map(user => test(user)));
      // console.log('======== Wrong password login ========');
    });

    it('Admin user account set no password login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: adminPassword,
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_PASSWORD_NOT_SET());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== Wrong password login ========');
      await Promise.all([noPasswordAdminUser].map(user => test(user)));
      // console.log('======== Wrong password login ========');
    });

    it('Admin user account suspended login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: adminPassword,
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_SUSPENDS());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== suspended user login ========');
      await Promise.all([notActivatedAdminUser].map(user => test(user)));
      // console.log('======== suspended user login ========');
    });

    it('Admin user input no password login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: null,
          })
          .expect(400);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        const { message } = JSON.parse(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== No input password login ========');
      await Promise.all(adminUsers.map(user => test(user)));
      // console.log('======== No input password login ========');
    });

    it('Normal user login as admin should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/admin`)
          .send({
            identifier: user.username,
            password: userPassword,
          })
          .expect(401);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_NO_PERMISSION());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== No input password login ========');
      await Promise.all([normalUser].map(user => test(user)));
      // console.log('======== No input password login ========');
    });
  });

  describe('about Normal User Login operations.', () => {
    let normalUsers;
    let noPasswordUser;
    let notActivatedUser;
    let wrongPasswordUser;

    before('before Test Normal User Auth operations.', async () => {
      try {
        // create normal user for spec
        normalUsers = await SeedHelper.create({
          size: 3,
          model: User,
          data: i => ({
            username: `user.${i + 1}`,
            email: `user${i + 1}@gmail.com`,
            isActivated: true,
            isConfirmed: true,
            Passports: {
              provider: 'local',
              password: userPassword,
            },
          }),
          include: [Passport],
        });
        [notActivatedUser] = await SeedHelper.create({
          size: 1,
          model: User,
          data: i => ({
            username: `user.not.activated.${i + 1}`,
            email: `user.not.activated.${i + 1}@gmail.com`,
            isActivated: false,
            isConfirmed: false,
            Passports: {
              provider: 'local',
              password: userPassword,
            },
          }),
          include: [Passport],
        });
        [wrongPasswordUser] = await SeedHelper.create({
          size: 1,
          model: User,
          data: i => ({
            username: `user.wrong.password.${i + 1}`,
            email: `user.wrong.password.${i + 1}@gmail.com`,
            isActivated: true,
            isConfirmed: true,
            Passports: {
              provider: 'local',
              password: userPassword,
            },
          }),
          include: [Passport],
        });
        [noPasswordUser] = await SeedHelper.create({
          size: 1,
          model: User,
          data: i => ({
            username: `user.no.password.${i + 1}`,
            email: `user.no.password.${i + 1}@gmail.com`,
            isActivated: true,
            isConfirmed: true,
          }),
        });
      } catch (e) {
        sails.log.error(e);
        throw e;
      }
    });

    it('Normal user login should success', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: user.username,
            password: userPassword,
          })
          .expect(200);
        // console.log('result===>', result.body);
        result.body.success.should.be.equal(true);
        result.body.data.should.be.an('object');
        result.body.data.Authorization.should.be.a('string');
        result.body.data.user.username.should.be.a('string');
        result.body.data.user.id.should.be.a('number');
        result.body.data.user.id.should.be.equal(user.id);
      };
      // console.log('======== Normal login ========');
      await Promise.all(normalUsers.map(user => test(user)));
      // console.log('======== Normal login ========');
    });

    it('Normal user login and logout should success', async () => {
      const test = async (user) => {
        // testing login
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: user.username,
            password: userPassword,
          })
          .expect(200);
        // console.log('result===>', result.body);
        result.body.success.should.be.equal(true);
        result.body.data.should.be.an('object');
        result.body.data.Authorization.should.be.a('string');
        result.body.data.user.username.should.be.a('string');
        result.body.data.user.id.should.be.a('number');
        result.body.data.user.id.should.be.equal(user.id);

        // test login then logout
        const logoutResult = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/logout`)
          .expect(200);
        // console.log('logoutResult===>', logoutResult.body);
        result.body.success.should.be.equal(true);
        result.body.data.should.be.an('object');
      };
      // console.log('======== Normal login ========');
      await Promise.all(normalUsers.map(user => test(user)));
      // console.log('======== Normal login ========');
    });

    it('Normal user gives wrong password login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: user.username,
            password: 'wrong_password',
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.INVALID_PASSWORD());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== Wrong password login ========');
      await Promise.all(normalUsers.map(user => test(user)));
      // console.log('======== Wrong password login ========');
    });

    it('Normal user gives wrong username login should fail', async () => {
      const test = async (user) => {
        const wrongIdentifier = `${user.username}_wrong`;
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: wrongIdentifier,
            password: userPassword,
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(wrongIdentifier);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_NOT_FOUND());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== Wrong password login ========');
      await Promise.all(normalUsers.map(user => test(user)));
      // console.log('======== Wrong password login ========');
    });

    it('Normal user account set no password login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: user.username,
            password: userPassword,
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_PASSWORD_NOT_SET());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== Wrong password login ========');
      await Promise.all([noPasswordUser].map(user => test(user)));
      // console.log('======== Wrong password login ========');
    });

    it('Normal user account suspended login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: user.username,
            password: userPassword,
          })
          .expect(403);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        result.body.extra.username.should.be.equal(user.username);
        const { message } = JSON.parse(MESSAGE.AUTH.USER_SUSPENDS());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== suspended user login ========');
      await Promise.all([notActivatedUser].map(user => test(user)));
      // console.log('======== suspended user login ========');
    });

    it('Normal user input no password login should fail', async () => {
      const test = async (user) => {
        const result = await request(sails.hooks.http.app)
          .post(`/${apiPrefix}${area}${version}/login/local`)
          .send({
            identifier: user.username,
            password: null,
          })
          .expect(400);
        // console.log('result===>', result.body);

        result.body.success.should.be.equal(false);
        result.body.isAuthenticated.should.be.equal(false);
        should.not.exist(result.body.Authorization);
        result.body.should.be.an('object');
        const { message } = JSON.parse(MESSAGE.BAD_REQUEST.NO_REQUIRED_PARAMETER());
        result.body.message.should.be.equal(message);
      };
      // console.log('======== No input password login ========');
      await Promise.all(normalUsers.map(user => test(user)));
      // console.log('======== No input password login ========');
    });
  });

  describe('about Normal User Register operations.', () => {
    let userWillBeRegister;

    before('Before test normal user register operations', async () => {
    });

    it('Normal user register should success', async () => {
      // console.log('======== Normal user register ========');
      const userData = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      const result = await request(sails.hooks.http.app)
        .post(`/${apiPrefix}${area}${version}/register/local`)
        .send({
          ...userData,
        })
        .expect(200);
      // console.log('result===>', result.body);

      result.body.success.should.be.equal(true);
      // register will not automatically login user.
      result.body.isAuthenticated.should.be.equal(false);
      should.not.exist(result.body.Authorization);
      result.body.should.be.an('object');
      const { message } = JSON.parse(MESSAGE.AUTH.REGISTER_SUCCESS());
      result.body.message.should.be.equal(message);
      // console.log('======== Normal user register ========');
    });

    it('Normal user duplicated username register should fail', async () => {
      const userData = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      await User.create({
        ...userData,
        Passports: {
          provider: 'local',
          password: userData.password,
        },
      }, {
        include: [Passport],
      });
      // console.log('======== Normal user duplicated username register ========');
      const result = await request(sails.hooks.http.app)
        .post(`/${apiPrefix}${area}${version}/register/local`)
        .send({
          ...userData,
        })
        .expect(400);
      // console.log('result===>', result.body);

      result.body.success.should.be.equal(false);
      result.body.isAuthenticated.should.be.equal(false);
      should.not.exist(result.body.Authorization);
      result.body.should.be.an('object');
      const { message } = JSON.parse(MESSAGE.AUTH.USERNAME_HAS_EXISTED());
      result.body.message.should.be.equal(message);
      result.body.extra.username.should.be.equal(userData.username);
      // console.log('======== Normal user duplicated username register ========');
    });

    it('Normal user register-and-login should success', async () => {
      // console.log('======== register-and-login ========');
      const userData = {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: faker.internet.password(),
      };
      const registerResult = await request(sails.hooks.http.app)
        .post(`/${apiPrefix}${area}${version}/register/local`)
        .send({
          ...userData,
        })
        .expect(200);
      // console.log('registerResult===>', registerResult.body);

      // IMPORTANT:
      // we should activate user manually here,
      // because the column isActivated maybe set to false as default in some condition.
      // this will effect API response 403 'user suspend'
      {
        const theNewUser = await User.findById(registerResult.body.data.user.id);
        theNewUser.isActivated = true;
        theNewUser.activatedAt = new Date();
        theNewUser.isConfirmed = true;
        theNewUser.confirmedAt = new Date();
        await theNewUser.save();
      }

      registerResult.body.success.should.be.equal(true);
      // register will not automatically login user.
      registerResult.body.isAuthenticated.should.be.equal(false);
      should.not.exist(registerResult.body.Authorization);
      registerResult.body.should.be.an('object');
      {
        const { message } = JSON.parse(MESSAGE.AUTH.REGISTER_SUCCESS());
        registerResult.body.message.should.be.equal(message);
      }

      const loginResult = await request(sails.hooks.http.app)
        .post(`/${apiPrefix}${area}${version}/login/local`)
        .send({
          identifier: userData.username,
          password: userData.password,
        })
        .expect(200);
      // console.log('loginResult===>', loginResult.body);
      loginResult.body.success.should.be.equal(true);
      loginResult.body.data.should.be.an('object');
      loginResult.body.data.Authorization.should.be.a('string');
      loginResult.body.data.user.username.should.be.a('string');
      loginResult.body.data.user.id.should.be.a('number');
      {
        const { message } = JSON.parse(MESSAGE.AUTH.LOGIN_SUCCESS());
        loginResult.body.message.should.be.equal(message);
      }
      // console.log('======== register-and-login ========');
    });
  });
});
