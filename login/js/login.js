document.addEventListener('DOMContentLoaded', function () {
    const BASE_API_URL = 'https://yqjtcawhning.sealosgzg.site/api/';

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTab = document.querySelector('.tab[data-tab="login"]');
    const registerTab = document.querySelector('.tab[data-tab="register"]');

    // 切换标签页
    loginTab.addEventListener('click', function () {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    });

    registerTab.addEventListener('click', function () {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    });

    // 登录提交
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        login();
    });

    async function login() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        const input_data = new FormData();
        input_data.append('nick', username);
        input_data.append('password', password);

        try {
            const response = await fetch(BASE_API_URL + 'users/login.php', {
                method: 'POST',
                body: input_data
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('login-result').style.display = 'none';

                // 保存用户信息
                localStorage.setItem('currentUser', JSON.stringify(result));

                // 根据类型跳转
                switch (result.type) {
                    case 0:
                        window.location.href = '../customer/dashboard.html';
                        break;
                    case 1:
                        window.location.href = '../merchant/dashboard.html';
                        break;
                    case 2:
                        window.location.href = '../admin/dashboard.html';
                        break;
                    default:
                        alert('未知用户类型');
                        break;
                }

            } else {
                document.getElementById('login-result').innerHTML = `登录失败: ${result.error || result.message || '未知错误'}`;
                document.getElementById('login-result').style.display = 'block';
            }
        } catch (error) {
            document.getElementById('login-result').innerHTML = `发生错误: ${error.message || '网络错误'}`;
            document.getElementById('login-result').style.display = 'block';
        }
    }

    // 注册提交
    registerForm.addEventListener('submit', function (event) {
        event.preventDefault();
        register();
    });

    async function register() {
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        const roleStr = document.getElementById('register-role').value;

        if (password !== confirmPassword) {
            alert('密码不一致');
            return;
        }

        const roleMap = {
            customer: 0,
            merchant: 1,
            admin: 2
        };
        const role = roleMap[roleStr];

        const input_data = new FormData();
        input_data.append('nick', username);
        input_data.append('password', password);
        input_data.append('type', role);

        try {
            const response = await fetch(BASE_API_URL + 'users/register.php', {
                method: 'POST',
                body: input_data
            });

            const result = await response.json();

            if (response.ok) {
                document.getElementById('register-result').style.display = 'none';
                alert('注册成功，请登录');
                loginTab.click();
            } else {
                document.getElementById('register-result').innerHTML = `注册失败: ${result.error || result.message || '未知错误'}`;
                document.getElementById('register-result').style.display = 'block';
            }

        } catch (error) {
            document.getElementById('register-result').innerHTML = `发生错误: ${error.message || '网络错误'}`;
            document.getElementById('register-result').style.display = 'block';
        }
    }
});
