const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const defaultDb = {
  activeJourney: {
    stationIndex: 0,
    distanceKm: 0,
    simDist: 0,
    passengersOnboard: 184,
    punctualityScore: 100,
    departureTime: "07:04 AM",
    weather: "Sunny",
    lastSaved: null
  },
  tickets: [
    {
      pnr: "BR-766-SPD01",
      passenger: "Abdur Rahim",
      from: "SAIDPUR",
      to: "DHAKA",
      coach: "Snigdha-A",
      seat: "24",
      fare: "895 BDT",
      status: "Confirmed",
      date: "Today"
    },
    {
      pnr: "BR-766-PBT04",
      passenger: "Sharmin Sultana",
      from: "PARBATIPUR",
      to: "DHAKA",
      coach: "Shovon-Chair-C",
      seat: "12",
      fare: "505 BDT",
      status: "Confirmed",
      date: "Today"
    },
    {
      pnr: "BR-766-STH09",
      passenger: "Tanvir Ahmed",
      from: "SANTAHAR",
      to: "DHAKA",
      coach: "Snigdha-B",
      seat: "08",
      fare: "650 BDT",
      status: "Confirmed",
      date: "Today"
    }
  ],
  journeyLogs: [
    {
      id: 1,
      train: "766 Nilsagar Express",
      route: "Saidpur to Dhaka",
      duration: "7h 51m",
      onTimeRate: "98%",
      passengersTransported: 520,
      completedAt: "Yesterday"
    }
  ]
};

let memoryDb = null;

function readDb() {
  if (memoryDb) return memoryDb;
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb;
    }
  } catch (err) {
    // Read fallback
  }
  memoryDb = JSON.parse(JSON.stringify(defaultDb));
  return memoryDb;
}

function writeDb(data) {
  memoryDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Read-only filesystem in serverless environments (Vercel)
    return true;
  }
}

module.exports = {
  getJourney() {
    return readDb().activeJourney;
  },
  saveJourney(journeyState) {
    const db = readDb();
    db.activeJourney = {
      ...db.activeJourney,
      ...journeyState,
      lastSaved: new Date().toISOString()
    };
    writeDb(db);
    return db.activeJourney;
  },
  resetJourney() {
    const db = readDb();
    db.activeJourney = { ...defaultDb.activeJourney, lastSaved: new Date().toISOString() };
    writeDb(db);
    return db.activeJourney;
  },
  getTickets() {
    return readDb().tickets;
  },
  bookTicket(ticket) {
    const db = readDb();
    const newTicket = {
      pnr: `BR-766-${Date.now().toString().slice(-5)}`,
      status: "Confirmed",
      date: new Date().toLocaleDateString('en-GB'),
      ...ticket
    };
    db.tickets.unshift(newTicket);
    writeDb(db);
    return newTicket;
  },
  getLogs() {
    return readDb().journeyLogs;
  },
  addLog(log) {
    const db = readDb();
    const entry = {
      id: Date.now(),
      ...log,
      completedAt: new Date().toLocaleString()
    };
    db.journeyLogs.unshift(entry);
    writeDb(db);
    return entry;
  }
};
