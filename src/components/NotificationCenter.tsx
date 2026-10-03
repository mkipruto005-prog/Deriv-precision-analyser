import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Laptop, 
  Sparkles, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  notificationService, 
  NotificationPermissionState, 
  NotificationSettings 
} from '../services/notificationService';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [testSent, setTestSent] = useState<boolean>(false);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  useEffect(() => {
    setPermission(notificationService.getPermission());
    setSettings(notificationService.getSettings());

    const unsubscribe = notificationService.subscribe(() => {
      setPermission(notificationService.getPermission());
      setSettings(notificationService.getSettings());
    });

    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async (): Promise<NotificationPermissionState> => {
    setIsRequesting(true);
    const result = await notificationService.requestPermission();
    setPermission(result);
    setIsRequesting(false);
    return result;
  };

  const handleToggleEnabled = () => {
    if (permission !== 'granted') {
      handleRequestPermission();
      return;
    }
    notificationService.updateSettings({ enabled: !settings.enabled });
  };

  const handleToggleSound = () => {
    notificationService.updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleToggleFlash = () => {
    notificationService.updateSettings({ tabFlashingEnabled: !settings.tabFlashingEnabled });
  };

  const handleThresholdChange = (val: number) => {
    notificationService.updateSettings({ minConfidence: val });
  };

  const handleSendTest = () => {
    if (permission !== 'granted') {
      handleRequestPermission().then((perm) => {
        if (perm === 'granted') {
          notificationService.sendTestAlert();
          setTestSent(true);
          setTimeout(() => setTestSent(false), 3000);
        }
      });
      return;
    }

    notificationService.sendTestAlert();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        id="notification-center-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 relative"
      >
        {/* Close Button */}
        <button
          id="close-notification-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Notifications Panel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Background Signal Alerts
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                95%+ ULTRA
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Receive desktop alerts even when viewing other tabs or apps
            </p>
          </div>
        </div>

        {/* Permission Status Banner */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
          permission === 'granted'
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
            : permission === 'denied'
              ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
        }`}>
          {permission === 'granted' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : permission === 'denied' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 space-y-1">
            <div className="font-semibold text-white">
              {permission === 'granted' && 'Browser Notifications Active'}
              {permission === 'denied' && 'Browser Notifications Blocked'}
              {permission === 'default' && 'Permission Required'}
              {permission === 'unsupported' && 'Notifications Unsupported'}
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {permission === 'granted' && 'Your browser is configured to display instant pop-up notifications when high-confidence signals trigger.'}
              {permission === 'denied' && 'Notifications are blocked in your browser site settings. Click the lock/settings icon beside the URL to allow notifications.'}
              {permission === 'default' && 'Enable browser permission so alerts pop up over other windows whenever a 95%+ signal is detected.'}
              {permission === 'unsupported' && 'Your current browser environment does not support the Web Notification API.'}
            </p>

            {permission === 'default' && (
              <button
                id="grant-notification-perm-btn"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="mt-2 w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>{isRequesting ? 'Requesting...' : 'Allow Browser Notifications'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Settings Toggles */}
        <div className="space-y-2.5 pt-1">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                Desktop Background Alerts
              </div>
              <p className="text-[11px] text-slate-400">
                Trigger system notifications when tab is hidden or backgrounded
              </p>
            </div>
            <button
              id="toggle-notifications-master-btn"
              onClick={handleToggleEnabled}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.enabled && permission === 'granted' ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.enabled && permission === 'granted' ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Tab Title Flashing */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                Tab Title Flashing
              </div>
              <p className="text-[11px] text-slate-400">
                Flashes &quot;🚨 SIGNAL DETECTED&quot; in the browser tab bar while away
              </p>
            </div>
            <button
              id="toggle-tab-flashing-btn"
              onClick={handleToggleFlash}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.tabFlashingEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.tabFlashingEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Sound Alert on Notification */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
                Acoustic Chime
              </div>
              <p className="text-[11px] text-slate-400">
                Play crisp harmonic frequency when 95%+ signal is detected
              </p>
            </div>
            <button
              id="toggle-notify-sound-btn"
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Minimum Confidence Filter */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Minimum Accuracy Trigger
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {settings.minConfidence.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[95.0, 96.0, 97.0].map((conf) => (
                <button
                  key={conf}
                  onClick={() => handleThresholdChange(conf)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-all ${
                    settings.minConfidence === conf
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ≥ {conf.toFixed(1)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            id="test-notification-btn"
            onClick={handleSendTest}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              testSent
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            <BellRing className="w-4 h-4 text-emerald-400" />
            <span>{testSent ? '✓ Test Alert Sent!' : 'Send Test Alert Now'}</span>
          </button>

          <button
            id="done-notification-btn"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
