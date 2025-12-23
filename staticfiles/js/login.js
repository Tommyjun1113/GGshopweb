/* ========= CSRF ========= */
function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return '';
}

document.addEventListener('DOMContentLoaded', function () {

    /* ========= DOM ========= */
    const loginBox = document.getElementById('loginBox');
    const registerBox = document.getElementById('registerBox');
    const forgotBox = document.getElementById('forgotBox');

    const registerStep1 = document.getElementById('registerStep1');
    const registerStep2 = document.getElementById('registerStep2');

    const forgotStep1 = document.getElementById('forgotStep1');
    const forgotStep2 = document.getElementById('forgotStep2');

    const regPhone = document.getElementById('regPhone');
    const regEmail = document.getElementById('regEmail');
    const forgotAccount = document.getElementById('forgotAccount');

    const countdown = document.getElementById('countdown');
    const resend = document.getElementById('resend');

    const forgotCountdown = document.getElementById('forgotCountdown');
    const forgotResend = document.getElementById('forgotResend');

    /* ========= 畫面切換 ========= */
    window.switchToRegister = function () {
        loginBox.classList.remove('active');
        forgotBox.classList.remove('active');
        registerBox.classList.add('active');

        registerStep1.classList.add('active');
        registerStep2.classList.remove('active');
    };

    window.switchToLogin = function () {
        registerBox.classList.remove('active');
        forgotBox.classList.remove('active');
        loginBox.classList.add('active');

        forgotStep1.classList.add('active');
        forgotStep2.classList.remove('active');
    };

    window.switchToForgot = function () {
        loginBox.classList.remove('active');
        registerBox.classList.remove('active');
        forgotBox.classList.add('active');

        forgotStep1.classList.add('active');
        forgotStep2.classList.remove('active');
    };

    /* ========= 註冊（Step 1 → Step 2） ========= */
    window.goRegisterStep2 = function () {
        if (!regPhone.value && !regEmail.value) {
            alert('請輸入手機或 Email');
            return;
        }

        fetch('/register/send-code/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: new URLSearchParams({
                phone: regPhone.value,
                email: regEmail.value
            })
        })
        .then(r => r.json())
        .then(d => {
            if (!d.success) {
                alert(d.message);
                return;
            }

            registerStep1.classList.remove('active');
            registerStep2.classList.add('active');
            startRegisterCountdown();
        });
    };

    /* ========= 忘記密碼（Step 1 → Step 2） ========= */
    window.goForgotStep2 = function () {
        if (!forgotAccount.value) {
            alert('請輸入 Email 或手機');
            return;
        }

        fetch('/forgot/send-code/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            body: new URLSearchParams({
                account: forgotAccount.value
            })
        })
        .then(r => r.json())
        .then(d => {
            if (!d.success) {
                alert(d.message);
                return;
            }

            forgotStep1.classList.remove('active');
            forgotStep2.classList.add('active');
            startForgotCountdown();
        });
    };

    /* ========= 註冊驗證碼倒數 ========= */
    let regSeconds = 60;
    let regTimer = null;

    function startRegisterCountdown() {
        regSeconds = 60;
        countdown.innerText = regSeconds;
        resend.style.display = 'none';

        regTimer = setInterval(() => {
            regSeconds--;
            countdown.innerText = regSeconds;

            if (regSeconds <= 0) {
                clearInterval(regTimer);
                resend.style.display = 'inline';
            }
        }, 1000);
    }

    window.resendForgotCode = function () {
    fetch('/forgot/send-code/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            account: forgotAccount.value
        })
    })
    .then(r => r.json())
    .then(d => {
        if (!d.success) {
            alert(d.message);
            return;
        }
        startForgotCountdown();
    });
    };

    /* ========= 忘記密碼驗證碼倒數 ========= */
    let forgotSeconds = 60;
    let forgotTimer = null;

    function startForgotCountdown() {
        forgotSeconds = 60;
        forgotCountdown.innerText = forgotSeconds;
        forgotResend.style.display = 'none';

        forgotTimer = setInterval(() => {
            forgotSeconds--;
            forgotCountdown.innerText = forgotSeconds;

            if (forgotSeconds <= 0) {
                clearInterval(forgotTimer);
                forgotResend.style.display = 'inline';
            }
        }, 1000);
    }

    window.resendForgotCode = function () {
        goForgotStep2();
    };

});
