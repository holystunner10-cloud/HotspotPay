import React, { useState } from 'react';
import { X, Sparkles, Plus, Layers } from 'lucide-react';
import { Voucher, VoucherPackage } from '../types';
import { generateVoucherCode, formatCode } from '../utils/voucherUtils';

interface VoucherGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: VoucherPackage[];
  onGenerateBatch: (newVouchers: Voucher[]) => void;
}

export const VoucherGeneratorModal: React.FC<VoucherGeneratorModalProps> = ({
  isOpen,
  onClose,
  packages,
  onGenerateBatch,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(packages[1]?.id || packages[0]?.id || '');
  const [customMinutes, setCustomMinutes] = useState<number>(60);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(packages[1]?.price || 1.50);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectPackage = (pkg: VoucherPackage) => {
    setSelectedPackageId(pkg.id);
    setIsCustomDuration(false);
    setCustomMinutes(pkg.minutes);
    setPrice(pkg.price);
  };

  const handleToggleCustom = () => {
    setIsCustomDuration(true);
    setSelectedPackageId('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const activePkg = packages.find(p => p.id === selectedPackageId);
    const packageName = isCustomDuration ? `${customMinutes} Mins Custom` : (activePkg?.name || `${customMinutes} Mins`);
    const duration = isCustomDuration ? customMinutes : (activePkg?.minutes || 60);

    const generated: Voucher[] = [];
    for (let i = 0; i < batchCount; i++) {
      generated.push({
        id: `v-${now}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        code: generateVoucherCode(),
        packageName,
        durationMinutes: duration,
        price,
        status: 'unused',
        createdAt: now,
        notes: notes.trim() || (batchCount > 1 ? `Batch of ${batchCount} (#${i + 1})` : undefined),
      });
    }

    onGenerateBatch(generated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div 
        id="modal-voucher-generator"
        className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Generate WiFi Vouchers</h2>
              <p className="text-xs text-stone-500">Mint new offline access codes for clients</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Preset Package Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Select Package
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id && !isCustomDuration;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    <span className="text-xs font-semibold block truncate">{pkg.name}</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className={`text-xs font-mono ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        {pkg.minutes}m
                      </span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-300' : 'text-stone-900'}`}>
                        ${pkg.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Custom Duration Button */}
              <button
                type="button"
                onClick={handleToggleCustom}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isCustomDuration
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                    : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-800'
                }`}
              >
                <span className="text-xs font-semibold block">Custom Time</span>
                <span className={`text-xs ${isCustomDuration ? 'text-stone-300' : 'text-stone-500'}`}>
                  Specify mins
                </span>
              </button>
            </div>
          </div>

          {/* Custom duration input if toggled */}
          {isCustomDuration && (
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Duration (in Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={43200}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-mono"
                  required
                />
              </div>
            </div>
          )}

          {/* Price & Batch count */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Price (USD $)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-7 pr-3 py-2 border border-stone-300 rounded-lg text-sm bg-white font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Quantity to Generate
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBatchCount(count)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      batchCount === count
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {count}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes / Client reference */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Reference / Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Front desk sales, Table 4, Conference room"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white text-stone-800 placeholder-stone-400"
            />
          </div>

          {/* Summary preview */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>
                Will mint <strong>{batchCount} voucher{batchCount > 1 ? 's' : ''}</strong> of{' '}
                <strong>{isCustomDuration ? customMinutes : (packages.find(p => p.id === selectedPackageId)?.minutes || 60)} minutes</strong> each.
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-800">
              Total: ${(price * batchCount).toFixed(2)}
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-generate"
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Generate {batchCount > 1 ? `${batchCount} Vouchers` : 'Voucher'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
