import React, { useState } from 'react';
import { X, Wifi, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { Voucher } from '../types';

interface CaptivePortalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vouchers: Voucher[];
  onRedeemCode: (code: string) => { success: boolean; message: string };
}

export const CaptivePortalPreviewModal: React.FC<CaptivePortalPreviewModalProps> = ({
  isOpen,
  onClose,
  vouchers,
  onRedeemCode,
}) => {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const unusedVouchers = vouchers.filter(v => v.status === 'unused');

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const result = onRedeemCode(code.trim().replace(/\s+/g, ''));
    setFeedback(result);
    if (result.success) {
      setTimeout(() => {
        onClose();
        setFeedback(null);
        setCode('');
      }, 1500);
    }
  };

  const handleSelectQuickCode = (c: string) => {
    setCode(c);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Mock Phone Bezel Top */}
        <div className="bg-stone-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-medium">Captive Portal Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-stone-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portal Screen Body */}
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-2 border border-emerald-200">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-lg">HotspotPay Portal</h3>
            <p className="text-xs text-stone-500">http://192.168.43.1:8080/login</p>
          </div>

          {feedback ? (
            <div className={`p-4 rounded-xl text-center mb-4 ${
              feedback.success 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {feedback.success ? (
                <div className="space-y-1">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                  <p className="font-bold text-sm">Internet Connected!</p>
                  <p className="text-xs">{feedback.message}</p>
                </div>
              ) : (
                <p className="text-xs font-medium">{feedback.message}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Enter Voucher Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 849201"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={10}
                  className="w-full px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest border border-stone-300 rounded-xl bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Redeem &amp; Connect to WiFi</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {unusedVouchers.length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <span className="text-[11px] text-stone-400 block mb-1.5">Or test with ready code:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {unusedVouchers.slice(0, 3).map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectQuickCode(v.code)}
                        className="font-mono text-xs px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 transition-colors"
                      >
                        {v.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          <div className="text-[11px] text-stone-400 text-center mt-5 pt-3 border-t border-stone-100">
            Simulates client connecting from 192.168.43.x to activate the voucher in real time.
          </div>
        </div>

      </div>
    </div>
  );
};
