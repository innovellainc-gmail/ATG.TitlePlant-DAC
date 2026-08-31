'use client';

import React from 'react';
import {
  Globe,
  Search,
  ListPlus,
  ArrowRightCircle,
  ShoppingCart,
  CheckCircle2,
  FileDown,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { AutomationState, AutomationStep } from '@/lib/types';

interface WorkflowPipelineProps {
  state: AutomationState;
}

interface StepDefinition {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  matchingSteps: AutomationStep[];
}

const PIPELINE_STEPS: StepDefinition[] = [
  {
    id: 'setup',
    title: '1. Navigation & Search Setup',
    subtitle: 'Portal -> Index Only -> Date Range (1/1/1930 to 12/31/1930) -> Search',
    icon: Search,
    matchingSteps: ['STEP_NAVIGATE', 'STEP_DATE_INPUT', 'STEP_SEARCH_SUBMIT'],
  },
  {
    id: 'hydration',
    title: '2. DOM Hydration & Parsing',
    subtitle: 'Wait for results table networkidle & rows ready',
    icon: Globe,
    matchingSteps: ['STEP_HYDRATE_RESULTS'],
  },
  {
    id: 'loop',
    title: '3. Row Ingestion & Modal Loop',
    subtitle: 'Ellipses (...) -> Add to Cart popover -> Modal Confirm -> Cart Increment',
    icon: ListPlus,
    matchingSteps: ['STEP_ROW_LOOP', 'STEP_ACTION_MENU', 'STEP_MODAL_CONFIRM'],
  },
  {
    id: 'paginate',
    title: '4. Pagination Traversal',
    subtitle: 'Auto-advance across all result pages',
    icon: ArrowRightCircle,
    matchingSteps: ['STEP_PAGINATE'],
  },
  {
    id: 'checkout',
    title: '5. Cart & Order Checkout',
    subtitle: 'Top Nav "Cart" -> "Place Your Order" submission',
    icon: ShoppingCart,
    matchingSteps: ['STEP_CART_NAVIGATION', 'STEP_PLACE_ORDER'],
  },
  {
    id: 'download',
    title: '6. Package Retrieval',
    subtitle: 'Trigger "Download All Documents" package stream',
    icon: FileDown,
    matchingSteps: ['STEP_DOWNLOAD_PACKAGE', 'STEP_FINISHED'],
  },
];

export const WorkflowPipeline: React.FC<WorkflowPipelineProps> = ({ state }) => {
  const getStepStatus = (stepDef: StepDefinition, index: number) => {
    if (state.status === 'idle') {
      return 'idle';
    }

    const isCurrent = stepDef.matchingSteps.includes(state.currentStep);
    if (isCurrent && state.status === 'running') {
      return 'active';
    }
    if (isCurrent && state.status === 'paused') {
      return 'paused';
    }

    // Determine if step is completed based on sequence order
    const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.matchingSteps.includes(state.currentStep));
    if (state.status === 'completed' || (currentStepIndex !== -1 && currentStepIndex > index)) {
      return 'completed';
    }

    return 'pending';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-600" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Automated Execution Pipeline
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-medium">
            {state.currentStep}
          </span>
        </div>
        {state.activeSelector && (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono truncate max-w-md">
            <span className="text-slate-400">Active Selector:</span>
            <code className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] border border-blue-200 truncate font-semibold">
              {state.activeSelector}
            </code>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {PIPELINE_STEPS.map((step, idx) => {
          const status = getStepStatus(step, idx);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`relative p-3 rounded-lg border text-left transition-all ${
                status === 'active'
                  ? 'bg-blue-50/60 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                  : status === 'completed'
                  ? 'bg-emerald-50/40 border-emerald-300'
                  : status === 'paused'
                  ? 'bg-amber-50/60 border-amber-400'
                  : 'bg-slate-50 border-slate-200 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1.5 rounded ${
                    status === 'active'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : status === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : status === 'paused'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {status === 'active' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400">
                  0{idx + 1}
                </span>
              </div>

              <h3
                className={`text-xs font-bold leading-tight ${
                  status === 'active'
                    ? 'text-blue-900'
                    : status === 'completed'
                    ? 'text-emerald-900'
                    : 'text-slate-800'
                }`}
              >
                {step.title}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {step.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Current Operation:</span>
          <span className="text-slate-600 font-mono text-[11px]">{state.stepDescription}</span>
        </div>
        {state.totalPages > 1 && (
          <div className="font-mono text-[11px] text-slate-500 font-medium">
            Page {state.currentPage} of {state.totalPages}
          </div>
        )}
      </div>
    </div>
  );
};
