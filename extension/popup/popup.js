// PriceWatch Popup Logic
let currentPageInfo = null;
let currentTabUrl = '';

document.addEventListener('DOMContentLoaded', async () => {
  await detectCurrentPage();
  await loadSubscriptions();
  await checkSyncStatus();
  bindEvents();
});

async function checkSyncStatus() {
  const status = await chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' });
  if (!status) return;
  const syncText = document.getElementById('syncText');
  const syncBadge = document.getElementById('syncBadge');
  const btn = document.getElementById('btnSyncSetup');
  if (status.isLoggedIn) {
    syncText.textContent = 'Synced to cloud';
    syncBadge.style.display = 'inline';
    btn.textContent = 'Manage';
  } else {
    syncText.textContent = 'Not connected';
    syncBadge.style.display = 'none';
    btn.textContent = 'Connect →';
  }
}

async function detectCurrentPage() {
  const status = document.getElementById('detectStatus');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
      status.textContent = 'Cannot access this page';
      return;
    }
    currentTabUrl = tab.url;
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.__priceWatchPageInfo
    }).catch(() => null);
    if (results && results[0] && results[0].result) {
      currentPageInfo = results[0].result;
      if (currentPageInfo.price) {
        status.textContent = currentPageInfo.siteName + ' - ' + currentPageInfo.price.raw;
        document.getElementById('btnQuickAdd').style.display = 'block';
        document.getElementById('btnQuickAdd').textContent = 'Track ' + currentPageInfo.siteName;
        return;
      }
    }
    status.textContent = 'Visit a subscription page to auto-detect';
  } catch (err) {
    status.textContent = 'No pricing info detected';
  }
}

async function loadSubscriptions() {
  const { subscriptions = [] } = await chrome.storage.local.get('subscriptions');
  const list = document.getElementById('subList');
  const count = document.getElementById('subCount');
  count.textContent = subscriptions.length;
  if (!subscriptions.length) {
    list.innerHTML = '<div class="empty-state">No subscriptions yet</div>';
    return;
  }
  list.innerHTML = '';
  const sorted = [...subscriptions].reverse();
  for (const sub of sorted) {
    const item = document.createElement('div');
    item.className = 'sub-item';
    const hasChanged = sub.previousPrice && parseFloat(sub.previousPrice) !== parseFloat(sub.currentPrice);
    const wentUp = hasChanged && parseFloat(sub.currentPrice) > parseFloat(sub.previousPrice);
    item.innerHTML = '<div class="sub-info"><div class="sub-name">' + escHtml(sub.name) + '</div><div class="sub-url">' + escHtml(sub.url || '') + '</div></div><div class="sub-price"><div class="sub-price-current ' + (wentUp ? 'price-up' : '') + '">' + sub.currency + sub.currentPrice + '<span class="sub-interval">/' + sub.interval + '</span></div>' + (hasChanged ? '<div class="sub-price-previous">' + sub.currency + sub.previousPrice + '</div>' : '') + '<button class="btn btn-danger remove-btn" data-id="' + sub.id + '">Remove</button></div>';
    list.appendChild(item);
    item.querySelector('.remove-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.runtime.sendMessage({ type: 'REMOVE_SUBSCRIPTION', id: sub.id });
      await loadSubscriptions();
    });
  }
}

function bindEvents() {
  document.getElementById('btnQuickAdd').addEventListener('click', async () => {
    if (!currentPageInfo || !currentPageInfo.price) return;
    const result = await chrome.runtime.sendMessage({
      type: 'ADD_SUBSCRIPTION',
      data: { name: currentPageInfo.siteName, url: currentPageInfo.url, price: currentPageInfo.price.value.toString(), currency: currentPageInfo.price.currency, interval: 'month' }
    });
    if (result.success) {
      showToast('Tracked!');
      await loadSubscriptions();
      document.getElementById('btnQuickAdd').style.display = 'none';
      document.getElementById('detectStatus').textContent = 'Tracking';
    }
  });

  document.getElementById('btnAdd').addEventListener('click', async () => {
    const name = document.getElementById('inputName').value.trim();
    const url = document.getElementById('inputUrl').value.trim();
    const currency = document.getElementById('selectCurrency').value;
    const price = document.getElementById('inputPrice').value;
    const interval = document.getElementById('selectInterval').value;
    if (!name) { showToast('Name is required'); return; }
    if (!price || isNaN(parseFloat(price))) { showToast('Valid price required'); return; }
    const result = await chrome.runtime.sendMessage({
      type: 'ADD_SUBSCRIPTION',
      data: { name, url: url || currentTabUrl || '', price: price.toString(), currency, interval }
    });
    if (result.success) {
      showToast('Added!');
      document.getElementById('inputName').value = '';
      document.getElementById('inputUrl').value = '';
      document.getElementById('inputPrice').value = '';
      await loadSubscriptions();
    }
  });

  document.getElementById('btnCheckNow').addEventListener('click', async () => {
    const btn = document.getElementById('btnCheckNow');
    btn.textContent = 'Checking...';
    btn.disabled = true;
    await chrome.runtime.sendMessage({ type: 'CHECK_NOW' });
    setTimeout(() => {
      btn.textContent = 'Check Now';
      btn.disabled = false;
      showToast('Check complete');
    }, 1500);
  });

  document.getElementById('btnOpenDashboard').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('btnSyncSetup').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('inputPrice').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btnAdd').click();
  });
}

function showToast(msg) {
  const existing = document.querySelector('.pw-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'pw-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2000);
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
