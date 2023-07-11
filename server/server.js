const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
// Set up Express server
const app = express();
const port = 3001;
app.use(cors());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect('mongodb+srv://Prateek:EjCOPVeGUt3mVxBR@cluster0.ukgaesh.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });




// Define a schema for call recordings
const callRecordingSchema = new mongoose.Schema({
  phoneNumber: String,
  name: String,
  audioFilePath: String,
});

// Define a model based on the schema
const CallRecording = mongoose.model('CallRecording', callRecordingSchema);

// API endpoint for uploading call recordings
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;
    const audioFilePath = req.file.path;

    // Save the call recording to the database
    await CallRecording.create({
      phoneNumber,
      name,
      audioFilePath,
    });

    res.status(201).json({ message: 'Call recording uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading call recording:', error);
    res.status(500).json({ error: 'Failed to upload call recording.' });
  }
});

// API endpoint for searching call recordings
app.get('/search', async (req, res) => {
    try {
      const { query, startDate, endDate } = req.query;
  
      let queryObj = {};
      if (query) {
        queryObj = {
          $or: [
            { phoneNumber: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ]
        };
      }
      if (startDate && endDate) {
        queryObj.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
  
      // Search for call recordings
      const results = await CallRecording.find(queryObj);
  
      res.status(200).json(results);
    } catch (error) {
      console.error('Error searching call recordings:', error);
      res.status(500).json({ error: 'Failed to search call recordings.' });
    }
  });
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
