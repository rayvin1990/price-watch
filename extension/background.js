// PriceWatch Background Service Worker
importScripts("config.js");

const CHECK_INTERVAL_MINUTES = PRICEWATCH_CONFIG.CHECK_INTERVAL_MINUTES || 60;
const SAAS_API_URL = PRICEWATCH_CONFIG.API_URL;

chrome.runtime.onInstalled.addListener(({ reason }) => {
  chrome.alarms.create("priceCheck", { periodInMinutes: CHECK_INTERVAL_MINUTES });
  if (reason === "install") {
    chrome.storage.local.set({ subscriptions: [], priceHistory: {}, authToken: "" });
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "priceCheck") await checkAllSubscriptions();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "ADD_SUBSCRIPTION":
      addSubscription(message.data).then(sendResponse).catch(e => sendResponse({ error: e.message }));
      return true;
    case "REMOVE_SUBSCRIPTION":
      removeSubscription(message.id).then(sendResponse).catch(e => sendResponse({ error: e.message }));
      return true;
    case "GET_SUBSCRIPTIONS":
      getSubscriptions().then(sendResponse).catch(e => sendResponse({ error: e.message }));
      return true;
    case "CHECK_NOW":
      checkAllSubscriptions().then(sendResponse).catch(e => sendResponse({ error: e.message }));
      return true;
    case "GET_SYNC_STATUS":
      getSyncStatus().then(sendResponse);
      return true;
    case "SET_AUTH_TOKEN":
      setAuthToken(message.token).then(sendResponse);
      return true;
    case "AUTO_DETECT_PRICE":
      sendResponse(detectPriceFromText(message.text));
      return false;
    case "PAGE_PRICE_DETECTED":
      return false;
  }
});

async function setAuthToken(token) {
  await chrome.storage.local.set({ authToken: token || "" });
  return { success: true, synced: !!token };
}

async function getSyncStatus() {
  const r = await chrome.storage.local.get(["authToken", "subscriptions"]);
  return { isLoggedIn: !!r.authToken, pendingSync: r.subscriptions.length > 0, count: r.subscriptions.length };
}

async function addSubscription(data) {
  const { subscriptions = [] } = await chrome.storage.local.get("subscriptions");
  const sub = {
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    name: data.name,
    url: data.url || "",
    currentPrice: data.price,
    currency: data.currency || "$",
    interval: data.interval || "month",
    createdAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    notes: data.notes || ""
  };
  subscriptions.push(sub);
  const { priceHistory = {} } = await chrome.storage.local.get("priceHistory");
  priceHistory[sub.id] = [{ price: data.price, date: sub.createdAt, source: "manual" }];
  await chrome.storage.local.set({ subscriptions, priceHistory });
  syncToSaaS("POST", "/api/subscriptions", sub).catch(() => {});
  return { success: true, subscription: sub };
}

async function removeSubscription(id) {
  const { subscriptions = [] } = await chrome.storage.local.get("subscriptions");
  const { priceHistory = {} } = await chrome.storage.local.get("priceHistory");
  delete priceHistory[id];
  await chrome.storage.local.set({
    subscriptions: subscriptions.filter(s => s.id !== id),
    priceHistory
  });
  syncToSaaS("DELETE", "/api/subscriptions/" + id).catch(() => {});
  return { success: true };
}

async function getSubscriptions() {
  const { subscriptions = [] } = await chrome.storage.local.get("subscriptions");
  return subscriptions;
}

async function checkAllSubscriptions() {
  const { subscriptions = [] } = await chrome.storage.local.get("subscriptions");
  if (!subscriptions.length) return { changes: 0 };
  let changes = 0;
  for (const sub of subscriptions) {
    try { if (await checkSingleSubscription(sub)) changes++; }
    catch (e) { console.error("Check failed for", sub.name, e); }
  }
  return { changes };
}

async function checkSingleSubscription(sub) {
  if (!sub.url) return false;
  try {
    const res = await fetch(sub.url);
    const html = await res.text();
    const dp = detectPriceFromText(html, sub.name);
    if (!dp) return false;
    const op = parseFloat(sub.currentPrice);
    const np = parseFloat(dp);
    if (isNaN(op) || isNaN(np)) return false;
    const { priceHistory = {} } = await chrome.storage.local.get("priceHistory");
    if (!priceHistory[sub.id]) priceHistory[sub.id] = [];
    priceHistory[sub.id].push({ price: dp, date: new Date().toISOString(), source: "auto_check" });
    const changed = np !== op;
    if (changed) {
      sub.previousPrice = sub.currentPrice;
      sub.currentPrice = dp;
      sub.lastCheckedAt = new Date().toISOString();
      const s = await chrome.storage.local.get("subscriptions");
      await chrome.storage.local.set({
        subscriptions: s.subscriptions.map(x => x.id === sub.id ? sub : x),
        priceHistory
      });
      syncToSaaS("PATCH", "/api/subscriptions/" + sub.id, { current_price: dp }).catch(() => {});
      if (np > op) await sendPriceAlert(sub, op, np);
      return true;
    }
    sub.lastCheckedAt = new Date().toISOString();
    const s = await chrome.storage.local.get("subscriptions");
    await chrome.storage.local.set({ subscriptions: s.subscriptions.map(x => x.id === sub.id ? sub : x), priceHistory });
    return false;
  } catch (e) {
    console.error("Fetch error", sub.url, e);
    return false;
  }
}

async function sendPriceAlert(sub, oldPrice, newPrice) {
  const pct = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
  await chrome.notifications.create({
    type: "basic", iconUrl: "icons/icon128.png",
    title: sub.name + " price went up!",
    message: sub.currency + oldPrice + " -> " + sub.currency + newPrice + " (+" + pct + "%)",
    priority: 2, buttons: [{ title: "View Details" }]
  });
}

chrome.notifications.onButtonClicked.addListener((id, idx) => {
  if (idx === 0) chrome.runtime.openOptionsPage();
});

function detectPriceFromText(text, titleHint) {
  titleHint = titleHint || "";
  const patterns = [
    ...(titleHint ? [
      new RegExp(escapeRegex(titleHint) + "[\\s\\S]{0,200}[\\$\\€\\£\\¥]\\s*\\d+[\\.\\,]?\\d*", "i"),
      new RegExp("[\\$\\€\\£\\¥]\\s*\\d+[\\.\\,]?\\d*[\\s\\S]{0,50}" + escapeRegex(titleHint), "i")
    ] : []),
    /\b([\$\€\£\¥])\s*(\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)\s*(\/|\sper\s|\s\/\s)(month|mo|year|yr|m|y|annually|monthly)\b/i,
    /\b(?:price|pricing|plan|from|start(?:ing)?\s+at)\s*[:\s]*[\$\€\£\¥]\s*(\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)/i,
    /\b[\$\€\£\¥]\s*(\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)\s*(?!\/|\sper)/
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = m[0].match(/\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?|\d+[\.\,]?\d*/);
      if (n) return normalizePrice(n[0]);
    }
  }
  return null;
}

function normalizePrice(s) {
  if (s.includes(",") && s.includes(".")) {
    return s.lastIndexOf(".") > s.lastIndexOf(",") ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  }
  if (s.includes(",")) {
    const p = s.split(",");
    return (p.length === 2 && p[1].length <= 2) ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  return s;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function syncToSaaS(method, path, body) {
  const { authToken } = await chrome.storage.local.get("authToken");
  if (!authToken) return;
  const opts = { method, headers: { "Content-Type": "application/json", "Authorization": "Bearer " + authToken } };
  if (body && method !== "DELETE") opts.body = JSON.stringify(body);
  try {
    const res = await fetch(SAAS_API_URL + path, opts);
    if (!res.ok) console.warn("Sync failed:", method, path, res.status);
  } catch (e) { console.warn("Sync error:", e.message); }
}
