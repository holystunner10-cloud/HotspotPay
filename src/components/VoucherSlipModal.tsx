import React from 'react';
import { X, Printer, Wifi, Shield, Clock, QrCode } from 'lucide-react';
import { Voucher, HotspotInfo } from '../types';
import { formatCode } from '../utils/voucherUtils';

interface VoucherSlipModalProps {
  voucher: Voucher | null;
  hotspot: HotspotInfo;
  onClose: () => void;
}

export const VoucherSlipModal: React.FC<VoucherSlipModalProps> = ({
  voucher,
  hotspot,
  onClose,
}) => {
  if (!voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div 
        id="modal-voucher-slip"
        className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:m-0 print:border-none print:shadow-none"
      >
        {/* Modal bar */}
        <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between print:hidden">
          <span className="text-xs font-semibold uppercase text-stone-500 tracking-wider">
            Customer WiFi Pass Slip
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Slip */}
        <div className="p-6 text-center space-y-4">
          
          {/* Header */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center mb-2">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-stone-900 tracking-tight">
              HotspotPay Guest WiFi
            </h3>
            <p className="text-xs text-stone-500">Fast &amp; Secure Wireless Internet</p>
          </div>

          {/* Dotted divider */}
          <div className="border-t border-dashed border-stone-300 my-2"></div>

          {/* WiFi Details */}
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-stone-500">Network (SSID):</span>
              <span className="font-mono font-bold text-stone-900">{hotspot.ssid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Plan / Package:</span>
              <span className="font-medium text-stone-900">{voucher.packageName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Access Duration:</span>
              <span className="font-semibold text-stone-900">{voucher.durationMinutes} Minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Price Paid:</span>
              <span className="font-bold text-emerald-700">${voucher.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Voucher Code Box */}
          <div className="p-4 rounded-xl bg-stone-900 text-white">
            <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1">
              Your Access Code
            </span>
            <div className="font-mono text-3xl font-black tracking-widest text-emerald-300">
              {formatCode(voucher.code)}
            </div>
          </div>

          {/* Simple Instructions */}
          <div className="text-[11px] text-stone-600 text-left space-y-1 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <p className="font-semibold text-stone-800">How to get online:</p>
            <p>1. Connect your device to WiFi network <strong>"{hotspot.ssid}"</strong></p>
            <p>2. The captive portal login page will appear automatically.</p>
            <p>3. Select <strong>"Redeem Voucher"</strong> and enter your code above.</p>
          </div>

          {voucher.notes && (
            <p className="text-[11px] text-stone-400 italic">Note: {voucher.notes}</p>
          )}

          <div className="text-[10px] text-stone-400">
            Issued on {new Date(voucher.createdAt).toLocaleDateString()} • Code #{voucher.code}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
        </div>

      </div>
    </div>
  );
};
