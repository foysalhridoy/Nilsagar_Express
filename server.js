const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load stations data
const stationsFile = path.join(__dirname, 'data', 'stations.json');
let stations = [];
try {
  stations = JSON.parse(fs.readFileSync(stationsFile, 'utf-8'));
} catch (e) {
  console.error('Failed to load stations.json:', e);
}

// Train metadata
const trainInfo = {
  trainNumber: "766 / 765",
  trainNameEn: "Nilsagar Express",
  trainNameBn: "নীলসাগর এক্সপ্রেস",
  serviceType: "Intercity (আন্তঃনগর)",
  origin: "Saidpur (সৈয়দপুর)",
  destination: "Dhaka Kamalapur (ঢাকা কমলাপুর)",
  totalDistanceKm: 445,
  departureTime: "07:04 AM BST",
  arrivalTime: "02:55 PM BST",
  journeyDuration: "7h 51m",
  locomotive: "Bangladesh Railway Class 2900 / 3000 Bo-Bo Diesel-Electric",
  coaches: [
    { code: "LOCO", name: "Locomotive Bo-Bo", class: "Engine" },
    { code: "A", name: "Snigdha AC Chair", class: "Air Conditioned" },
    { code: "B", name: "Snigdha AC Chair", class: "Air Conditioned" },
    { code: "C", name: "Shovon Chair", class: "Non-AC" },
    { code: "D", name: "Shovon Chair", class: "Non-AC" },
    { code: "E", name: "Guard Brake & Pantry", class: "Service" }
  ]
};

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/info', (req, res) => {
  res.json({
    status: 'success',
    train: trainInfo,
    stationsCount: stations.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/stations', (req, res) => {
  res.json({
    status: 'success',
    total: stations.length,
    stations: stations
  });
});

app.get('/api/timetable', (req, res) => {
  const timetable = stations.map(s => ({
    index: s.index + 1,
    nameEn: s.en,
    nameBn: s.bn,
    code: s.code,
    arrival: s.arrival,
    halt: s.halt,
    departure: s.departure,
    duration: s.duration,
    km: s.km,
    district: s.district,
    landmark: s.landmark
  }));
  res.json({
    status: 'success',
    trainName: "766 Nilsagar Express",
    route: "Saidpur to Dhaka",
    timetable
  });
});

app.get('/api/journey', (req, res) => {
  const journey = db.getJourney();
  const currentStation = stations[journey.stationIndex] || stations[0];
  const nextStation = stations[Math.min(stations.length - 1, journey.stationIndex + 1)];
  res.json({
    status: 'success',
    journey,
    currentStation,
    nextStation
  });
});

app.post('/api/journey/save', (req, res) => {
  const updated = db.saveJourney(req.body);
  res.json({ status: 'success', journey: updated });
});

app.post('/api/journey/reset', (req, res) => {
  const reset = db.resetJourney();
  res.json({ status: 'success', journey: reset });
});

app.get('/api/tickets', (req, res) => {
  res.json({
    status: 'success',
    tickets: db.getTickets()
  });
});

app.post('/api/tickets/book', (req, res) => {
  const { passenger, from, to, coach, seat, fare } = req.body;
  if (!passenger || !from || !to) {
    return res.status(400).json({ status: 'error', message: 'Missing booking details' });
  }
  const ticket = db.bookTicket({
    passenger,
    from,
    to,
    coach: coach || 'Snigdha-A',
    seat: seat || Math.floor(Math.random() * 40 + 1).toString(),
    fare: fare || '550 BDT'
  });
  res.status(201).json({ status: 'success', ticket });
});

app.get('/api/logs', (req, res) => {
  res.json({
    status: 'success',
    logs: db.getLogs()
  });
});

app.post('/api/logs', (req, res) => {
  const log = db.addLog(req.body);
  res.status(201).json({ status: 'success', log });
});

// Serve frontend static files
app.use(express.static(__dirname));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚆 Nilsagar Express (Saidpur -> Dhaka) Train Game Server`);
    console.log(`   Running at: http://localhost:${PORT}`);
    console.log(`   Timetable API: http://localhost:${PORT}/api/timetable`);
    console.log(`   Stations API: http://localhost:${PORT}/api/stations`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
