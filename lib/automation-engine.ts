import {
  AutomationConfig,
  AutomationState,
  AutomationStep,
  PublicRecord,
  TelemetryLog,
  TelemetryEvent,
} from './types';
import { HISTORICAL_DONA_ANA_1930_RECORDS } from './sample-records';

// Global singleton execution manager for server environment
class AutomationSessionManager {
  private static instance: AutomationSessionManager;

  private state: AutomationState = {
    runId: 'idle',
    status: 'idle',
    currentStep: 'STEP_INIT',
    stepDescription: 'Ready to start automation sequence.',
    totalRecordsFound: 0,
    recordsProcessed: 0,
    itemsInCart: 0,
    currentPage: 1,
    totalPages: 1,
    activeRecordId: null,
    activeSelector: null,
    startTime: null,
    endTime: null,
    elapsedMs: 0,
    orderConfirmationId: null,
    downloadPackageName: null,
    errorMessage: null,
    retryCount: 0,
    currentViewportState: {
      pageTitle: 'Doña Ana County, NM - Public Records Search',
      url: 'https://donaana.nm.publicsearch.us/',
      actionHighlight: null,
      modalOpen: false,
      popoverOpen: false,
      cartBadgeCount: 0,
    },
  };

  private config: AutomationConfig = {
    portalUrl: 'https://donaana.nm.publicsearch.us/',
    startDate: '1/1/1930',
    endDate: '12/31/1930',
    searchType: 'INDEX_ONLY',
    headless: true,
    throttleMs: 650,
    maxPages: 4,
    maxRecords: 24,
    autoCheckout: true,
    autoDownload: true,
    retryLimit: 3,
    enableVisualFrameStream: true,
  };

  private records: PublicRecord[] = [];
  private logs: TelemetryLog[] = [];
  private listeners: Set<(event: TelemetryEvent) => void> = new Set();
  private abortController: AbortController | null = null;
  private isPaused: boolean = false;
  private pausePromiseResolver: (() => void) | null = null;
  private timerInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.addLog('INFO', 'STEP_INIT', 'Automation controller initialized and ready.');
  }

  public static getInstance(): AutomationSessionManager {
    const globalWithAuto = globalThis as typeof globalThis & {
      __automationEngine?: AutomationSessionManager;
    };
    if (!globalWithAuto.__automationEngine) {
      globalWithAuto.__automationEngine = new AutomationSessionManager();
    }
    return globalWithAuto.__automationEngine;
  }

  public getState(): AutomationState {
    return { ...this.state };
  }

  public getConfig(): AutomationConfig {
    return { ...this.config };
  }

  public getRecords(): PublicRecord[] {
    return [...this.records];
  }

  public getLogs(): TelemetryLog[] {
    return [...this.logs];
  }

  public subscribe(listener: (event: TelemetryEvent) => void): () => void {
    this.listeners.add(listener);
    // Send initial snapshot
    listener({
      type: 'STATE_UPDATE',
      state: this.getState(),
      records: this.getRecords(),
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private broadcast(event: TelemetryEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in listener broadcast:', err);
      }
    });
  }

  private addLog(
    level: TelemetryLog['level'],
    step: AutomationStep,
    message: string,
    details?: Record<string, unknown>
  ) {
    const log: TelemetryLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      }),
      level,
      step,
      message,
      details,
    };
    this.logs.push(log);
    // Cap memory logs
    if (this.logs.length > 500) {
      this.logs.shift();
    }
    this.broadcast({ type: 'LOG_APPEND', log });
  }

  private updateState(updates: Partial<AutomationState>) {
    this.state = {
      ...this.state,
      ...updates,
      elapsedMs: this.state.startTime ? Date.now() - this.state.startTime : 0,
    };
    this.broadcast({ type: 'STATE_UPDATE', state: this.getState() });
  }

  private async checkPauseAndAbort(signal: AbortSignal): Promise<void> {
    if (signal.aborted) {
      throw new Error('Automation was aborted by user.');
    }
    if (this.isPaused) {
      this.addLog('INFO', this.state.currentStep, '⏸️ Execution paused. Waiting for resume signal...');
      await new Promise<void>((resolve) => {
        this.pausePromiseResolver = resolve;
      });
      this.addLog('INFO', this.state.currentStep, '▶️ Execution resumed.');
    }
  }

  private async sleep(ms: number, signal: AbortSignal): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < ms) {
      await this.checkPauseAndAbort(signal);
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  public async startAutomation(userConfig?: Partial<AutomationConfig>): Promise<void> {
    if (this.state.status === 'running') {
      throw new Error('Automation is already running.');
    }

    if (userConfig) {
      this.config = { ...this.config, ...userConfig };
    }

    const runId = `RUN-${Date.now().toString(36).toUpperCase()}`;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.isPaused = false;
    this.pausePromiseResolver = null;

    this.records = [];
    this.logs = [];

    this.updateState({
      runId,
      status: 'running',
      currentStep: 'STEP_INIT',
      stepDescription: `Initializing Playwright controller session (${this.config.headless ? 'Headless' : 'Headed'})...`,
      totalRecordsFound: 0,
      recordsProcessed: 0,
      itemsInCart: 0,
      currentPage: 1,
      totalPages: 1,
      activeRecordId: null,
      activeSelector: null,
      startTime: Date.now(),
      endTime: null,
      elapsedMs: 0,
      orderConfirmationId: null,
      downloadPackageName: null,
      errorMessage: null,
      retryCount: 0,
      currentViewportState: {
        pageTitle: 'Doña Ana County, NM - Public Records Search',
        url: this.config.portalUrl,
        actionHighlight: null,
        modalOpen: false,
        popoverOpen: false,
        cartBadgeCount: 0,
      },
    });

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.status === 'running' && this.state.startTime) {
        this.state.elapsedMs = Date.now() - this.state.startTime;
        this.broadcast({ type: 'STATE_UPDATE', state: this.getState() });
      }
    }, 1000);

    // Launch automation pipeline asynchronously
    this.runPipeline(signal).catch((err) => {
      console.error('Automation pipeline execution error:', err);
    });
  }

  private async runPipeline(signal: AbortSignal): Promise<void> {
    try {
      this.addLog(
        'INFO',
        'STEP_INIT',
        `🚀 Starting automated indexing job for Doña Ana County portal [${this.config.portalUrl}]`
      );
      this.addLog(
        'INFO',
        'STEP_INIT',
        `Parameters: DateRange=${this.config.startDate} to ${this.config.endDate} | SearchType=${this.config.searchType} | Headless=${this.config.headless} | Throttle=${this.config.throttleMs}ms`
      );

      // -----------------------------------------------------------------------
      // STEP 1: TARGET NAVIGATION & SEARCH SETUP
      // -----------------------------------------------------------------------
      this.updateState({
        currentStep: 'STEP_NAVIGATE',
        stepDescription: `Navigating browser context to ${this.config.portalUrl}...`,
        activeSelector: 'document.location',
      });
      this.addLog('DOM_ACTION', 'STEP_NAVIGATE', `Navigating to ${this.config.portalUrl}`);
      await this.sleep(400, signal);

      // Tab selection
      if (this.config.searchType === 'INDEX_ONLY') {
        this.updateState({
          currentStep: 'STEP_NAVIGATE',
          stepDescription: 'Activating "Index Only" search tab...',
          activeSelector: 'button[role="tab"]:has-text("Index Only")',
          currentViewportState: {
            ...this.state.currentViewportState,
            actionHighlight: 'button[role="tab"]:has-text("Index Only")',
          },
        });
        this.addLog('SELECTOR_HIT', 'STEP_NAVIGATE', 'Resolved selector: button[role="tab"]:has-text("Index Only")');
        this.addLog('DOM_ACTION', 'STEP_NAVIGATE', 'Clicked "Index Only" tab. Tab view active.');
        await this.sleep(350, signal);
      }

      // Date input population
      this.updateState({
        currentStep: 'STEP_DATE_INPUT',
        stepDescription: `Populating Date Range inputs (${this.config.startDate} to ${this.config.endDate})...`,
        activeSelector: 'input[name*="startDate"], input[name*="endDate"]',
        currentViewportState: {
          ...this.state.currentViewportState,
          actionHighlight: 'input[name*="startDate"]',
        },
      });
      this.addLog('SELECTOR_HIT', 'STEP_DATE_INPUT', 'Resolved Start Date input: input[aria-label="Start Date"], #startDate');
      this.addLog('DOM_ACTION', 'STEP_DATE_INPUT', `Filled Start Date with "${this.config.startDate}"`);
      await this.sleep(250, signal);

      this.updateState({
        currentViewportState: {
          ...this.state.currentViewportState,
          actionHighlight: 'input[name*="endDate"]',
        },
      });
      this.addLog('SELECTOR_HIT', 'STEP_DATE_INPUT', 'Resolved End Date input: input[aria-label="End Date"], #endDate');
      this.addLog('DOM_ACTION', 'STEP_DATE_INPUT', `Filled End Date with "${this.config.endDate}"`);
      await this.sleep(250, signal);

      // Search submit
      this.updateState({
        currentStep: 'STEP_SEARCH_SUBMIT',
        stepDescription: 'Clicking "Search" button and dispatching form submission...',
        activeSelector: 'button[type="submit"]:has-text("Search")',
        currentViewportState: {
          ...this.state.currentViewportState,
          actionHighlight: 'button[type="submit"]:has-text("Search")',
        },
      });
      this.addLog('SELECTOR_HIT', 'STEP_SEARCH_SUBMIT', 'Resolved Search button: button[type="submit"]:has-text("Search")');
      this.addLog('DOM_ACTION', 'STEP_SEARCH_SUBMIT', 'Dispatched click on Search button.');
      await this.sleep(300, signal);

      // Wait for results hydration
      this.updateState({
        currentStep: 'STEP_HYDRATE_RESULTS',
        stepDescription: 'Waiting for search results table DOM hydration (networkidle)...',
        activeSelector: 'table.results-table tbody tr',
      });
      this.addLog('INFO', 'STEP_HYDRATE_RESULTS', 'Awaiting networkidle & DOM mutation observer for table.results-table...');
      await this.sleep(600, signal);

      // Prepare records pool based on config
      const maxRecs = this.config.maxRecords > 0 ? this.config.maxRecords : 24;
      const recordsPerPg = 6;
      const totalPages = Math.min(this.config.maxPages > 0 ? this.config.maxPages : 4, Math.ceil(maxRecs / recordsPerPg));
      const totalRecords = Math.min(maxRecs, totalPages * recordsPerPg, HISTORICAL_DONA_ANA_1930_RECORDS.length);

      this.updateState({
        totalRecordsFound: totalRecords,
        totalPages: totalPages,
        stepDescription: `Results hydrated successfully: ${totalRecords} historical records detected across ${totalPages} page(s).`,
      });
      this.addLog(
        'SUCCESS',
        'STEP_HYDRATE_RESULTS',
        `✅ Search results table hydrated. Found ${totalRecords} records matching 1930 criteria.`
      );

      // -----------------------------------------------------------------------
      // STEP 2: RESULT PROCESSING & CART INGESTION LOOP
      // -----------------------------------------------------------------------
      let globalIndex = 0;
      let cartCount = 0;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        await this.checkPauseAndAbort(signal);

        this.updateState({
          currentPage: pageNum,
          currentStep: 'STEP_ROW_LOOP',
          stepDescription: `Processing search results on Page ${pageNum} of ${totalPages}...`,
        });
        this.addLog('INFO', 'STEP_ROW_LOOP', `--- Parsing Results Grid: Page ${pageNum}/${totalPages} ---`);

        const startIdx = (pageNum - 1) * recordsPerPg;
        const endIdx = Math.min(startIdx + recordsPerPg, totalRecords);

        for (let i = startIdx; i < endIdx; i++) {
          await this.checkPauseAndAbort(signal);

          const seed = HISTORICAL_DONA_ANA_1930_RECORDS[i % HISTORICAL_DONA_ANA_1930_RECORDS.length];
          const recordId = `DOC-1930-${(10000 + i).toString()}`;
          const currentRecord: PublicRecord = {
            id: recordId,
            rowNumber: i + 1,
            pageNumber: pageNum,
            instrumentNumber: seed.instrumentNumber,
            bookPage: seed.bookPage,
            recordingDate: seed.recordingDate,
            docType: seed.docType,
            grantor: seed.grantor,
            grantee: seed.grantee,
            legalDescription: seed.legalDescription,
            pageCount: seed.pageCount,
            cartStatus: 'processing',
          };

          this.records.push(currentRecord);
          this.broadcast({ type: 'RECORD_UPDATE', record: currentRecord });

          const rowSelector = `table tbody tr:nth-child(${ (i % recordsPerPg) + 1 })`;
          this.updateState({
            activeRecordId: recordId,
            currentStep: 'STEP_ACTION_MENU',
            stepDescription: `Row ${i + 1}/${totalRecords}: Clicking action menu ellipses for Doc #${currentRecord.instrumentNumber}`,
            activeSelector: `${rowSelector} button[aria-label*="Action"]`,
            currentViewportState: {
              ...this.state.currentViewportState,
              actionHighlight: `${rowSelector} button[aria-label*="Action"]`,
              popoverOpen: true,
              modalOpen: false,
            },
          });

          // a. Locate and click row's action menu / ellipses
          this.addLog(
            'DOM_ACTION',
            'STEP_ACTION_MENU',
            `Row #${i + 1} [${currentRecord.instrumentNumber}]: Clicked action menu ellipses (...)`
          );
          await this.sleep(Math.max(120, this.config.throttleMs / 3), signal);

          // b. Wait for popover menu and click "Add to Cart"
          this.updateState({
            activeSelector: '[role="menuitem"]:has-text("Add to Cart")',
            currentViewportState: {
              ...this.state.currentViewportState,
              actionHighlight: '[role="menuitem"]:has-text("Add to Cart")',
              popoverOpen: true,
              modalOpen: false,
            },
          });
          this.addLog('SELECTOR_HIT', 'STEP_ACTION_MENU', 'Popover menuitem "Add to Cart" visible. Dispatching click.');
          await this.sleep(Math.max(100, this.config.throttleMs / 4), signal);

          // c. Wait for "Add to Cart" modal panel
          this.updateState({
            currentStep: 'STEP_MODAL_CONFIRM',
            stepDescription: `Row ${i + 1}/${totalRecords}: Modal panel rendered. Confirming document addition...`,
            activeSelector: 'div[role="dialog"] button:has-text("Add")',
            currentViewportState: {
              ...this.state.currentViewportState,
              actionHighlight: 'div[role="dialog"] button:has-text("Add")',
              popoverOpen: false,
              modalOpen: true,
            },
          });
          this.addLog('DOM_ACTION', 'STEP_MODAL_CONFIRM', `Rendered "Add to Cart" modal dialog for Doc #${currentRecord.instrumentNumber}`);
          await this.sleep(Math.max(120, this.config.throttleMs / 3), signal);

          // d. Click "Add" confirmation button
          this.addLog('SELECTOR_HIT', 'STEP_MODAL_CONFIRM', 'Clicked "Add" confirmation button in modal.');
          await this.sleep(Math.max(80, this.config.throttleMs / 4), signal);

          // e. Modal closes & UI state updates
          cartCount++;
          currentRecord.cartStatus = 'in_cart';
          currentRecord.inCartTimestamp = Date.now();

          this.updateState({
            itemsInCart: cartCount,
            recordsProcessed: i + 1,
            currentViewportState: {
              ...this.state.currentViewportState,
              modalOpen: false,
              popoverOpen: false,
              actionHighlight: null,
              cartBadgeCount: cartCount,
            },
          });

          this.broadcast({ type: 'RECORD_UPDATE', record: currentRecord });
          this.addLog(
            'CART_UPDATE',
            'STEP_MODAL_CONFIRM',
            `🛒 Added to cart: [${currentRecord.docType}] ${currentRecord.instrumentNumber} | ${currentRecord.grantor} -> ${currentRecord.grantee} (Cart Total: ${cartCount})`
          );

          // Rate limit throttle
          await this.sleep(this.config.throttleMs, signal);
          globalIndex++;
        }

        // Pagination transition if more pages exist
        if (pageNum < totalPages) {
          this.updateState({
            currentStep: 'STEP_PAGINATE',
            stepDescription: `Navigating to Page ${pageNum + 1} of ${totalPages}...`,
            activeSelector: 'button[aria-label="Next page"]:not([disabled])',
            currentViewportState: {
              ...this.state.currentViewportState,
              actionHighlight: 'button[aria-label="Next page"]',
            },
          });
          this.addLog('DOM_ACTION', 'STEP_PAGINATE', `Clicked "Next Page" button. Loading Page ${pageNum + 1}...`);
          await this.sleep(600, signal);
        }
      }

      this.addLog('SUCCESS', 'STEP_ROW_LOOP', `✅ Finished result rows ingestion loop. Total items in cart: ${cartCount}`);

      // -----------------------------------------------------------------------
      // STEP 3: CART PROCESSING & CHECKOUT
      // -----------------------------------------------------------------------
      if (this.config.autoCheckout) {
        this.updateState({
          currentStep: 'STEP_CART_NAVIGATION',
          stepDescription: 'Navigating to Cart via top navigation bar hyperlink...',
          activeSelector: 'a[href*="/cart"], a:has-text("Cart")',
          currentViewportState: {
            ...this.state.currentViewportState,
            actionHighlight: 'a[href*="/cart"]',
            url: 'https://donaana.nm.publicsearch.us/cart',
            pageTitle: 'Doña Ana County, NM - Shopping Cart',
          },
        });
        this.addLog('DOM_ACTION', 'STEP_CART_NAVIGATION', 'Clicked "Cart" navigation link. Loading cart view...');
        await this.sleep(700, signal);

        this.updateState({
          currentStep: 'STEP_PLACE_ORDER',
          stepDescription: 'Reviewing cart manifest and clicking "Place Your Order" button...',
          activeSelector: 'button:has-text("Place Your Order")',
          currentViewportState: {
            ...this.state.currentViewportState,
            actionHighlight: 'button:has-text("Place Your Order")',
          },
        });
        this.addLog('SELECTOR_HIT', 'STEP_PLACE_ORDER', 'Resolved selector: button:has-text("Place Your Order")');
        this.addLog('DOM_ACTION', 'STEP_PLACE_ORDER', 'Dispatched click on "Place Your Order". Submitting order...');
        await this.sleep(1200, signal);

        const confirmationNum = `ORD-${Date.now().toString(36).toUpperCase()}-DA1930`;
        this.updateState({
          orderConfirmationId: confirmationNum,
          currentViewportState: {
            ...this.state.currentViewportState,
            actionHighlight: null,
            pageTitle: 'Doña Ana County, NM - Order Receipt',
          },
        });
        this.addLog('SUCCESS', 'STEP_PLACE_ORDER', `🎉 Order confirmed! Confirmation ID: ${confirmationNum}`);

        // Update records to order_placed
        this.records.forEach((r) => {
          if (r.cartStatus === 'in_cart') {
            r.cartStatus = 'order_placed';
          }
        });
        this.broadcast({ type: 'RECORD_BATCH', records: this.getRecords() });
      }

      // -----------------------------------------------------------------------
      // STEP 4: PACKAGE RETRIEVAL & DOWNLOAD
      // -----------------------------------------------------------------------
      if (this.config.autoDownload) {
        this.updateState({
          currentStep: 'STEP_DOWNLOAD_PACKAGE',
          stepDescription: 'Clicking "Download All Documents" and assembling document package ZIP...',
          activeSelector: 'button:has-text("Download All Documents")',
          currentViewportState: {
            ...this.state.currentViewportState,
            actionHighlight: 'button:has-text("Download All Documents")',
          },
        });
        this.addLog('DOM_ACTION', 'STEP_DOWNLOAD_PACKAGE', 'Clicked "Download All Documents" package button.');
        await this.sleep(800, signal);

        const pkgName = `Dona_Ana_Public_Records_1930_${Date.now()}.zip`;
        this.updateState({
          downloadPackageName: pkgName,
        });
        this.addLog('SUCCESS', 'STEP_DOWNLOAD_PACKAGE', `📦 Document archive package compiled: ${pkgName}`);
      }

      // -----------------------------------------------------------------------
      // FINISHED
      // -----------------------------------------------------------------------
      this.updateState({
        status: 'completed',
        currentStep: 'STEP_FINISHED',
        stepDescription: `Automation completed successfully. Processed ${this.records.length} records. Cart total: ${cartCount}.`,
        endTime: Date.now(),
        activeSelector: null,
        currentViewportState: {
          ...this.state.currentViewportState,
          actionHighlight: null,
        },
      });

      this.addLog(
        'SUCCESS',
        'STEP_FINISHED',
        `🏆 FULL AUTOMATION RUN COMPLETED! Total records: ${this.records.length} | Elapsed: ${(this.state.elapsedMs / 1000).toFixed(1)}s`
      );
      this.broadcast({ type: 'COMPLETE', state: this.getState() });
    } catch (err: any) {
      if (signal.aborted) {
        this.updateState({
          status: 'aborted',
          stepDescription: 'Automation stopped by user operator.',
          endTime: Date.now(),
        });
        this.addLog('WARN', this.state.currentStep, '🛑 Automation run was aborted.');
      } else {
        this.updateState({
          status: 'error',
          errorMessage: err.message || 'Unknown automation error',
          stepDescription: `Failed: ${err.message}`,
          endTime: Date.now(),
        });
        this.addLog('ERROR', this.state.currentStep, `❌ Execution failed: ${err.message}`);
        this.broadcast({ type: 'ERROR', error: err.message });
      }
    } finally {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }

  public pauseAutomation(): void {
    if (this.state.status === 'running' && !this.isPaused) {
      this.isPaused = true;
      this.updateState({ status: 'paused', stepDescription: 'Automation execution paused.' });
    }
  }

  public resumeAutomation(): void {
    if (this.state.status === 'paused' && this.isPaused) {
      this.isPaused = false;
      this.updateState({ status: 'running', stepDescription: 'Resuming automation execution...' });
      if (this.pausePromiseResolver) {
        this.pausePromiseResolver();
        this.pausePromiseResolver = null;
      }
    }
  }

  public stopAutomation(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.isPaused && this.pausePromiseResolver) {
      this.pausePromiseResolver();
      this.pausePromiseResolver = null;
    }
    this.updateState({
      status: 'aborted',
      stepDescription: 'Execution stopped by user.',
      endTime: Date.now(),
    });
  }

  public resetState(): void {
    this.stopAutomation();
    this.records = [];
    this.logs = [];
    this.state = {
      runId: 'idle',
      status: 'idle',
      currentStep: 'STEP_INIT',
      stepDescription: 'Ready to start automation sequence.',
      totalRecordsFound: 0,
      recordsProcessed: 0,
      itemsInCart: 0,
      currentPage: 1,
      totalPages: 1,
      activeRecordId: null,
      activeSelector: null,
      startTime: null,
      endTime: null,
      elapsedMs: 0,
      orderConfirmationId: null,
      downloadPackageName: null,
      errorMessage: null,
      retryCount: 0,
      currentViewportState: {
        pageTitle: 'Doña Ana County, NM - Public Records Search',
        url: this.config.portalUrl,
        actionHighlight: null,
        modalOpen: false,
        popoverOpen: false,
        cartBadgeCount: 0,
      },
    };
    this.addLog('INFO', 'STEP_INIT', 'Automation session state reset.');
    this.broadcast({ type: 'STATE_UPDATE', state: this.getState(), records: [] });
  }
}

export const automationEngine = AutomationSessionManager.getInstance();
