const passport = require('passport');

module.exports = async function signin({
  model,
  input,
  action,
  protocol,
}) {
  const { req, res } = this;
  try {
    return passport.authenticate('local', (err, user, info) => {
      console.log('passport.authenticate');
      if ((err) || (!user)) {
        return res.ok({
          message: info.message,
          user
        });
      }
      return req.login(user, (err) => {
        if (err) return res.ok(err);
        return res.ok({
          message: info.message,
          user
        });
      });
    })(req, res);
  } catch (e) {
    throw e;
  }
};




