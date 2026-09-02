export type AutomationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error' | 'aborted';

export type AutomationStep =
  | 'STEP_INIT'
  | 'STEP_NAVIGATE'
  | 'STEP_DATE_INPUT'
  | 'STEP_SEARCH_SUBMIT'
  | 'STEP_HYDRATE_RESULTS'
  | 'STEP_ROW_LOOP'
  | 'STEP_ACTION_MENU'
  | 'STEP_MODAL_CONFIRM'
  | 'STEP_PAGINATE'
  | 'STEP_CART_NAVIGATION'
  | 'STEP_PLACE_ORDER'
  | 'STEP_DOWNLOAD_PACKAGE'
  | 'STEP_FINISHED';

export interface AutomationConfig {
  portalUrl: string;
  startDate: string;
  endDate: string;
  searchType: 'INDEX_ONLY' | 'ALL_DOCS';
  headless: boolean;
  throttleMs: number;
  maxPages: number;
  maxRecords: number;
  autoCheckout: boolean;
  autoDownload: boolean;
  retryLimit: number;
  enableVisualFrameStream: boolean;
}

export interface PublicRecord {
  id: string;
  rowNumber: number;
  instrumentNumber: string;
  bookPage: string;
  recordingDate: string;
  docType: string;
  grantor: string;
  grantee: string;
  legalDescription: string;
  pageCount: number;
  originalFilename?: string;
  cartStatus: 'pending' | 'processing' | 'in_cart' | 'order_placed' | 'downloaded' | 'failed';
  inCartTimestamp?: number;
  pageNumber: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DOM_ACTION' | 'SELECTOR_HIT' | 'CART_UPDATE' | 'WARN' | 'SUCCESS' | 'ERROR';
  step: AutomationStep;
  message: string;
  details?: Record<string, unknown>;
}

export interface AutomationState {
  runId: string;
  status: AutomationStatus;
  currentStep: AutomationStep;
  stepDescription: string;
  totalRecordsFound: number;
  recordsProcessed: number;
  itemsInCart: number;
  currentPage: number;
  totalPages: number;
  activeRecordId: string | null;
  activeSelector: string | null;
  startTime: number | null;
  endTime: number | null;
  elapsedMs: number;
  orderConfirmationId: string | null;
  downloadPackageName: string | null;
  errorMessage: string | null;
  retryCount: number;
  currentViewportState: {
    pageTitle: string;
    url: string;
    actionHighlight: string | null;
    modalOpen: boolean;
    popoverOpen: boolean;
    cartBadgeCount: number;
  };
}

export interface TelemetryEvent {
  type: 'STATE_UPDATE' | 'LOG_APPEND' | 'RECORD_UPDATE' | 'RECORD_BATCH' | 'FRAME_UPDATE' | 'COMPLETE' | 'ERROR';
  state?: AutomationState;
  log?: TelemetryLog;
  record?: PublicRecord;
  records?: PublicRecord[];
  frameData?: string;
  error?: string;
}
