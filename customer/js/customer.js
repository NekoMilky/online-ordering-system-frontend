const BASE_API_URL = 'https://yqjtcawhning.sealosgzg.site/api/';
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
const customerId = currentUser.user_id || localStorage.getItem('user_id') || null;
let cartData = [];

document.addEventListener('DOMContentLoaded', () => {
  displayUsername();
  if (document.getElementById('cart-count')) updateCartCount();
  if (document.getElementById('cart-items')) loadCart();

  const restaurantId = new URLSearchParams(window.location.search).get('restaurantId');
  if (restaurantId) loadDishes(restaurantId);

  const path = window.location.pathname;
  if (path.includes('active.html')) loadOrdersByStatus('active');
  if (path.includes('history.html')) loadOrdersByStatus('history');
});

function displayUsername() {
  const userAuthElement = document.getElementById('user-auth');
  if (userAuthElement && currentUser.username) {
    userAuthElement.innerHTML = `<div class="user-profile"><span>${currentUser.username}</span></div>`;
  }
}

async function updateCartCount() {
  const countElem = document.getElementById('cart-count');
  if (!customerId || !countElem) return;

  const formData = new FormData();
  formData.append('customer_id', customerId);

  try {
    const res = await fetch(BASE_API_URL + 'carts/get_cart_by_customer.php', { method: 'POST', body: formData });
    const data = await res.json();
    let count = 0;
    (data.carts || []).forEach(c => count += parseInt(c.count));
    countElem.textContent = count;
  } catch {
    countElem.textContent = 0;
  }
}

async function loadDishes(merchantId) {
  const dishesList = document.getElementById('dishes-list');
  dishesList.innerHTML = '<div class="loading">加载中...</div>';

  const formData = new FormData();
  formData.append('merchant_id', merchantId);

  try {
    const res = await fetch(BASE_API_URL + 'dishes/get_dish_by_merchant.php', { method: 'POST', body: formData });
    const data = await res.json();

    if (!data.dishes || data.dishes.length === 0) {
      dishesList.innerHTML = '<div class="empty">暂无菜品</div>';
      return;
    }

    dishesList.innerHTML = data.dishes.map(dish => `
      <div class="dish-card">
        <img src="${dish.image_url || 'https://picsum.photos/300/200?random=' + dish.dish_id}" alt="${dish.name}">
        <div class="dish-info">
          <h3>${dish.name}</h3>
          <p class="price">¥${dish.price.toFixed(2)}</p>
          <p class="description">${dish.description || '暂无描述'}</p>
          <button class="add-to-cart" onclick="addToCart(${dish.dish_id}, ${dish.price})">加入购物车</button>
        </div>
      </div>`).join('');
  } catch (error) {
    dishesList.innerHTML = `<div class="error">加载失败：${error.message}</div>`;
  }
}

async function addToCart(dishId, price) {
  if (!customerId) {
    alert('请先登录');
    window.location.href = '/login/login.html';
    return;
  }

  const formData = new FormData();
  formData.append('customer_id', customerId);
  formData.append('dish_id', dishId);
  formData.append('count', 1);
  formData.append('total_price', price);

  try {
    const res = await fetch(BASE_API_URL + 'carts/create.php', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      updateCartCount();
      alert('已加入购物车');
    } else {
      throw new Error(data.message || '添加失败');
    }
  } catch (error) {
    alert('加入购物车失败: ' + error.message);
  }
}

async function loadCart() {
  const cartContainer = document.getElementById('cart-items');
  const cartCountElem = document.getElementById('cart-count');
  if (!customerId) { if(cartContainer) cartContainer.innerHTML='<p>请先登录</p>'; return; }

  const fd = new FormData();
  fd.append('customer_id', customerId);
  try {
    const res  = await fetch(BASE_API_URL + 'carts/get_cart_by_customer.php', { method: 'POST', body: fd });
    const json = await res.json();
    cartData   = json.carts || [];

    if (!cartContainer) return;
    cartContainer.innerHTML = '';
    let total = 0, totalCnt = 0;

    if (cartData.length === 0) {
      cartContainer.innerHTML = '<p>购物车为空</p>';
    } else {
      cartData.forEach(it => {
        total += parseFloat(it.total_price);
        totalCnt += parseInt(it.count);
        cartContainer.insertAdjacentHTML('beforeend', `
          <div class="cart-card">
            <p>菜品 ID：${it.dish_id}</p>
            <p>数量：${it.count}</p>
            <p>小计：¥${parseFloat(it.total_price).toFixed(2)}</p>
          </div>`);
      });
    }

    const totalElem = document.getElementById('total-price');
    if (totalElem) totalElem.textContent = '¥' + total.toFixed(2);
    if (cartCountElem) cartCountElem.textContent = totalCnt;
  } catch (err) {
    if (cartContainer) cartContainer.innerHTML = `<p>加载失败：${err.message}</p>`;
  }
}

async function loadOrdersByStatus(type) {
  const container = document.querySelector('.orders-list');
  if (!customerId) {
    container.innerHTML = '<p>请先登录</p>';
    return;
  }

  const formData = new FormData();
  formData.append('customer_id', customerId);

  try {
    const res = await fetch(BASE_API_URL + 'orders/get_order_by_customer.php', { method: 'POST', body: formData });
    const data = await res.json();
    const orders = data.orders || [];

    console.log("订单数据：", orders); // ✅ 调试输出

    const filtered = orders.filter(order => {
      const status = parseInt(order.status);
      if (type === 'active') return [0, 1, 2].includes(status);
      if (type === 'history') return status === 3;
      return false;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<p>暂无${type === 'active' ? '进行中' : '历史'}订单</p>`;
      return;
    }

    container.innerHTML = filtered.map(order => `
      <div class="order-card">
        <div class="order-header">
          <span class="order-id">订单号: #${order.order_id}</span>
          <span class="order-date">${formatDate(order.order_time)}</span>
          <span class="order-status ${parseInt(order.status) === 3 ? 'completed' : 'processing'}">
            ${getOrderStatusText(order.status)}
          </span>
        </div>
        <div class="order-details">
          <p>地址：${order.address}</p>
          <p>总价：¥${parseFloat(order.total_price).toFixed(2)}</p>
        </div>
      </div>`).join('');
  } catch (err) {
    container.innerHTML = `<p>订单加载失败：${err.message}</p>`;
  }
}

function getOrderStatusText(status) {
  switch (parseInt(status)) {
    case 0: return '等待商家接单';
    case 1: return '进行中';
    case 2: return '已完成';
    default: return '未知';
  }
}

function formatDate(timestamp) {
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

