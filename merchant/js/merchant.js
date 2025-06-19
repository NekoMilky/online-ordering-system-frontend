const BASE_API_URL = 'https://yqjtcawhning.sealosgzg.site/api/';
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
const merchantId = currentUser?.user_id || null;

// 页面初始化
window.addEventListener('DOMContentLoaded', async () => {
  displayMerchantUser();

  const page = window.location.pathname.split('/').pop();

  if (page === 'dashboard.html') {
    loadDashboard();
  } else if (page === 'setting.html') {
    loadMerchantSettings();
    setupSettingsForm();
  } else if (page === 'list.html') {
    loadDishList();
  } else if (page === 'neworder.html') {
    loadOrdersByStatus('active');
  } else if (page === 'historyorder.html') {
    loadOrdersByStatus('history');
  }
});

function displayMerchantUser() {
  const userAuthElement = document.getElementById('user-auth');
  if (userAuthElement && currentUser?.nick) {
    userAuthElement.innerHTML = `<div class="user-profile"><span>登录为：${currentUser.nick}</span></div>`;
  }
}

// 仪表盘统计
async function loadDashboard() {
  if (!merchantId) return;

  const formData = new FormData();
  formData.append('merchant_id', merchantId);
  try {
    const res = await fetch(BASE_API_URL + 'orders/get_order_by_merchant.php', { method: 'POST', body: formData });
    const data = await res.json();
    const orders = data.orders || [];

    let newCount = 0, historyCount = 0, total = 0;
    orders.forEach(order => {
      if (order.status == 2) historyCount++;
      else newCount++;
      total += parseFloat(order.total_price);
    });

    document.getElementById('new-orders').textContent = newCount;
    document.getElementById('history-orders').textContent = historyCount;
    document.getElementById('total-sales').textContent = '¥' + total.toFixed(2);
  } catch (err) {
    console.error('仪表盘加载失败:', err);
  }
}

// 加载订单（新订单/历史订单）
async function loadOrdersByStatus(type) {
  if (!merchantId) return;

  const container = document.querySelector('.orders-list');
  const formData = new FormData();
  formData.append('merchant_id', merchantId);

  try {
    const res = await fetch(BASE_API_URL + 'orders/get_order_by_merchant.php', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    const orders = data.orders || [];
    const filtered = orders.filter(order => type === 'active' ? order.status < 2 : order.status === 2);

    if (filtered.length === 0) {
      container.innerHTML = `<p>暂无${type === 'active' ? '新' : '历史'}订单</p>`;
      return;
    }

    container.innerHTML = '';
    for (const order of filtered) {
      const orderCard = document.createElement('div');
      orderCard.className = 'order-card';
      orderCard.innerHTML = `
        <div class="order-header">
          <span class="order-id">订单号: #${order.order_id}</span>
          <span class="order-date">${formatDate(order.order_time)}</span>
          <span class="order-status ${order.status === 2 ? 'completed' : 'processing'}">${getOrderStatusText(order.status)}</span>
        </div>
        <div class="order-details">
          <p>地址：${order.address}</p>
          <p>总价：¥${parseFloat(order.total_price).toFixed(2)}</p>
        </div>`;
      container.appendChild(orderCard);
    }
  } catch (err) {
    container.innerHTML = `<p>加载失败: ${err.message}</p>`;
  }
}

// 格式化时间
function formatDate(timestamp) {
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getOrderStatusText(status) {
  return {
    0: '待接单',
    1: '进行中',
    2: '已完成'
  }[status] || '未知';
}

// 商家设置（仅本地预览）
function loadMerchantSettings() {
  document.getElementById('shop-name').value = currentUser?.nick || '';
  document.getElementById('shop-contact').value = currentUser?.phone || '';
}

function setupSettingsForm() {
  const form = document.getElementById('settings-form');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    alert('API暂未提供商家资料修改功能，仅支持本地预览');
  });
}

// 菜品管理
async function loadDishList() {
  if (!merchantId) return;

  const formData = new FormData();
  formData.append('merchant_id', merchantId);

  const res = await fetch(BASE_API_URL + 'dishes/get_dish_by_merchant.php', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  const dishes = data.dishes || [];

  const tableBody = document.getElementById('dishes-table-body');
  tableBody.innerHTML = dishes.map(d => `
    <tr>
      <td>${d.dish_id}</td>
      <td><img src="${d.image_url || 'https://via.placeholder.com/50'}" class="dish-thumb"></td>
      <td>${d.name}</td>
      <td>¥${parseFloat(d.price).toFixed(2)}</td>
      <td>${d.description || ''}</td>
      <td><button onclick="deleteDish(${d.dish_id})">删除</button></td>
    </tr>`).join('');
}

// 删除菜品
async function deleteDish(dishId) {
  const formData = new FormData();
  formData.append('dish_id', dishId);
  if (!confirm('确定要删除该菜品？')) return;

  try {
    const res = await fetch(BASE_API_URL + 'dishes/delete.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      alert('删除成功: ' + data.message);
      // 重新加载菜品列表
      if (window.location.pathname.split('/').pop() === 'list.html') {
        loadDishList();
      }
    } else {
      alert('删除失败: ' + data.message);
    }
  } catch (err) {
    console.error('删除菜品时发生错误:', err);
    alert('删除菜品时发生网络错误，请稍后重试');
  }
}

// 添加菜品
async function addDish(formData) {
  try {
    const res = await fetch(BASE_API_URL + 'dishes/add.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      alert('添加成功: ' + data.message);
      // 重新加载菜品列表
      if (window.location.pathname.split('/').pop() === 'list.html') {
        loadDishList();
      }
      return data;
    } else {
      alert('添加失败: ' + data.message);
      return null;
    }
  } catch (err) {
    console.error('添加菜品失败:', err);
    alert('添加菜品时发生错误，请稍后重试');
    return null;
  }
}

// 查询菜品
async function getDish(dishId) {
  const formData = new FormData();
  formData.append('dish_id', dishId);
  try {
    const res = await fetch(BASE_API_URL + 'dishes/get.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      console.log('查询成功:', data.message);
      return data.dish;
    } else {
      console.error('查询失败:', data.message);
      return null;
    }
  } catch (err) {
    console.error('查询菜品时发生错误:', err);
    return null;
  }
}

// 修改菜品
async function modifyDish(formData) {
  try {
    const res = await fetch(BASE_API_URL + 'dishes/modify.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      alert('修改成功: ' + data.message);
      // 重新加载菜品列表
      if (window.location.pathname.split('/').pop() === 'list.html') {
        loadDishList();
      }
      return data;
    } else {
      alert('修改失败: ' + data.message);
      return null;
    }
  } catch (err) {
    console.error('修改菜品失败:', err);
    alert('修改菜品时发生错误，请稍后重试');
    return null;
  }
}

// 登出
function logOut() {
    localStorage.removeItem('currentUser');
    alert('您已退出登录');
    window.location.href = '../index.html';
}
