const dotenv = require('dotenv');

dotenv.config();
const express = require('express');

const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require('./middleware/pass-user-to-view.js');

// CONTROLLERS
const tripsCtrl = require('./controllers/trips.js');
const authController = require('./controllers/auth.js');

const port = process.env.PORT ? process.env.PORT : '4000';

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(morgan('dev'));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
      }),
  })
);
app.use(passUserToView);

// LINK TO PUBLIC DIRECTORY
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect(`/users/${req.session.user._id}/trips`);
  } else {
    res.render('index.ejs');
  }
});

app.use('/auth', authController);
app.use(isSignedIn);
app.use('/users/:userId/trips', tripsCtrl);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});