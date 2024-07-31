// controllers/trips.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

function isDateInThePast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Clear the time part
  return date < today;
}

// Get all trips and filter out current user's trips
router.get('/', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const allUsers = await User.find();

    // Extract all trips with userId
    const allTrips = allUsers.flatMap(user => user.trips.map(trip => ({ ...trip.toObject(), userId: user._id })));
    
    // Filter out current user's trips
    const availableTrips = allTrips.filter(trip => !currentUser.trips.some(userTrip => userTrip._id.equals(trip._id)));

    res.render('trips/index.ejs', { user: currentUser, trips: currentUser.trips, availableTrips });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }

  
});

router.get('/available', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const allUsers = await User.find();

    // Extract all trips with userId
    const allTrips = allUsers.flatMap(user => user.trips.map(trip => ({ ...trip.toObject(), userId: user._id })));
    
    // Filter out current user's trips
    const availableTrips = allTrips.filter(trip => !currentUser.trips.some(userTrip => userTrip._id.equals(trip._id)));

    res.render('trips/available.ejs', { user: currentUser, trips: currentUser.trips, availableTrips });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }

  
});

router.get('/new', async (req, res) => {
    res.render('trips/new.ejs');
  });

// Show trip details
router.get('/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const allUsers = await User.find();
    
    // Find the trip from all users
    let trip = null;
    let tripUser = null;
    for (const user of allUsers) {
      trip = user.trips.id(req.params.tripId);
      if (trip) {
        tripUser = user;
        break;
      }
    }
    
    if (!trip) {
      return res.status(404).send('Trip not found');
    }

    res.render('trips/show.ejs', { trip, user: tripUser || currentUser, currentUserId: req.session.user._id });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});



router.post('/', async (req, res, next) => {
    try {
      const currentUser = await User.findById(req.session.user._id);
  
      req.body.date = new Date(req.body.date);
      req.body.userId = currentUser._id; // Set the userId
  
      // Save trip details
      currentUser.trips.push(req.body);
  
      // Update user's name, age, gender, and email
      currentUser.name = req.body.name;
      currentUser.age = req.body.age;
      currentUser.gender = req.body.gender;
      currentUser.email = req.body.email;
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
    currentUser.email = req.body.email;

    await currentUser.save();
    res.redirect(`/users/${currentUser._id}/trips/${req.params.tripId}`);
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

module.exports = router;
