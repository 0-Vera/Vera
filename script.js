// List of valid users and their passwords
const users = [
  { username: 'batu', password: 'password123' },
  { username: 'assistant', password: 'password123' }
];

// TOTP secret (base32). Add this to your Authenticator app.
const totpSecret = '2PLS2AX3UNPAMNS3';

async function login() {
  const uname = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = '';
  const user = users.find(u => u.username === uname && u.password === pass);
  if (user) {
    // Show TOTP section
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('totp-section').style.display = 'block';
  } else {
    errorDiv.textContent = 'Incorrect username or password.';
  }
}

// Base32 decode implementation
function base32ToBytes(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  base32 = base32.replace(/=+$/, '');
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32[i].toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

// Compute HMAC-SHA1 using Web Crypto API
async function hmacSha1(key, counter) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key,
    { name: 'HMAC', hash: 'SHA-1' },
    false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
  return new Uint8Array(signature);
}

// Check if a given TOTP token is valid for the secret
async function checkTotp(token, secret) {
  const key = base32ToBytes(secret);
  const timeStep = 30;
  const digits = 6;
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep);
  // Check the current time step and adjacent steps to allow for slight clock drift
  for (let i = -1; i <= 1; i++) {
    const c = counter + i;
    const hmac = await hmacSha1(key, c);
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   ((hmac[offset + 3] & 0xff));
    const otp = (binary % 10 ** digits).toString().padStart(digits, '0');
    if (otp === token) {
      return true;
    }
  }
  return false;
}

async function verifyCode() {
  const token = document.getElementById('totp-code').value.trim();
  const errorDiv = document.getElementById('totp-error');
  errorDiv.textContent = '';
  if (token.length !== 6) {
    errorDiv.textContent = 'Please enter a 6-digit code.';
    return;
  }
  const valid = await checkTotp(token, totpSecret);
  if (valid) {
    document.getElementById('totp-section').style.display = 'none';
    document.getElementById('success-section').style.display = 'block';
  } else {
    errorDiv.textContent = 'Invalid code. Please try again.';
  }
}
