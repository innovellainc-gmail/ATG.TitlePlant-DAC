import { NextRequest, NextResponse } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const currentState = automationEngine.getState();

    // If previously completed, aborted, or errored, automatically reset first
    if (['completed', 'error', 'aborted'].includes(currentState.status)) {
      automationEngine.resetState();
    }

    await automationEngine.startAutomation(body);
    return NextResponse.json({
      success: true,
      message: 'Automation started successfully',
      state: automationEngine.getState(),
      records: automationEngine.getRecords(),
      logs: automationEngine.getLogs(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start automation',
      },
      { status: 400 }
    );
  }
}
