// server.js (diagnostic version)
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ---- Require routes with type logs ----
function safeUse(path, mod) {
  const t = typeof mod;
  console.log(`[ROUTE] ${path} -> typeof = ${t}`);
  if (t === 'function') {
    app.use(path, mod);
  } else {
    console.error(`[ERROR] ${path} is NOT a middleware function. Got:`, mod);
  }
}

// auth
let authRoutes;
try {
  authRoutes = require('./routes/authRoutes');
} catch (e) {
  console.error('[EXCEPTION] /api/auth require failed:', e.message);
}
safeUse('/api/auth', authRoutes);

// cases
let caseRoutes;
try {
  caseRoutes = require('./routes/caseRoutes');
} catch (e) {
  console.error('[EXCEPTION] /api/cases require failed:', e.message);
}
safeUse('/api/cases', caseRoutes);

// evidence
let evidenceRoutes;
try {
  evidenceRoutes = require('./routes/evidenceRoutes');
} catch (e) {
  console.error('[EXCEPTION] /api/evidence require failed:', e.message);
}
safeUse('/api/evidence', evidenceRoutes);

// ---- start server ----
if (require.main === module) {
  connectDB();
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
