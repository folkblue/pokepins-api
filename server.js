const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());

const DATA_FILE = "./pins.json";

/* -----------------------
   READ DATA ONLY
------------------------ */

function readPins() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

/* -----------------------
   SORT HELPERS
------------------------ */

function sortPins(pins, sort) {
  if (!sort) return pins;

  const isDesc = sort.startsWith("-");
  const key = isDesc ? sort.slice(1) : sort;

  return pins.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    if (!valA || !valB) return 0;

    if (valA < valB) return isDesc ? 1 : -1;
    if (valA > valB) return isDesc ? -1 : 1;
    return 0;
  });
}

/* -----------------------
   MAIN API (READ-ONLY)
------------------------ */

app.get("/pins", (req, res) => {
  let pins = readPins();

  const {
    q,
    origin,
    sort,
    page = 1,
    limit = 10
  } = req.query;

  /* 🔎 UNIFIED SEARCH */
  if (q) {
    const query = q.toLowerCase();

    pins = pins.filter(pin => {
      const inName = pin.name.toLowerCase().includes(query);
      const inNotes = pin.notes.toLowerCase().includes(query);

      const inKeywords = pin.keywords?.some(k =>
        k.toLowerCase().includes(query)
      );

      return inName || inNotes || inKeywords;
    });
  }

  /* 🌍 ORIGIN FILTER */
  if (origin) {
    const o = origin.toLowerCase();
    pins = pins.filter(pin =>
      pin.origin.toLowerCase().includes(o)
    );
  }

  /* ↕ SORTING */
  pins = sortPins(pins, sort);

  /* 📄 PAGINATION */
  const start = (page - 1) * limit;
  const end = start + Number(limit);

  const paginated = pins.slice(start, end);

  res.json({
    total: pins.length,
    page: Number(page),
    limit: Number(limit),
    results: paginated
  });
});

/* -----------------------
   GET SINGLE PIN
------------------------ */

app.get("/pins/:id", (req, res) => {
  const pins = readPins();
  const pin = pins.find(p => p.id == req.params.id);

  if (!pin) {
    return res.status(404).json({ error: "Pin not found" });
  }

  res.json(pin);
});

/* -----------------------
   START SERVER
------------------------ */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Pin Catalog API running on port ${PORT}`);
});
