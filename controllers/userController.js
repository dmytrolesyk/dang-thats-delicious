const mongoose = require('mongoose');
// const User = mongoose.model('User');

exports.loginForm = (req, res) => {
  res.render('login', { title:  'Login Form'});
};

exports.registerForm = (req, res) => {
  res.render('register', { title:  'Register Form'});
};


exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'That email is not valid').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false,
  });
  req.checkBody('password', 'Password cannot be blank').notEmpty();
  req.checkBody('password-confirm', 'Password cannot be blank').notEmpty();
  req.checkBody('password-confirm', 'Oops! Your passwords do not match!')
    .equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(e => e.msg));
    res.render('register', {
      title: 'Register',
      body: req.body,
      flashes: req.flash(),
    });
    return;
  }
  next();
};