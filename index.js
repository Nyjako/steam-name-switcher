
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const SteamUser = require('steam-user');
const { LoginSession, EAuthTokenPlatformType } = require('steam-session');
const qrcode = require('qrcode');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const DB_FILE = 'data.json';

let client;
let loggedIn = false;
let qrSession;

let nicknames = [];
let categories = [];
let nextId = 1;
let current_nickname = "";
let logged_as = "";

// Load nicknames and categories from file
function loadData() {
  if (fs.existsSync(DB_FILE)) {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    nicknames = data.nicknames || [];
    categories = data.categories || [];
    nextId = data.nextId || 1;
  }
}

// Save nicknames and categories to file
function saveData() {
  fs.writeFileSync(DB_FILE, JSON.stringify({ nicknames, categories, nextId }, null, 2));
}

loadData();

app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
  const { user, pass, twoFactor } = req.body;
  client = new SteamUser();
  client.logOn({
    accountName: user,
    password: pass,
    twoFactorCode: twoFactor || undefined
  });

  client.once('steamGuard', (domain, callback) => {
    req.steamGuardCallback = callback;
    return res.render('steamguard', { domain });
  });

  client.once('loggedOn', () => {
    current_nickname = client.accountName;
    logged_as = user;
    loggedIn = true;
    console.log(`✅ Logged in as ${user}`);
    res.redirect('/');
  });

  client.once('error', err => {
    console.error(err);
    res.send(`<p>Login failed: \${err.message}</p><a href="/login">Try again</a>`);
  });
});

app.post('/login-qr', async (req, res) => {
  qrSession = new LoginSession(EAuthTokenPlatformType.SteamClient);
  qrSession.loginTimeout = 2 * 60 * 1000; // optional

  const start = await qrSession.startWithQR();
  const qrImgUrl = await qrcode.toDataURL(start.qrChallengeUrl);
  res.render('login-qr', { qrImgUrl });

  qrSession.on('remoteInteraction', () => console.log('QR scanned — awaiting approval'));
  qrSession.on('authenticated', async () => {
    const refreshToken = qrSession.refreshToken;

    client = new SteamUser();
    client.logOn({ refreshToken });

    client.once('loggedOn', () => {
      loggedIn = true;
      current_nickname = client.accountName;
      console.log(`✅ Logged in via QR as ${client.accountName}`);
    });

    client.once('error', err => {
      console.error('Steam login failed:', err);
    });
  });

  qrSession.on('timeout', () => res.send('QR login timed out'));
  qrSession.on('error', err => res.send('QR Login Error: ' + err.message));
});

app.post('/login-qr-poll', (req, res) => {
  if (!qrSession) return res.redirect('/login');
  qrSession.forcePoll(); // trigger check

  if (loggedIn) return res.redirect('/');
  res.render('login-qr', { qrImgUrl: qrSession._lastQRData }); // or store data
});

app.post('/login-sg', (req, res) => {
  req.steamGuardCallback(req.body.code.trim());
  client.once('loggedOn', () => {
    loggedIn = true;
    res.redirect('/');
  });
});

app.get('/', (req, res) => {
  if (!loggedIn) return res.redirect('/login');
  const editingId = parseInt(req.query.edit);
  res.render('index', { nicknames, categories, editingId, logged_as, current_nickname });
});

app.post('/add-category', (req, res) => {
  const name = req.body.name.trim();
  if (name && !categories.includes(name)) {
    categories.push(name);
    saveData();
  }
  res.redirect('/#adding');
});

app.post('/add', (req, res) => {
  nicknames.push({
    id: nextId++,
    name: req.body.name.trim(),
    categories: Array.isArray(req.body.categories) ? req.body.categories : [req.body.categories].filter(Boolean)
  });
  saveData();
  res.redirect('/#adding');
});

app.post('/edit/:id', (req, res) => {
  const item = nicknames.find(n => +n.id === +req.params.id);
  if (item) {
    item.name = req.body.name.trim();
    item.categories = Array.isArray(req.body.categories) ? req.body.categories : [req.body.categories].filter(Boolean);
    saveData();
  }
  res.redirect(`/#${req.params.id}`);
});

app.post('/delete/:id', (req, res) => {
  nicknames = nicknames.filter(n => +n.id !== +req.params.id);
  saveData();
  res.redirect('/');
});

app.post('/set/:id', (req, res) => {
  const item = nicknames.find(n => +n.id === +req.params.id);
  if (!item) return res.status(404).send('Not found');
  client.setPersona(SteamUser.EPersonaState.Online, item.name);
  current_nickname = item.name
  console.log(`✅ Steam name changed to "${item.name}"`);
  res.send(`
    <html>
      <head><link rel="stylesheet" href="/style.css"></head>
      <body>
        <p>✅ Steam name changed to "${item.name}"</p>
        <p>Redirecting in 1 second...</p>
      </body>
      <script>setTimeout(() => window.location.href = "/#${req.params.id}", 1000)</script>
    </html>
  `);
});

app.listen(3000, () => console.log('🌐 App running at http://localhost:3000'));
    