/**
 * Cloudflare Worker — Stripe 結帳
 * rakuen-rr.com / VOAR × RakuenɒuyɘЯ
 *
 * 部署步驟：
 *   1. 到 stripe.com 建立帳號 → 取得 Secret Key（sk_live_...）
 *   2. 到 dash.cloudflare.com → Workers → 建立 Worker（貼上此檔）
 *   3. Worker Settings → Variables（加密儲存）填入：
 *        STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxx
 *   4. 部署後把 Worker URL 填入 jersey-01.html 的 WORKER_URL
 *
 * Stripe 測試模式：
 *   - 用 sk_test_xxx 代替 sk_live_xxx
 *   - 測試卡號：4242 4242 4242 4242，任意到期日，任意 CVC
 */

const ALLOWED_ORIGIN  = 'https://rakuen-rr.com';
const SUCCESS_URL     = 'https://rakuen-rr.com/shop/complete';
const CANCEL_URL      = 'https://rakuen-rr.com/shop/jersey-01';
const STRIPE_API      = 'https://api.stripe.com/v1';

const PRICE_TWD = 1580; // 商品定價（台幣）
const SHIPPING  = { taiwan: 100, intl: 400 };

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return cors(null, 204, env);
    }

    const url = new URL(request.url);

    // ── POST /checkout ──────────────────────────────────────────────────────
    if (request.method === 'POST' && url.pathname.endsWith('/checkout')) {
      return handleCheckout(request, env);
    }

    // ── POST /webhook ───────────────────────────────────────────────────────
    // Stripe 付款完成後呼叫（可選：記錄訂單到 Notion / Google Sheets）
    if (request.method === 'POST' && url.pathname.endsWith('/webhook')) {
      return handleWebhook(request, env);
    }

    return cors(JSON.stringify({ error: 'not found' }), 404, env);
  }
};

// ── 建立 Stripe Checkout Session ────────────────────────────────────────────
async function handleCheckout(request, env) {
  let body;
  try { body = await request.json(); }
  catch { return cors(JSON.stringify({ error: 'invalid json' }), 400, env); }

  const { size, qty = 1, region = 'taiwan' } = body;

  if (!size) return cors(JSON.stringify({ error: 'size required' }), 400, env);

  const shipping     = SHIPPING[region] ?? SHIPPING.taiwan;
  const productTotal = PRICE_TWD * qty;
  const grandTotal   = productTotal + shipping;

  // Stripe Checkout Session：以 TWD 計價（最小單位就是 1 元，非 cents）
  const params = new URLSearchParams({
    'payment_method_types[]':                  'card',
    'payment_method_types[]':                  'link',   // Link = 儲存卡號的快速結帳

    // 商品行
    'line_items[0][price_data][currency]':          'twd',
    'line_items[0][price_data][unit_amount]':       String(productTotal),
    'line_items[0][price_data][product_data][name]': `復古領足球衣（${size}）`,
    'line_items[0][price_data][product_data][description]': `VOAR × RakuenɒuyɘЯ · Retro Collar Football Jersey`,
    'line_items[0][quantity]':                      String(qty),

    // 運費行
    'line_items[1][price_data][currency]':          'twd',
    'line_items[1][price_data][unit_amount]':       String(shipping),
    'line_items[1][price_data][product_data][name]': region === 'taiwan' ? '運費（台灣本島）' : 'Shipping (International)',
    'line_items[1][quantity]':                      '1',

    'mode':        'payment',
    'success_url': SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url':  CANCEL_URL,

    // 讓 Stripe 自動開啟 Apple Pay / Google Pay
    'payment_method_options[card][request_three_d_secure]': 'automatic',

    // 客戶收據 email
    'customer_creation': 'if_required',
    'billing_address_collection': 'auto',

    // 自訂 metadata（方便追訂單）
    'metadata[size]':   size,
    'metadata[qty]':    String(qty),
    'metadata[region]': region,
    'metadata[brand]':  'RakuenɒuyɘЯ',
  });

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await res.json();

  if (!res.ok) {
    console.error('Stripe error:', JSON.stringify(session));
    return cors(JSON.stringify({ error: session.error?.message ?? 'stripe error' }), 500, env);
  }

  return cors(JSON.stringify({ url: session.url }), 200, env);
}

// ── Webhook（可選）──────────────────────────────────────────────────────────
// Stripe → POST /webhook（付款成功後通知）
// 設定方法：Stripe Dashboard → Webhooks → 加入此 Worker URL/webhook
// 事件選：checkout.session.completed
async function handleWebhook(request, env) {
  // 如需驗證 Stripe 簽名，從 env.STRIPE_WEBHOOK_SECRET 取得
  const body = await request.text();

  let event;
  try { event = JSON.parse(body); }
  catch { return new Response('bad json', { status: 400 }); }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const metadata = session.metadata;

    // TODO: 在這裡記錄訂單
    // 可以呼叫 Notion API 或 Google Sheets API 寫入訂單資訊：
    // - session.id
    // - session.customer_details.email
    // - metadata.size, metadata.qty, metadata.region
    // - session.amount_total
    console.log('Order completed:', session.id, metadata);
  }

  return new Response('ok', { status: 200 });
}

// ── CORS helpers ────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Content-Type':                'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
  };
}

function cors(body, status = 200) {
  return new Response(body, { status, headers: corsHeaders() });
}
