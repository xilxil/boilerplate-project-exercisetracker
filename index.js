const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create User schema and model
const userSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model('User', userSchema);

// Create Exercise schema and model
const exerciseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  description: String,
  duration: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// POST endpoint to create a new user
app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (error) {
    res.status(400).send('Error creating user');
  }
});

// GET endpoint to retrieve all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '_id username');
    res.json(users);
  } catch (error) {
    res.status(400).send('Error fetching users');
  }
});

// POST endpoint to add an exercise for a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    const exercise = new Exercise({
      userId,
      description,
      duration,
      date: date ? new Date(date) : Date.now(),
    });
    await exercise.save();

    // Get user object with the exercise fields added
    const user = await User.findById(userId, '_id username');
    user.exercise = {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    };

    // Send the user object with exercise fields added in the response
    res.json(user);
  } catch (error) {
    res.status(400).send('Error adding exercise');
  }
});

// GET endpoint to retrieve exercise log of a user
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    let { from, to, limit } = req.query;

    const query = { userId };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercises = await Exercise.find(query)
      .select('description duration date -_id')
      .limit(limit ? parseInt(limit) : null);

    exercises = exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));

    const user = await User.findById(userId, '_id username');

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises,
    });
  } catch (error) {
    res.status(400).send('Error fetching exercise log');
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
