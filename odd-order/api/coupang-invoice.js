import crypto from 'crypto';
import { ProxyAgent, fetch as proxyFetch } from 'undici';

const COUPANG_HOST = 'https://api-gateway.coupang.com';
const API_PATH_PREFIX = '/v2/providers/openapi/apis/api/v4/vendors';

function buildAuthorization({ method, path, query, accessKey, secretKey }) {
  const now = new Date();
  const signedDate = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
    .slice(2);
  const message = signedDate + method + path + (query || '');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

async function coupangFetch({ method, path, query, body, accessKey, secretKey }) {
  const authorization = buildAuthorization({ method, path, query, accessKey, secretKey });
  const url = `${COUPANG_HOST}${path}${query ? '?' + query : ''}`;
  const fetchOptions = {
    method,
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  };
  if (body) fetchOptions.body = JSON.stringify(body);
  if (process.env.PROXY_URL) {
    fetchOptions.dispatcher = new ProxyAgent(process.env.PROXY_URL);
  }
  return proxyFetch(url, fetchOptions);
}

/**
 * 최근 주문 목록 조회 → orderId→[{shipmentBoxId, vendorItemId}] 매핑 구축
 *
 * 단건 조회 엔드포인트(/ordersheets/{id})는 실제로 shipmentBoxId를 기대하므로
 * orderId로는 사용할 수 없다. 대신 목록 조회(coupang-orders.js와 동일)로
 * 최근 7일간 ACCEPT+INSTRUCT 주문을 가져와서 orderId 기반 매핑을 만든다.
 */
async function buildOrderIdMapping({ accessKey, secretKey, vendorId }) {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const kstFrom = new Date(kstNow.getTime() - 7 * 24 * 60 * 60 * 1000);
  const createdAtFrom = kstFrom.toISOString().slice(0, 10);
  const createdAtTo = kstNow.toISOString().slice(0, 10);

  const mapping = new Map();

  for (const status of ['ACCEPT', 'INSTRUCT']) {
    const path = `${API_PATH_PREFIX}/${vendorId}/ordersheets`;
    const query =
      `createdAtFrom=${createdAtFrom}` +
      `&createdAtTo=${createdAtTo}` +
      `&status=${status}` +
      `&maxPerPage=50`;

    const res = await coupangFetch({ method: 'GET', path, query, accessKey, secretKey });

    if (!res.ok) {
      console.warn(`[buildOrderIdMapping] status=${status} 조회 실패: ${res.status}`);
      continue;
    }

    const rawText = await res.text();
    const safeText = rawText.replace(/"shipmentBoxId"\s*:\s*(\d+)/g, '"shipmentBoxId":"$1"');
    const data = JSON.parse(safeText);
    const sheets = Array.isArray(data?.data) ? data.data : [];

    console.log(`[buildOrderIdMapping] status=${status}, sheets=${sheets.length}`);

    for (const sheet of sheets) {
      const orderId = String(sheet.orderId ?? '');
      const items = Array.isArray(sheet.orderItems) ? sheet.orderItems : [];
      for (const item of items) {
        if (!mapping.has(orderId)) mapping.set(orderId, []);
        mapping.get(orderId).push({
          shipmentBoxId: String(sheet.shipmentBoxId ?? ''),
          orderId,
          vendorItemId: String(item.vendorItemId ?? ''),
        });
      }
    }
  }

  return mapping;
}

/**
 * 상품준비중 처리 (ACCEPT → INSTRUCT)
 * 이미 INSTRUCT 상태면 에러가 나지만, 무시하고 진행
 */
async function acknowledgeShipmentBoxes(shipmentBoxIds, { accessKey, secretKey, vendorId }) {
  const path = `${API_PATH_PREFIX}/${vendorId}/ordersheets/acknowledgement`;
  const body = {
    vendorId,
    shipmentBoxIds: shipmentBoxIds.map(id => Number(id)),
  };

  const res = await coupangFetch({ method: 'PUT', path, body, accessKey, secretKey });
  // 이미 처리된 경우 에러가 날 수 있으므로 결과만 로깅
  const text = await res.text();
  console.log(`[acknowledgement] status=${res.status}, body=${text.slice(0, 200)}`);
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY, COUPANG_VENDOR_ID } = process.env;
  if (!COUPANG_ACCESS_KEY || !COUPANG_SECRET_KEY || !COUPANG_VENDOR_ID) {
    return res.status(500).json({
      success: false,
      error: '쿠팡 환경변수(COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY, COUPANG_VENDOR_ID)가 설정되지 않았습니다.',
    });
  }

  try {
    const { orders, deliveryCompanyCode } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: '등록할 송장이 없습니다.' });
    }

    const creds = {
      accessKey: COUPANG_ACCESS_KEY,
      secretKey: COUPANG_SECRET_KEY,
      vendorId: COUPANG_VENDOR_ID,
    };

    // 1단계: orderId → shipmentBoxId 매핑 구축 (목록 조회 사용)
    const invoiceDtos = [];
    const allShipmentBoxIds = new Set();
    const errors = [];

    console.log('[coupang-invoice] 요청 orders:', JSON.stringify(orders));

    // 프론트에서 shipmentBoxId가 안 온 주문이 하나라도 있으면 매핑 조회
    const needsMapping = orders.some(o => !o.shipmentBoxId || !o.vendorItemId);
    let orderIdMap = null;
    if (needsMapping) {
      orderIdMap = await buildOrderIdMapping(creds);
      console.log(`[coupang-invoice] 매핑 구축 완료: ${orderIdMap.size}개 orderId`);
    }

    for (const order of orders) {
      try {
        let shipmentBoxId = order.shipmentBoxId || '';
        let vendorItemId = order.vendorItemId || '';

        // shipmentBoxId가 없으면 매핑에서 찾기
        if (!shipmentBoxId || !vendorItemId) {
          const infos = orderIdMap?.get(String(order.orderId));
          if (!infos || infos.length === 0) {
            throw new Error(`주문 매핑 없음 (orderId: ${order.orderId}) - 쿠팡 주문 목록에서 찾을 수 없습니다.`);
          }
          // 첫 번째 매칭 사용 (vendorItemId가 제공된 경우 정확 매칭 시도)
          const match = vendorItemId
            ? infos.find(i => i.vendorItemId === vendorItemId) || infos[0]
            : infos[0];
          shipmentBoxId = match.shipmentBoxId;
          vendorItemId = match.vendorItemId;
          console.log(`[coupang-invoice] 매핑 조회: orderId=${order.orderId} → shipmentBoxId=${shipmentBoxId}, vendorItemId=${vendorItemId}`);
        } else {
          console.log(`[coupang-invoice] 직접 등록: orderId=${order.orderId}, shipmentBoxId=${shipmentBoxId}`);
        }

        allShipmentBoxIds.add(shipmentBoxId);
        invoiceDtos.push({
          shipmentBoxId: Number(shipmentBoxId),
          orderId: Number(order.orderId),
          vendorItemId: Number(vendorItemId),
          deliveryCompanyCode: deliveryCompanyCode || 'CJGLS',
          invoiceNumber: order.trackingNumber,
          splitShipping: false,
          preSplitShipped: false,
          estimatedShippingDate: '',
        });
      } catch (err) {
        errors.push({ orderId: order.orderId, error: err.message });
      }
    }

    if (invoiceDtos.length === 0) {
      return res.status(400).json({
        success: false,
        error: '등록 가능한 송장이 없습니다.',
        errors,
      });
    }

    // 2단계: 상품준비중 처리 (ACCEPT → INSTRUCT, 이미 처리됐으면 무시)
    const boxIds = [...allShipmentBoxIds];
    await acknowledgeShipmentBoxes(boxIds, creds);

    // 3단계: 송장 업로드 (POST)
    const path = `${API_PATH_PREFIX}/${COUPANG_VENDOR_ID}/orders/invoices`;
    const body = {
      vendorId: COUPANG_VENDOR_ID,
      orderSheetInvoiceApplyDtos: invoiceDtos,
    };

    const apiRes = await coupangFetch({
      method: 'POST',
      path,
      body,
      accessKey: COUPANG_ACCESS_KEY,
      secretKey: COUPANG_SECRET_KEY,
    });

    const resultText = await apiRes.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    if (!apiRes.ok) {
      throw new Error(`송장 업로드 실패 (${apiRes.status}): ${resultText.slice(0, 500)}`);
    }

    return res.status(200).json({
      success: true,
      registeredCount: invoiceDtos.length,
      result,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('쿠팡 송장등록 오류:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
