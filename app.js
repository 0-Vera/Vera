// Basic client-side authentication and OTP simulation.

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('message');

    // Reset message
    messageEl.innerText = '';

    // Simple credential check (replace with your own logic)
    if (username === 'admin' && password === 'vera123') {
        // Simulate sending OTP via backend
        sendOtp(username)
            .then(() => {
                document.getElementById('otpSection').style.display = 'block';
                messageEl.style.color = '#333';
                messageEl.innerText = 'Doğrulama kodu e-posta adresinize gönderildi.';
            })
            .catch((err) => {
                console.error(err);
                messageEl.innerText = 'Kod gönderme sırasında hata oluştu.';
            });
    } else {
        messageEl.innerText = 'Kullanıcı adı veya şifre yanlış.';
    }
}

function verify() {
    const otpCode = document.getElementById('otp').value;
    const messageEl = document.getElementById('message');
    messageEl.innerText = '';
    // Simulate verifying OTP via backend
    verifyOtp(otpCode)
        .then((ok) => {
            if (ok) {
                window.location.href = 'admin.html';
            } else {
                messageEl.innerText = 'Kod yanlış veya süresi doldu.';
            }
        })
        .catch((err) => {
            console.error(err);
            messageEl.innerText = 'Kod doğrulanamadı.';
        });
}

// Placeholder function to simulate sending OTP via serverless function or API.
function sendOtp(username) {
    return new Promise((resolve, reject) => {
        // In a real implementation, you would call your backend service here.
        // For example:
        // return fetch('/api/send-otp', { method: 'POST', body: JSON.stringify({ username }) });
        console.log('OTP gönderiliyor...');
        setTimeout(() => {
            // Simulate success
            resolve();
        }, 500);
    });
}

// Placeholder function to simulate verifying OTP code via serverless function or API.
function verifyOtp(code) {
    return new Promise((resolve, reject) => {
        // In a real implementation, you would call your backend service here.
        // For example:
        // return fetch('/api/verify-otp', { method: 'POST', body: JSON.stringify({ code }) });
        console.log('OTP doğrulanıyor...');
        setTimeout(() => {
            // Accept any 6-digit code for demo
            if (code && code.length === 6) {
                resolve(true);
            } else {
                resolve(false);
            }
        }, 500);
    });
}