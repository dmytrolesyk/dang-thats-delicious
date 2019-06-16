const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title:  'Login Form'});
};

exports.registerForm = (req, res) => {
  res.render('register', { title:  'Register Form'});
};

exports.validateRegister = (req, res, next) => {
  console.log(req.body);
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That email is not valid').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody('password', 'Password cannot be blank').notEmpty();
  req.checkBody('confirm-password', 'Password cannot be blank').notEmpty();
  req.checkBody('confirm-password', 'Oops! Your passwords do not match!')
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(e => e.msg));
    return res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash(),
    });
  }
  next();
};

exports.register = async (req, res, next) => {
  const {
    email,
    name,
    password
  } = req.body;
  const user = new User({
    email,
    name,
  });
  const register = promisify(User.register, User);
  await register(user, password);
  next();
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
  const { name, email } = req.body;
  const { _id } = req.user;
  const updates = { name, email };
  const user = await User.findOneAndUpdate(
    { _id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' },
  );
  req.flash('success', 'Updated the profile!');
  res.redirect('back');
};
