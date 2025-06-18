document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

function checkLoginStatus() {
    const userData = localStorage.getItem('currentUser');
    const userAuthElement = document.getElementById('user-auth');

    if (userData) {
        const currentUser = JSON.parse(userData);
        userAuthElement.innerHTML = `
            <div class="user-profile">
                <span>${currentUser.username}</span>
                <button id="logout-btn">退出登录</button>
            </div>
        `;

        document.getElementById('logout-btn').addEventListener('click', function() {
            localStorage.removeItem('currentUser');
            alert('您已退出登录');
            window.location.href = 'login/login.html';
        });
    } else {
        userAuthElement.innerHTML = `
            <button id="login-btn">登录/注册</button>
        `;

        document.getElementById('login-btn').addEventListener('click', function() {
            window.location.href = 'login/login.html';
        });
    }
}