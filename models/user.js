// models/user.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the trip schema
const TripSchema = new Schema({
  startLocation: { type: String, required: true },
  endLocation: { type: String },
  availableSeats: { type: Number, required: true },
  date: { type: Date, required: true },
  notes: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Define the user schema with trips embedded
const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String },
  email: { type: String},
  age: { type: Number},
  gender: { type: String, enum: ['male', 'female']},
  trips: [TripSchema]
});

// Create the User model from the schema
const User = mongoose.model('User', UserSchema);

// Export the User model
module.exports = User;
