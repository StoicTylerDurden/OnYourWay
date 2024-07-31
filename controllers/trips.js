// controllers/trips.js
// controllers/trips.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Helper function to check if the trip date is in the past
function isDateInThePast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Clear the time part
  return date < today;
}

// Render the form for creating a new trip
router.get('/new', async (req, res) => {
  res.render('trips/new.ejs');
});

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

// Get available trips excluding the current user's trips
router.get('/available', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const allUsers = await User.find();

    const allTrips = allUsers.flatMap(user => user.trips.map(trip => ({ ...trip.toObject(), userId: user._id })));

    const availableTrips = allTrips.filter(trip => !currentUser.trips.some(userTrip => userTrip._id.equals(trip._id)));

    res.render('trips/available.ejs', { user: currentUser, trips: currentUser.trips, availableTrips });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// Create a new trip
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

// Book a trip
router.post('/:tripId/book', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const tripOwner = await User.findOne({ 'trips._id': req.params.tripId });

    if (!tripOwner || tripOwner._id.equals(currentUser._id)) {
      return res.redirect('/');
    }

    const trip = tripOwner.trips.id(req.params.tripId);

    if (trip.availableSeats <= 0) {
      return res.send('No available seats.');
    }

    // Check if the user has already booked this trip
    if (currentUser.bookedTrips.some(bookedTripId => bookedTripId.equals(trip._id))) {
      return res.send('You have already booked this trip.');
    }

    // Add the trip ID to the current user's booked trips
    currentUser.bookedTrips.push(trip._id);

    // Decrease available seats
    trip.availableSeats -= 1;

    await tripOwner.save();
    await currentUser.save();
    res.redirect(`/users/${currentUser._id}/trips/booked`);
  } catch (error) {
    console.error(error);
    return res.redirect('/');
  }
});

// View booked trips
router.get('/booked', async (req, res, next) => {
  try {
    console.log('Triggered Get booked route');
    const user = await User.findById(req.session.user._id); // Get the current user

    // Ensure the bookedTrips array exists and is populated
    if (!user.bookedTrips || user.bookedTrips.length === 0) {
      return res.render('trips/booked.ejs', { bookedTrips: [] });
    }

    // Map booked trips to include details
    const bookedTrips = await Promise.all(
      user.bookedTrips.map(async (tripId) => {
        const tripOwner = await User.findOne({ 'trips._id': tripId });

        if (!tripOwner) {
          console.error(`Trip owner not found for tripId: ${tripId}`);
          return null; // Skip this trip if the owner is not found
        }

        const trip = tripOwner.trips.id(tripId);
        
        if (!trip) {
          console.error(`Trip not found in tripOwner's trips for tripId: ${tripId}`);
          return null; // Skip this trip if it's not found in the user's trips
        }

        return {
          _id: trip._id,
          startLocation: trip.startLocation,
          endLocation: trip.endLocation,
          userId: tripOwner._id,
        };
      })
    );

    // Filter out any null trips that were skipped
    const filteredBookedTrips = bookedTrips.filter(trip => trip !== null);

    res.render('trips/booked.ejs', { bookedTrips: filteredBookedTrips });
  } catch (error) {
    console.log('I reached get booked route but there was an error');
    console.error(error);
    res.redirect('/');
  }
});

// Delete a booked trip
router.delete('/booked/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const tripOwner = await User.findOne({ 'trips._id': req.params.tripId });

    if (!tripOwner) {
      return res.redirect('/users/' + currentUser._id + '/trips/booked');
    }

    const trip = tripOwner.trips.id(req.params.tripId);

    // Remove the trip from the user's bookedTrips array
    currentUser.bookedTrips = currentUser.bookedTrips.filter(bookedTripId => !bookedTripId.equals(trip._id));

    // Increase available seats back when a booking is deleted
    trip.availableSeats += 1;

    await currentUser.save();
    await tripOwner.save();
    res.redirect('/users/' + currentUser._id + '/trips/booked');
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});


// Delete a trip
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



// Edit a trip
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

// Update a trip
router.put('/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const trip = currentUser.trips.id(req.params.tripId);

    const tripDate = new Date(req.body.date);

    if (isDateInThePast(tripDate)) {
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

// Show trip details
router.get('/:tripId', async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const allUsers = await User.find();

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

    // Get the booked trips of the current user
    const currentUserBookedTrips = currentUser.bookedTrips.map(tripId => tripId.toString());

    res.render('trips/show.ejs', {
      trip,
      user: tripUser || currentUser,
      currentUserId: req.session.user._id,
      currentUserBookedTrips // Pass the booked trips array to the view
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

module.exports = router;
