const express = require('express');
const cors = require('cors');
const speakeasy = require('speakeasy');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Ortam degiskenleri veya varsayilanlarla kullanici bilgileri
const USERS = {
  batu: {
    passwordHash: process.env.PASSWORD_BATU_HASH || bcrypt.hashSync(process.env.PASSWORD_BATU || 'password123', 10),
    totpSecret: process.env.TOTP_BATU || '2PLS2AX3UNPAMNS3'
  },
  assistant: {
    passwordHash: process.env.PASSWORD_ASSISTANT_HASH || bcrypt.hashSync(process.env.PASSWORD_ASSISTANT || 'password123', 10),
    totpSecret: process.env.TOTP_ASSISTANT || '2PLS2AX3UNPAMNS3'
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_key';

// Kullanici adi ve sifre dogrulamasi
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '10m' });
  res.json({ token });
});

// TOTP kodu dogrulamasi
app.post('/verify', (req, res) => {
  const { token, code } = req.body;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = USERS[payload.username];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });
    if (!verified) return res.status(401).json({ error: 'Invalid TOTP code' });

    res.json({ success: true });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth server listening on port ${PORT}`);
});
