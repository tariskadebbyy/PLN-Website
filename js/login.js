// === TOGGLE PASSWORD ===
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';

    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// === CEK LOGIN OTOMATIS ===
// Pastikan path-nya benar: "dashboard.html"
if (localStorage.getItem("loggedIn") === "true") {
    window.location.href = "dashboard.html";
}

// === VALIDASI LOGIN ===
const form = document.getElementById("loginForm");
const notif = document.getElementById("notif");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    const validUser = "admin";
    const validPass = "Admin123?";

    if (user === validUser && pass === validPass) {
        notif.textContent = "Login berhasil! Mengalihkan...";
        notif.className = "notif success";
        notif.style.display = "block";

        localStorage.setItem("loggedIn", "true");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);
    } else {
        notif.textContent = "Username atau Password salah!";
        notif.className = "notif error";
        notif.style.display = "block";
    }
});