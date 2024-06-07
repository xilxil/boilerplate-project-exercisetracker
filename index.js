// Import necessary modules
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Dummy database to store users and exercise logs
let users = [];
let exerciseLogs = [];

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Routes
// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Route to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = {
    username,
    _id: generateId(), // You need to implement the logic to generate unique IDs
  };
  users.push(newUser);
  res.json(newUser);
});

// Route to get a list of all users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Route to add an exercise for a specific user
app.post('/api/users/:userId/exercises', (req, res) => {
  const { userId } = req.params;
  const { description, duration, date } = req.body;
  
  const newExercise = {
    username: findUserById(userId).username,
    description,
    duration,
    date: date || new Date().toDateString(),
  };
  
  exerciseLogs.push(newExercise);
  res.json(newExercise);
});

// Route to retrieve full exercise log of a specific user
app.get('/api/users/:userId/logs', (req, res) => {
  const { userId } = req.params;
  const user = findUserById(userId);
  const userLogs = exerciseLogs.filter(log => log.username === user.username);
  res.json({
    _id: user._id,
    username: user.username,
    count: userLogs.length,
    log: userLogs,
  });
});

// Helper function to find user by ID
function findUserById(userId) {
  return users.find(user => user._id === userId);
}

// Helper function to generate unique IDs
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
