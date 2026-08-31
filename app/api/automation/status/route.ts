import { NextResponse } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';

export async function GET() {
  return NextResponse.json({
    state: automationEngine.getState(),
    config: automationEngine.getConfig(),
    records: automationEngine.getRecords(),
    logs: automationEngine.getLogs(),
  });
}
