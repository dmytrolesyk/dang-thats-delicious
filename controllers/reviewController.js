const mongoose = require('mongoose');
const Review = mongoose.model('Review');


exports.addReview = async (req, res) => {
  const { _id: author } = req.user;
  const { text, rating } = req.body;
  const { id: store } = req.params;
  const data = {
    author,
    text,
    rating,
    store
  };
  const newReview = new Review(data);
  await newReview.save();
  req.flash('success', 'Review Saved!');
  res.redirect('/');
};

