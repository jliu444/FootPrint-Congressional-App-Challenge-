const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

const mongoUri = 'mongodb+srv://User:<Password>@cluster0.5gapp.mongodb.net/';  // For MongoDB Atlas

mongoose.connect(mongoUri)
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

app.use(cors());
app.use(express.json());

app.use(express.static('public'));

const markerSchema = new mongoose.Schema({
    crimeType: String,
    description: String,
    date: String,
    location: {
        lat: Number,
        lng: Number
    }
});


const Marker = mongoose.model('Marker', markerSchema);

app.post('/api/markers', async (req, res) => {
    try {
        const newMarker = new Marker(req.body);
        await newMarker.save();
        res.status(201).json(newMarker);
    } catch (error) {
        console.error('Error saving marker:', error);
        res.status(500).json({ error: 'Error saving marker' });
    }
});

app.get('/api/markers', async (req, res) => {
    try {
        const markers = await Marker.find();
        res.json(markers);
    } catch (error) {
        console.error('Error fetching markers:', error);
        res.status(500).json({ error: 'Error fetching markers' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

