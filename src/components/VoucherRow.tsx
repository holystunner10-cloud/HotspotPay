import React, { useState } from 'react';
import { Copy, Check, Printer, Ban, Trash2, Play, AlertTriangle } from 'lucide-react';
import { Voucher } from '../types';
import { computeVoucherTiming, formatCode } from '../utils/voucherUtils';

interface VoucherRowProps {
  voucher: Voucher;
  now: number;
  onExtend: (voucherId: string, extraMinutes: number) => void;
  onOpenCustomExtend: (voucher: Voucher) => void;
  onRevoke: (voucherId: string) => void;
  onDelete: (voucherId: string) => void;
  onSimulateRedeem: (voucherId: string) => void;
  onPrint: (voucher: Voucher) => void;
}

export const VoucherRow: React.FC<VoucherRowProps> = ({
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

  const isLive = timing.effectiveStatus === 'active' || timing.effectiveStatus === 'expiring';

  return (
    <tr 
      id={`voucher-row-${voucher.id}`}
      className="border-b border-stone-200 hover:bg-stone-50/70 transition-colors text-sm"
    >
      {/* Code */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-stone-900 text-base">
            {formatCode(voucher.code)}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy voucher code"
            className="text-stone-400 hover:text-stone-700 p-1 rounded"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>

      {/* Package & Price */}
      <td className="py-3 px-4">
        <div>
          <span className="font-medium text-stone-900 block">{voucher.packageName}</span>
          <span className="text-xs text-stone-500 font-mono">${voucher.price.toFixed(2)}</span>
        </div>
      </td>

      {/* Status Badge */}
      <td className="py-3 px-4">
        {timing.effectiveStatus === 'active' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        )}
        {timing.effectiveStatus === 'expiring' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Expiring
          </span>
        )}
        {timing.effectiveStatus === 'unused' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            Ready
          </span>
        )}
        {timing.effectiveStatus === 'expired' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Expired
          </span>
        )}
        {timing.effectiveStatus === 'revoked' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Revoked
          </span>
        )}
      </td>

      {/* Remaining Time */}
      <td className="py-3 px-4">
        <div className="font-mono text-sm font-semibold">
          <span className={
            timing.effectiveStatus === 'expiring' 
              ? 'text-amber-700' 
              : timing.effectiveStatus === 'active'
              ? 'text-emerald-700'
              : 'text-stone-600'
          }>
            {timing.text}
          </span>
        </div>
        {isLive && (
          <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full ${timing.effectiveStatus === 'expiring' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(5, 100 - timing.percentElapsed)}%` }}
            />
          </div>
        )}
      </td>

      {/* Client Device / IP */}
      <td className="py-3 px-4">
        {voucher.clientIp ? (
          <div>
            <span className="text-xs font-mono text-stone-800 block">{voucher.clientIp}</span>
            <span className="text-[11px] text-stone-400">{voucher.clientDeviceName || 'Client Device'}</span>
          </div>
        ) : (
          <span className="text-xs text-stone-400 italic">Not connected yet</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {isLive && (
            <>
              <button
                type="button"
                onClick={() => onExtend(voucher.id, 30)}
                className="px-2 py-1 text-xs font-medium rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                title="Add 30 minutes"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => onRevoke(voucher.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                title="Revoke / Disconnect"
              >
                <Ban className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {voucher.status === 'unused' && (
            <button
              type="button"
              onClick={() => onSimulateRedeem(voucher.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
              title="Simulate client connecting with this voucher"
            >
              <Play className="w-3 h-3" />
              <span>Connect</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onPrint(voucher)}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded"
            title="Print Voucher"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(voucher.id)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
