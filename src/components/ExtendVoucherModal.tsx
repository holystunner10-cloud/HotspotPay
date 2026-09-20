import React, { useState } from 'react';
import { X, Plus, Clock } from 'lucide-react';
import { Voucher } from '../types';
import { computeVoucherTiming, formatCode } from '../utils/voucherUtils';

interface ExtendVoucherModalProps {
  voucher: Voucher | null;
  now: number;
  onClose: () => void;
  onConfirmExtend: (voucherId: string, additionalMinutes: number) => void;
}

export const ExtendVoucherModal: React.FC<ExtendVoucherModalProps> = ({
  voucher,
  now,
  onClose,
  onConfirmExtend,
}) => {
  const [minutesToAdd, setMinutesToAdd] = useState<number>(30);

  if (!voucher) return null;

  const timing = computeVoucherTiming(voucher, now);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (minutesToAdd > 0) {
      onConfirmExtend(voucher.id, minutesToAdd);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div 
        id="modal-extend-voucher"
        className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900">Extend Session Duration</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
            <div className="flex justify-between mb-1">
              <span className="text-stone-500">Voucher Code:</span>
              <span className="font-mono font-bold text-stone-900">{formatCode(voucher.code)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Current Remaining:</span>
              <span className="font-mono font-semibold text-emerald-700">{timing.text}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Select Additional Time
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[15, 30, 60, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutesToAdd(m)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                    minutesToAdd === m
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  +{m >= 60 ? `${m / 60}h` : `${m}m`}
                </button>
              ))}
            </div>

            <div className="relative mt-2">
              <input
                type="number"
                min="1"
                max="1440"
                value={minutesToAdd}
                onChange={(e) => setMinutesToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-mono"
              />
              <span className="absolute right-3 top-2.5 text-xs text-stone-400">minutes</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-extend-time"
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Extend +{minutesToAdd} Mins</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
