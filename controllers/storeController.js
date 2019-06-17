const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');


const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      return next(null, true);
    }
    next({ message: `That filetype isn't allowed` }, false);
  },
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  if(!req.file) {
    return next();
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  next();
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/stores/${store.slug}`);
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1
  const limit = 4;
  const skip = (page * limit) - limit;
  const countPromise = Store.count();
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    return res.redirect(`/stores/page/${pages}`);
  }
  res.render('stores', { title: 'Stores', stores, count, pages, page });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!')
  }
};

exports.editStore = async (req, res) => {
  const { id: _id } = req.params;
  const store = await Store.findOne({ _id });
  confirmOwner(store, req.user);
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  const { id: _id } = req.params;
  req.body.location.type = 'Point';
  const store = await Store.findOneAndUpdate({ _id }, req.body, {
    new: true,
    runValidators: true,
  }).exec();
  req.flash(
    'success',
    `Store ${store.name} was successfully updated.
    <a href="/stores/${store.slug}">View Store</a>`
  );
  res.redirect('/stores');
};

exports.getStoreBySlug = async (req,  res, next) => {
  const { slug } = req.params;
  const store = await Store.findOne({ slug }).populate('author reviews');
  if (!store) return next();
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const { tag } = req.params;
  const tagQuery = tag || { $exists: true };
  const stores = await Store.find({ tags: tagQuery });
  const render = tags => res.render('tags', { tags, tag, stores, title:  'Tags' });
  Store.getTagsList(render);
};

exports.searchStores = async (req, res) => {
  const stores = await Store
    .find({
      $text: {
        $search: req.query.q,
      },
    }, {
      score: { $meta: 'textScore' },
    })
    .sort({
      score: { $meta: 'textScore' },
    });
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = Object.values(req.query).reverse().map(parseFloat);
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates,
        },
        $maxDistance: 10000
      }
    }
  };
  const stores = await Store
    .find(query)
    .select('slug name description location photo')
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => res.render('map', { title: 'Map' });

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { hearts: req.params.id  } },
      { new: true },
    );
  res.json(user);
};

exports.heartedStores = async (req, res) => {
  const user = await User
    .findOne({ _id: req.user._id })
    .populate('hearts');
  res.render('stores', { title: 'Liked Stores', stores: user.hearts });
};

exports.getTopStores = async (req, res) => Store.getTopStores(
  stores => res.render('topStores', { stores, title: 'Top Stores!' })
);