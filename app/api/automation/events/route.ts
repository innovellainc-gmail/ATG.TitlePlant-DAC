import { NextRequest } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection ping and full current state snapshot
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'STATE_UPDATE',
          state: automationEngine.getState(),
          records: automationEngine.getRecords(),
          timestamp: Date.now()
        })}\n\n`)
      );

      // Subscribe to live automation engine broadcasts
      const unsubscribe = automationEngine.subscribe((event) => {
        if (isClosed) return;
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed
          isClosed = true;
        }
      });

      // Keepalive heartbeat ping every 10 seconds
      const heartbeatInterval = setInterval(() => {
        if (isClosed) {
          clearInterval(heartbeatInterval);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          isClosed = true;
          clearInterval(heartbeatInterval);
        }
      }, 10000);

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(heartbeatInterval);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
