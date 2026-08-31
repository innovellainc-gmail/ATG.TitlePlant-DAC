import { NextRequest, NextResponse } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    await automationEngine.startAutomation(body);
    return NextResponse.json({
      success: true,
      message: 'Automation started successfully',
      state: automationEngine.getState(),
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
