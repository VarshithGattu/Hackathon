const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const caregiverRoutes = require('./routes/caregiverRoutes');
const scheduler = require('./utils/scheduler');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/caregivers', caregiverRoutes);

const PORT = process.env.PORT || 4000;
const MONGO = process.env.MONGO_URL || 'mongodb://localhost:27017/medicinereminder';

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> {
    console.log('Mongo connected');
    app.listen(PORT, ()=> {
      console.log('Server listening on', PORT);
      // start scheduler after server starts
      scheduler.start();
    });
  })
  .catch(err => console.error(err));
