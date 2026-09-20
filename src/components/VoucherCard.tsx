import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Clock, 
  Wifi, 
  Smartphone, 
  Printer, 
  PlusCircle, 
  Ban, 
  Trash2, 
  Play,
  AlertTriangle
} from 'lucide-react';
import { Voucher } from '../types';
import { computeVoucherTiming, formatCode } from '../utils/voucherUtils';

interface VoucherCardProps {
  voucher: Voucher;
  now: number;
  onExtend: (voucherId: string, extraMinutes: number) => void;
  onOpenCustomExtend: (voucher: Voucher) => void;
  onRevoke: (voucherId: string) => void;
  onDelete: (voucherId: string) => void;
  onSimulateRedeem: (voucherId: string) => void;
  onPrint: (voucher: Voucher) => void;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({
  voucher,
  now,
  onExtend,
  onOpenCustomExtend,
  onRevoke,
  onDelete,
  onSimulateRedeem,
  onPrint,
}) => {
  const [copied, setCopied] = useState(false);
  const timing = computeVoucherTiming(voucher, now);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const getStatusBadge = () => {
    switch (timing.effectiveStatus) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Session
          </span>
        );
      case 'expiring':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Expiring Soon
          </span>
        );
      case 'unused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Ready / Unused
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            Expired
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            Revoked
          </span>
        );
    }
  };

  const isLive = timing.effectiveStatus === 'active' || timing.effectiveStatus === 'expiring';

  return (
    <div 
      id={`voucher-card-${voucher.id}`}
      className={`relative bg-white rounded-xl border p-4 sm:p-5 transition-all flex flex-col justify-between ${
        timing.effectiveStatus === 'expiring' 
          ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20 shadow-sm'
          : timing.effectiveStatus === 'active'
          ? 'border-emerald-200 shadow-sm'
          : 'border-stone-200 hover:border-stone-300 shadow-xs'
      }`}
    >
      {/* Top row: Package info + Status */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-stone-900 text-base flex items-center gap-2">
              <span>{voucher.packageName}</span>
              <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-mono">
                ${voucher.price.toFixed(2)}
              </span>
            </h3>
            {voucher.notes && (
              <p className="text-xs text-stone-500 mt-0.5">{voucher.notes}</p>
            )}
          </div>
          {getStatusBadge()}
        </div>

        {/* Big Voucher Code */}
        <div className="bg-stone-50 rounded-lg p-3 border border-stone-200/80 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-0.5">
              Voucher Code
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-stone-800">
              {formatCode(voucher.code)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy voucher code"
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-white rounded-md border border-transparent hover:border-stone-200 transition-all"
            title="Copy Code"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Check className="w-4 h-4" />
                <span>Copied</span>
              </span>
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Countdown Timer & Progress (for Active / Expiring) */}
        {isLive && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-500 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                Remaining Time:
              </span>
              <span className={`font-mono font-bold text-sm ${
                timing.effectiveStatus === 'expiring' ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {timing.text}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  timing.effectiveStatus === 'expiring' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(4, 100 - timing.percentElapsed)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
              <span>Elapsed: {timing.percentElapsed}%</span>
              <span>Total: {voucher.durationMinutes}m</span>
            </div>
          </div>
        )}

        {/* Unused Voucher info */}
        {voucher.status === 'unused' && (
          <div className="mb-4 text-xs text-stone-600 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              Duration: <strong>{voucher.durationMinutes} Minutes</strong>
            </span>
            <span className="text-sky-700 font-medium">Ready for activation</span>
          </div>
        )}

        {/* Expired Voucher info */}
        {timing.effectiveStatus === 'expired' && (
          <div className="mb-4 text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200/60 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              Duration: {voucher.durationMinutes}m
            </span>
            <span className="text-stone-500">Session Completed</span>
          </div>
        )}

        {/* Device & Client Info (if active or previously connected) */}
        {voucher.clientIp && (
          <div className="mb-4 pt-3 border-t border-stone-100 text-xs space-y-1">
            <div className="flex items-center justify-between text-stone-600">
              <span className="flex items-center gap-1.5 text-stone-500">
                <Smartphone className="w-3.5 h-3.5 text-stone-400" />
                {voucher.clientDeviceName || 'Connected Client'}
              </span>
              <span className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                {voucher.clientIp}
              </span>
            </div>
            {voucher.dataLimitMb && (
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <span>Data transfer:</span>
                <span>{voucher.dataUsedMb || 0} MB / {voucher.dataLimitMb} MB</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-stone-100 mt-2">
        {isLive ? (
          <div className="space-y-2">
            {/* Quick Extension Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-500 font-medium whitespace-nowrap">Extend:</span>
              <button
                type="button"
                onClick={() => onExtend(voucher.id, 15)}
                className="px-2 py-1 text-[11px] font-medium rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors"
                title="Add 15 minutes"
              >
                +15m
              </button>
              <button
                type="button"
                onClick={() => onExtend(voucher.id, 30)}
                className="px-2 py-1 text-[11px] font-medium rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors"
                title="Add 30 minutes"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => onExtend(voucher.id, 60)}
                className="px-2 py-1 text-[11px] font-medium rounded border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors"
                title="Add 1 hour"
              >
                +1h
              </button>
              <button
                type="button"
                onClick={() => onOpenCustomExtend(voucher)}
                className="p-1 text-stone-400 hover:text-stone-700 transition-colors ml-auto"
                title="Custom extension"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Utility actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => onPrint(voucher)}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 transition-colors py-1"
                title="Print slip"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => onRevoke(voucher.id)}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 transition-colors py-1"
                title="Disconnect client and revoke voucher"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        ) : voucher.status === 'unused' ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onSimulateRedeem(voucher.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              title="Simulate client redeeming this code on captive portal"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Connect</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPrint(voucher)}
                className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100 transition-colors"
                title="Print customer slip"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(voucher.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                title="Delete unused code"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Created {new Date(voucher.createdAt).toLocaleDateString()}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPrint(voucher)}
                className="p-1 text-stone-500 hover:text-stone-800"
                title="Print copy"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(voucher.id)}
                className="p-1 text-stone-400 hover:text-rose-600"
                title="Remove record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
