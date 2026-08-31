import { NextRequest, NextResponse } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    switch (action) {
      case 'pause':
        automationEngine.pauseAutomation();
        break;
      case 'resume':
        automationEngine.resumeAutomation();
        break;
      case 'stop':
      case 'abort':
        automationEngine.stopAutomation();
        break;
      case 'reset':
        automationEngine.resetState();
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid control action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      state: automationEngine.getState(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
