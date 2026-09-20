import React, { useState, useEffect } from 'react';
import { 
  Voucher, 
  VoucherPackage, 
  HotspotInfo 
} from './types';
import { 
  DEFAULT_PACKAGES, 
  INITIAL_HOTSPOT, 
  getInitialVouchers 
} from './data/initialData';
import { exportVouchersToCSV } from './utils/voucherUtils';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { VoucherListSection } from './components/VoucherListSection';
import { VoucherGeneratorModal } from './components/VoucherGeneratorModal';
import { VoucherSlipModal } from './components/VoucherSlipModal';
import { ExtendVoucherModal } from './components/ExtendVoucherModal';
import { CaptivePortalPreviewModal } from './components/CaptivePortalPreviewModal';
import { Smartphone, Check, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'hotspotpay_vouchers_v1';

export default function App() {
  const [now, setNow] = useState<number>(Date.now());
  const [packages] = useState<VoucherPackage[]>(DEFAULT_PACKAGES);
  const [hotspot, setHotspot] = useState<HotspotInfo>(INITIAL_HOTSPOT);
  
  // Vouchers state loaded from localStorage or initialized
  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return getInitialVouchers();
  });

  // Filter state
  const [filter, setFilter] = useState<'all' | 'active' | 'unused' | 'expiring' | 'expired'>('all');

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [slipVoucher, setSlipVoucher] = useState<Voucher | null>(null);
  const [customExtendVoucher, setCustomExtendVoucher] = useState<Voucher | null>(null);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
    } catch {
      // ignore
    }
  }, [vouchers]);

  // Live real-time ticker updating every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleGenerateBatch = (newVouchers: Voucher[]) => {
    setVouchers((prev) => [...newVouchers, ...prev]);
    showToast(`Successfully generated ${newVouchers.length} voucher${newVouchers.length > 1 ? 's' : ''}`);
  };

  const handleExtendTime = (voucherId: string, extraMinutes: number) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id === voucherId) {
          const currentExpiry = v.expiresAt && v.expiresAt > Date.now() ? v.expiresAt : Date.now();
          const newExpiresAt = currentExpiry + extraMinutes * 60 * 1000;
          return {
            ...v,
            expiresAt: newExpiresAt,
            durationMinutes: v.durationMinutes + extraMinutes,
            status: 'active',
          };
        }
        return v;
      })
    );
    showToast(`Added +${extraMinutes} minutes to session`);
  };

  const handleRevoke = (voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id === voucherId) {
          return {
            ...v,
            status: 'revoked',
            expiresAt: Date.now(),
          };
        }
        return v;
      })
    );
    showToast('Session disconnected and voucher revoked');
  };

  const handleDelete = (voucherId: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== voucherId));
    showToast('Voucher record removed');
  };

  const handleSimulateRedeem = (voucherId: string) => {
    const randomIp = `192.168.43.${Math.floor(20 + Math.random() * 80)}`;
    const randomDevices = ['iPhone 15', 'Pixel 8 Pro', 'MacBook Air', 'iPad Pro', 'Samsung Galaxy S24', 'Dell XPS'];
    const randomDevice = randomDevices[Math.floor(Math.random() * randomDevices.length)];

    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id === voucherId) {
          const currentTime = Date.now();
          return {
            ...v,
            status: 'active',
            activatedAt: currentTime,
            expiresAt: currentTime + v.durationMinutes * 60 * 1000,
            clientIp: randomIp,
            clientDeviceName: randomDevice,
            dataUsedMb: Math.floor(Math.random() * 50) + 10,
            dataLimitMb: v.durationMinutes * 25,
          };
        }
        return v;
      })
    );
    showToast(`Client connected (${randomDevice} on ${randomIp})`);
  };

  const handleRedeemFromPortalModal = (code: string) => {
    const target = vouchers.find((v) => v.code === code);
    if (!target) {
      return { success: false, message: 'Invalid voucher code.' };
    }
    if (target.status === 'revoked') {
      return { success: false, message: 'This code was revoked by the operator.' };
    }
    if (target.status === 'expired') {
      return { success: false, message: 'This code has expired.' };
    }
    if (target.status === 'active') {
      return { success: true, message: 'Code is already active and online.' };
    }

    // Activate the voucher
    handleSimulateRedeem(target.id);
    return { 
      success: true, 
      message: `Access granted for ${target.durationMinutes} minutes!` 
    };
  };

  const handleClearExpired = () => {
    setVouchers((prev) =>
      prev.filter((v) => {
        const isLive = v.expiresAt && v.expiresAt > now;
        return v.status === 'unused' || isLive;
      })
    );
    showToast('Cleared expired records');
  };

  const handleExportCSV = () => {
    exportVouchersToCSV(vouchers, now);
    showToast('Vouchers CSV downloaded');
  };

  const handleToggleHotspot = () => {
    setHotspot((prev) => ({
      ...prev,
      isBroadcasting: !prev.isBroadcasting,
    }));
    showToast(hotspot.isBroadcasting ? 'Hotspot paused' : 'Hotspot broadcasting started');
  };

  const handleRefresh = () => {
    setNow(Date.now());
    showToast('Dashboard synchronized');
  };

  return (
    <div className="min-h-screen bg-stone-50/50 text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-stone-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <Header
        hotspot={hotspot}
        onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
        onExportCSV={handleExportCSV}
        onRefresh={handleRefresh}
        isBroadcasting={hotspot.isBroadcasting}
        onToggleBroadcasting={handleToggleHotspot}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Quick Simulator Bar for testing captive portal client redemption */}
        <div className="bg-stone-900 text-white rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold">Test Client Captive Portal</h3>
              <p className="text-[11px] text-stone-400">
                Experience the customer login prompt and test redeeming any voucher code instantly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPortalModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            <span>Open Portal Simulator</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        <StatsCards
          vouchers={vouchers}
          now={now}
          activeFilter={filter}
          onFilterSelect={(f) => setFilter(f)}
        />

        {/* WiFi Vouchers Section (Requested Section) */}
        <VoucherListSection
          vouchers={vouchers}
          now={now}
          filter={filter}
          onFilterChange={setFilter}
          onOpenGenerateModal={() => setIsGenerateModalOpen(true)}
          onExtend={handleExtendTime}
          onOpenCustomExtend={(v) => setCustomExtendVoucher(v)}
          onRevoke={handleRevoke}
          onDelete={handleDelete}
          onSimulateRedeem={handleSimulateRedeem}
          onPrint={(v) => setSlipVoucher(v)}
          onClearExpired={handleClearExpired}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
          <p>© {new Date().getFullYear()} HotspotPay — Autonomous Paid WiFi Hotspot &amp; Captive Portal.</p>
          <div className="flex items-center gap-4">
            <span>Local Gateway: 192.168.43.1:8080</span>
            <span>•</span>
            <span>NanoHTTPD Captive Server</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VoucherGeneratorModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        packages={packages}
        onGenerateBatch={handleGenerateBatch}
      />

      <VoucherSlipModal
        voucher={slipVoucher}
        hotspot={hotspot}
        onClose={() => setSlipVoucher(null)}
      />

      <ExtendVoucherModal
        voucher={customExtendVoucher}
        now={now}
        onClose={() => setCustomExtendVoucher(null)}
        onConfirmExtend={handleExtendTime}
      />

      <CaptivePortalPreviewModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        vouchers={vouchers}
        onRedeemCode={handleRedeemFromPortalModal}
      />

    </div>
  );
}
