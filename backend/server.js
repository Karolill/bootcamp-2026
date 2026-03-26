const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3001;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tillatelser.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const fotoLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const importLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

app.use(cors());
app.use(express.json());

app.get('/api/tillatelser', (req, res) => {
  const tillatelser = loadData();
  const search = (req.query.search || '').toLowerCase().trim();
  if (!search) return res.json(tillatelser);

  const filtered = tillatelser.filter(t => {
    const navn = (t.navn || '').toLowerCase();
    const personnummer = (t.personnummer || '').toLowerCase();
    const tn = t.tillatelseNummer || {};
    const formatted = `${tn.kommunekode || ''}-${tn.løpenummer || ''}-${tn.fødselsår || ''}-${tn.kjønn || ''}`.toLowerCase();
    return navn.includes(search) || personnummer.includes(search) || formatted.includes(search);
  });

  res.json(filtered);
});

app.post('/api/tillatelser', upload.single('foto'), (req, res) => {
  const tillatelser = loadData();
  const b = req.body;

  const tillatelse = {
    id: uuidv4(),
    personnummer: b.personnummer || '',
    navn: b.navn || '',
    foto: req.file ? req.file.filename : '',
    tillatelseNummer: {
      kommunekode: b.kommunekode || '',
      løpenummer: b.løpenummer || '',
      fødselsår: b.fødselsår || '',
      kjønn: b.kjønn || 'M'
    },
    gyldighetstid: {
      fra: b.fra || '',
      til: b.til || ''
    },
    stjåletEllerMistet: b.stjåletEllerMistet === 'true' || b.stjåletEllerMistet === true,
    type: b.type || 'fører',
    createdAt: new Date().toISOString()
  };

  tillatelser.push(tillatelse);
  saveData(tillatelser);
  res.status(201).json(tillatelse);
});

app.get('/api/tillatelser/:id', (req, res) => {
  const tillatelser = loadData();
  const t = tillatelser.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

app.put('/api/tillatelser/:id', upload.single('foto'), (req, res) => {
  const tillatelser = loadData();
  const idx = tillatelser.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const existing = tillatelser[idx];
  const b = req.body;

  tillatelser[idx] = {
    ...existing,
    personnummer: b.personnummer !== undefined ? b.personnummer : existing.personnummer,
    navn: b.navn !== undefined ? b.navn : existing.navn,
    foto: req.file ? req.file.filename : existing.foto,
    tillatelseNummer: {
      kommunekode: b.kommunekode !== undefined ? b.kommunekode : existing.tillatelseNummer.kommunekode,
      løpenummer: b.løpenummer !== undefined ? b.løpenummer : existing.tillatelseNummer.løpenummer,
      fødselsår: b.fødselsår !== undefined ? b.fødselsår : existing.tillatelseNummer.fødselsår,
      kjønn: b.kjønn !== undefined ? b.kjønn : existing.tillatelseNummer.kjønn
    },
    gyldighetstid: {
      fra: b.fra !== undefined ? b.fra : existing.gyldighetstid.fra,
      til: b.til !== undefined ? b.til : existing.gyldighetstid.til
    },
    stjåletEllerMistet: b.stjåletEllerMistet !== undefined
      ? (b.stjåletEllerMistet === 'true' || b.stjåletEllerMistet === true)
      : existing.stjåletEllerMistet,
    type: b.type !== undefined ? b.type : existing.type
  };

  saveData(tillatelser);
  res.json(tillatelser[idx]);
});

app.delete('/api/tillatelser/:id', (req, res) => {
  const tillatelser = loadData();
  const idx = tillatelser.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  tillatelser.splice(idx, 1);
  saveData(tillatelser);
  res.json({ success: true });
});

app.get('/api/tillatelser/:id/foto', fotoLimiter, (req, res) => {
  const tillatelser = loadData();
  const t = tillatelser.find(x => x.id === req.params.id);
  if (!t || !t.foto) return res.status(404).json({ error: 'No photo' });
  const filePath = path.join(UPLOADS_DIR, t.foto);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.sendFile(filePath);
});

app.post('/api/import', importLimiter, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const mimetype = req.file.mimetype || '';
  let rows = [];

  try {
    if (ext === '.csv' || mimetype === 'text/csv') {
      const content = fs.readFileSync(req.file.path, 'utf8');
      rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    } else if (ext === '.xlsx' || ext === '.xls' || mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use .csv or .xlsx' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Failed to parse file: ' + err.message });
  }

  const tillatelser = loadData();
  const errors = [];
  let count = 0;

  rows.forEach((row, i) => {
    try {
      const stjålet = String(row.stjåletEllerMistet || '').toLowerCase();
      const tillatelse = {
        id: uuidv4(),
        personnummer: String(row.personnummer || ''),
        navn: String(row.navn || ''),
        foto: '',
        tillatelseNummer: {
          kommunekode: String(row.kommunekode || ''),
          løpenummer: String(row.løpenummer || ''),
          fødselsår: String(row.fødselsår || ''),
          kjønn: String(row.kjønn || 'M')
        },
        gyldighetstid: {
          fra: String(row.fra || ''),
          til: String(row.til || '')
        },
        stjåletEllerMistet: stjålet === 'true' || stjålet === '1' || stjålet === 'yes',
        type: String(row.type || 'fører'),
        createdAt: new Date().toISOString()
      };
      tillatelser.push(tillatelse);
      count++;
    } catch (err) {
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  });

  saveData(tillatelser);

  try {
    fs.unlinkSync(req.file.path);
  } catch {}

  res.json({ count, errors });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tillatelsesregister backend running on http://localhost:${PORT}`);
});
