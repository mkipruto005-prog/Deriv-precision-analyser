import { PrecisionSignal } from '../types';
import { soundEngine } from './audioAlert';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationSettings {
  enabled: boolean;
  minConfidence: number; // default 95.0
  soundEnabled: boolean;
  tabFlashingEnabled: boolean;
}

class BrowserNotificationService {
  private lastNotificationTimes: Map<string, number> = new Map();
  private originalDocumentTitle: string = 'Deriv Precision Analyzer';
  private flashInterval: number | null = null;
  private settings: NotificationSettings = {
    enabled: true,
    minConfidence: 95.0,
    soundEnabled: true,
    tabFlashingEnabled: true
  };
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadSettings();
    this.initVisibilityListener();
    if (typeof document !== 'undefined') {
      this.originalDocumentTitle = document.title || 'Deriv Precision Analyzer';
    }
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const savedEnabled = localStorage.getItem('deriv_notify_enabled');
      const savedMinConf = localStorage.getItem('deriv_notify_min_conf');
      const savedSound = localStorage.getItem('deriv_notify_sound');
      const savedFlash = localStorage.getItem('deriv_notify_flash');

      if (savedEnabled !== null) {
        this.settings.enabled = savedEnabled === 'true';
      }
      if (savedMinConf !== null) {
        this.settings.minConfidence = parseFloat(savedMinConf) || 95.0;
      }
      if (savedSound !== null) {
        this.settings.soundEnabled = savedSound !== 'false';
      }
      if (savedFlash !== null) {
        this.settings.tabFlashingEnabled = savedFlash !== 'false';
      }
    } catch {
      // Storage access disabled or private mode
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('deriv_notify_enabled', String(this.settings.enabled));
      localStorage.setItem('deriv_notify_min_conf', String(this.settings.minConfidence));
      localStorage.setItem('deriv_notify_sound', String(this.settings.soundEnabled));
      localStorage.setItem('deriv_notify_flash', String(this.settings.tabFlashingEnabled));
    } catch {
      // Storage access disabled
    }
    this.notifyListeners();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Notification listener error:', e);
      }
    });
  }

  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  public getPermission(): NotificationPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionState;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        this.updateSettings({ enabled: true });
      }
      this.notifyListeners();
      return res as NotificationPermissionState;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return this.getPermission();
    }
  }

  private initVisibilityListener() {
    if (typeof document === 'undefined') return;

    const handleVisibility = () => {
      if (!document.hidden) {
        this.stopTabFlashing();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
  }

  /**
   * Flashes the document title to attract user attention when tab is backgrounded
   */
  public startTabFlashing(message: string) {
    if (!this.settings.tabFlashingEnabled || typeof document === 'undefined') return;
    this.stopTabFlashing();

    let toggle = false;
    this.flashInterval = window.setInterval(() => {
      if (!document.hidden) {
        this.stopTabFlashing();
        return;
      }
      document.title = toggle ? message : '🚨 SIGNAL DETECTED 🚨';
      toggle = !toggle;
    }, 1000);
  }

  public stopTabFlashing() {
    if (this.flashInterval) {
      clearInterval(this.flashInterval);
      this.flashInterval = null;
    }
    if (typeof document !== 'undefined') {
      document.title = this.originalDocumentTitle || 'Deriv Precision Analyzer';
    }
  }

  /**
   * Dispatches a browser alert when an Ultra Accuracy (95%+) signal occurs.
   * Runs even if the user is not actively viewing the tab.
   */
  public notifySignal(signal: PrecisionSignal, options?: { force?: boolean }): boolean {
    if (!this.settings.enabled && !options?.force) return false;

    // Filter by confidence threshold (95%+ requirement)
    if (!options?.force && signal.confidence < this.settings.minConfidence) {
      return false;
    }

    // De-duplication cooldown: 20 seconds per symbol to prevent notification spam
    const now = Date.now();
    const cooldownKey = `${signal.symbol}_${signal.contractType}_${signal.predictedDigit ?? 'none'}`;
    const lastNotified = this.lastNotificationTimes.get(cooldownKey) || 0;

    if (!options?.force && now - lastNotified < 20000) {
      return false;
    }
    this.lastNotificationTimes.set(cooldownKey, now);

    const isBackground = typeof document !== 'undefined' && (document.hidden || !document.hasFocus());

    // Play audible chime for background alert if enabled
    if (this.settings.soundEnabled) {
      soundEngine.playSignalAlert();
    }

    // Trigger tab title flashing if tab is backgrounded
    if (isBackground && this.settings.tabFlashingEnabled) {
      const shortTitle = `🎯 [${signal.confidence.toFixed(1)}%] ${signal.symbol} - ${signal.direction}`;
      this.startTabFlashing(shortTitle);
    }

    // Show native OS browser notification if supported and permission granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const title = `🎯 95%+ Signal: ${signal.symbol} (${signal.confidence.toFixed(1)}%)`;
        const body = `${signal.direction} ${signal.contractType}${
          signal.predictedDigit !== undefined ? ` [Target: ${signal.predictedDigit}]` : ''
        }\n${signal.reason}`;

        const notification = new Notification(title, {
          body,
          tag: `deriv-ultra-${signal.symbol}`,
          requireInteraction: false,
          silent: false
        });

        notification.onclick = () => {
          if (typeof window !== 'undefined') {
            window.focus();
          }
          this.stopTabFlashing();
          notification.close();
        };

        // Auto close after 12 seconds to keep desktop tidy
        setTimeout(() => {
          try {
            notification.close();
          } catch {}
        }, 12000);

        return true;
      } catch (err) {
        console.warn('Native notification dispatch error:', err);
      }
    }

    return false;
  }

  /**
   * Test dispatch to allow users to verify background notifications immediately
   */
  public sendTestAlert(): boolean {
    const testSignal: PrecisionSignal = {
      id: `TEST_SIG_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      symbol: '1HZ100V',
      contractType: 'DIGITUNDER',
      direction: 'UNDER',
      predictedDigit: 8,
      barrier: 8,
      confidence: 96.8,
      confluenceScore: 98,
      isUltraAccuracy: true,
      entryQuote: 1248.56,
      durationTicks: 1,
      targetDurationSeconds: 2,
      confluenceFactors: [
        {
          id: 'test_1',
          label: 'Test Confluence Filter',
          description: 'Verified background delivery verification',
          weight: 100,
          status: 'MET',
          valueText: '96.8% Ultra Pass'
        }
      ],
      reason: 'Browser background notification system operational. Will alert even when viewing other tabs.',
      status: 'PENDING'
    };

    return this.notifySignal(testSignal, { force: true });
  }
}

export const notificationService = new BrowserNotificationService();
