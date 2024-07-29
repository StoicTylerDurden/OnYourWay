// controllers/trips.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Helper function to check if a date is in the past
function isDateInThePast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Clear the time part
  return date < today;
}

router.get('/', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const trips = currentUser.trips;
    res.render('trips/index.ejs', { trips });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.get('/new', async (req, res) => {
  res.render('trips/new.ejs');
});

router.post('/', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);

    const tripDate = new Date(req.body.date);

    if (isDateInThePast(tripDate)) {
      // Handle error (e.g., redirect with error message or render a page with an error message)
      return res.status(400).send('The trip date cannot be in the past.');
    }

    req.body.date = tripDate;

    // Save trip details
    currentUser.trips.push(req.body);

    // Update user's name, age, and gender
    currentUser.name = req.body.name;
    currentUser.age = req.body.age;
    currentUser.gender = req.body.gender;
    await currentUser.save();

    res.redirect(`/users/${currentUser._id}/trips`);
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

router.get('/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const trip = currentUser.trips.id(req.params.tripId);
    res.render('trips/show.ejs', { trip: trip, user: currentUser });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

router.delete('/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const trip = currentUser.trips.id(req.params.tripId);
    trip.deleteOne();
    await currentUser.save();
    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

router.get('/:tripId/edit', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const trip = currentUser.trips.id(req.params.tripId);
    res.render('trips/edit.ejs', { trip: trip, user: currentUser });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

router.put('/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const trip = currentUser.trips.id(req.params.tripId);

    const tripDate = new Date(req.body.date);

    if (isDateInThePast(tripDate)) {
      // Handle error (e.g., redirect with error message or render a page with an error message)
      return res.status(400).send('The trip date cannot be in the past.');
    }

    // Update trip details
    trip.set({
      startLocation: req.body.startLocation,
      endLocation: req.body.endLocation,
      availableSeats: req.body.availableSeats,
      date: tripDate,
    });

    // Update user details
    currentUser.name = req.body.name;
    currentUser.age = req.body.age;
    currentUser.gender = req.body.gender;

    await currentUser.save();
    res.redirect(`/users/${currentUser._id}/trips/${req.params.tripId}`);
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

module.exports = router;
