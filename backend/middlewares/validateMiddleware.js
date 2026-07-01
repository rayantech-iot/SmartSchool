function validate(validatorFn) {
  return (req, res, next) => {
    const errors = validatorFn(req);
    if (errors.length > 0) {
      req.flash('error', errors[0]);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, errors });
      }
      return res.redirect('back');
    }
    next();
  };
}

module.exports = { validate };
