// PriceWatch Content Script
// Automatically detects subscription pricing info on pages being browsed

(function() {
  function extractPageInfo() {
    const text = document.body.innerText;
    const title = document.title;

    // Detect if page is a pricing/subscription page
    const pricingKeywords = ['pricing', 'plans', 'subscription', 'billing', 'plan', 'upgrade',
      'price', 'premium', 'pro', 'enterprise', '套餐', '定价', '订阅', '价格'];

    const isPricingPage = pricingKeywords.some(k =>
      title.toLowerCase().includes(k) ||
      text.slice(0, 2000).toLowerCase().includes(k)
    );

    // Extract site name from title
    const hostname = window.location.hostname;
    const siteName = title
      .replace(/\s*[-–|–|]+\s*.*$/, '')
      .replace(/\s*\|.*$/, '')
      .trim()
      || hostname.replace(/^www\./, '');

    // Extract price
    const price = extractPrice(text);

    return {
      url: window.location.href,
      title,
      siteName,
      isPricingPage,
      price,
      hostname
    };
  }

  function extractPrice(text) {
    // Normalize price strings that use comma as thousands separator
    const patterns = [
      // $XX/mo or $XX/month with currency + unit
      /(\$\s*\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)\s*(\/|\sper\s)(month|mo|m|year|yr|y|annually)\b/i,
      // €XX/mo
      /(\€\s*\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)\s*(\/|\sper\s)(month|mo|m|year|yr|y)\b/i,
      // "Price: $XX" / "Plan: $XX"
      /(?:price|pricing|plan|from|start(?:ing)?\s+at)\s*[:\s]*(\$\s*\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)/i,
      // Bare $XX
      /(\$\s*\d{1,3}(?:[\,\.]\d{3})*(?:[\.\,]\d{1,2})?)/,
      // Chinese price ¥XX/月
      /(\¥\s*\d+[\.\,]?\d*)\s*\/\s*(月|年)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const raw = match[1] || match[0];
        const cleaned = normalizePrice(raw.replace(/[^0-9.,]/g, ''));
        return {
          raw: raw.trim(),
          value: parseFloat(cleaned),
          currency: (raw.includes('$') ? '$' :
                     raw.includes('€') ? '€' :
                     raw.includes('£') ? '£' :
                     raw.includes('¥') ? '¥' : '$'),
        };
      }
    }

    return null;
  }

  function normalizePrice(str) {
    if (str.includes(',') && str.includes('.')) {
      const lastDot = str.lastIndexOf('.');
      const lastComma = str.lastIndexOf(',');
      if (lastDot > lastComma) {
        return str.replace(/,/g, '');
      } else {
        return str.replace(/\./g, '').replace(',', '.');
      }
    }
    if (str.includes(',')) {
      const parts = str.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        return str.replace(',', '.');
      }
      return str.replace(/,/g, '');
    }
    return str;
  }

  // Run on page load
  const pageInfo = extractPageInfo();

  // Store for popup to read
  window.__priceWatchPageInfo = pageInfo;

  // Watch for SPA page changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => {
        const newInfo = extractPageInfo();
        window.__priceWatchPageInfo = newInfo;
      }, 2000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
