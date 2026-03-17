import { updateOrderItemsProgress } from '../lib/firestore';

export async function updateOrderProgress(orderId: string): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix-2',hypothesisId:'H11',location:'services/picking.service.ts:updateOrderProgress:entry',message:'updateOrderProgress service called',data:{orderId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  await updateOrderItemsProgress(orderId);
  // #region agent log
  fetch('http://127.0.0.1:7898/ingest/0f633de0-e10c-4f8b-9ba7-60b5586ab96f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4b6abf'},body:JSON.stringify({sessionId:'4b6abf',runId:'post-fix-2',hypothesisId:'H11',location:'services/picking.service.ts:updateOrderProgress:exit',message:'updateOrderProgress service resolved',data:{orderId},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
}

