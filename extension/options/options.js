// PriceWatch Full Options Dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadToken();
  bindEvents();
});

async function loadData() {
  const { subscriptions = [], priceHistory = {} } = await chrome.storage.local.get(['subscriptions', 'priceHistory']);
  updateStats(subscriptions, priceHistory);
  renderList(subscriptions, priceHistory);
}

function updateStats(subscriptions, priceHistory) {
  document.getElementById('totalCount').textContent = subscriptions.length;
  const changed = subscriptions.filter(s => s.previousPrice && parseFloat(s.previousPrice) !== parseFloat(s.currentPrice));
  document.getElementById('changedCount').textContent = changed.length;
  let monthly = 0;
  for (const s of subscriptions) {
    const price = parseFloat(s.currentPrice);
    if (isNaN(price)) continue;
    if (s.interval === 'year') monthly += price / 12;
    else monthly += price;
  }
  document.getElementById('monthlyTotal').textContent = '$' + monthly.toFixed(2);
}

function renderList(subscriptions, priceHistory) {
  const container = document.getElementById('subList');
  if (!subscriptions.length) {
    container.innerHTML = '<div class="empty-state-large">No subscriptions yet<br/><span style="font-size:13px;color:#5f6368;">Click the extension icon to add your first subscription</span></div>';
    return;
  }
  let html = '<div class="table-header"><span>Name</span><span>Current Price</span><span>Change</span><span>Last Checked</span><span></span></div>';
  for (const sub of subscriptions) {
    const prevPrice = sub.previousPrice ? parseFloat(sub.previousPrice) : null;
    const currPrice = parseFloat(sub.currentPrice);
    const hasChanged = prevPrice !== null && prevPrice !== currPrice;
    const wentUp = hasChanged && currPrice > prevPrice;
    const changeText = hasChanged ? (wentUp ? '+$' + (currPrice - prevPrice).toFixed(2) : 'Price dropped') : '--';
    const changeClass = hasChanged ? (wentUp ? 'up' : 'down') : 'none';
    const lastChecked = sub.lastCheckedAt ? timeAgo(new Date(sub.lastCheckedAt)) : 'Not checked';
    html += '<div class="sub-row" data-id="' + sub.id + '"><div class="name">' + escHtml(sub.name) + '<span class="url">' + escHtml(sub.url || '') + '</span></div><div><div class="price ' + (hasChanged ? 'previous' : '') + '">' + sub.currency + sub.currentPrice + '</div>' + (hasChanged ? '<div class="price">' + sub.currency + sub.previousPrice + '</div>' : '') + '</div><div class="change ' + changeClass + '">' + changeText + '</div><div class="last-checked">' + lastChecked + '</div><div><button class="btn btn-danger remove-btn" data-id="' + sub.id + '">x</button></div></div>';
  }
  container.innerHTML = html;
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.runtime.sendMessage({ type: 'REMOVE_SUBSCRIPTION', id: btn.dataset.id });
      await loadData();
    });
  });
}

// --- Token Management ---

async function loadToken() {
  const { authToken = '' } = await chrome.storage.local.get('authToken');
  const statusEl = document.getElementById('syncStatusText');
  const tokenInput = document.getElementById('tokenInput');
  if (authToken) {
    statusEl.textContent = 'Connected to cloud';
    statusEl.style.color = '#16a34a';
    tokenInput.value = authToken;
  } else {
    statusEl.textContent = 'Not connected';
    statusEl.style.color = '#5f6368';
    tokenInput.value = '';
  }
}

function bindEvents() {
  document.getElementById('searchInput').addEventListener('input', async (e) => {
    const q = e.target.value.toLowerCase();
    const { subscriptions = [] } = await chrome.storage.local.get('subscriptions');
    const filtered = subscriptions.filter(s => s.name.toLowerCase().includes(q) || (s.url || '').toLowerCase().includes(q));
    const { priceHistory = {} } = await chrome.storage.local.get('priceHistory');
    updateStats(filtered, priceHistory);
    renderList(filtered, priceHistory);
  });

  document.getElementById('btnCheckAll').addEventListener('click', async () => {
    const btn = document.getElementById('btnCheckAll');
    btn.textContent = 'Checking...';
    btn.disabled = true;
    await chrome.runtime.sendMessage({ type: 'CHECK_NOW' });
    setTimeout(async () => {
      btn.textContent = 'Check All';
      btn.disabled = false;
      await loadData();
    }, 2000);
  });

  document.getElementById('btnExport').addEventListener('click', async () => {
    const { subscriptions = [], priceHistory = {} } = await chrome.storage.local.get(['subscriptions', 'priceHistory']);
    const data = { subscriptions, priceHistory, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pricewatch-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnSaveToken').addEventListener('click', async () => {
    const token = document.getElementById('tokenInput').value.trim();
    if (!token) { alert('Please enter a token'); return; }
    const result = await chrome.runtime.sendMessage({ type: 'SET_AUTH_TOKEN', token });
    if (result.success) {
      await loadToken();
      alert('Token saved! Your data will sync to the cloud.');
    }
  });

  document.getElementById('btnClearToken').addEventListener('click', async () => {
    if (!confirm('Disconnect cloud sync?')) return;
    await chrome.runtime.sendMessage({ type: 'SET_AUTH_TOKEN', token: '' });
    await loadToken();
  });

  document.getElementById('btnGetToken').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: PRICEWATCH_CONFIG.API_URL + '/dashboard/settings' });
  });
}

function timeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
