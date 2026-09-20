import React from 'react';
import { Activity, Ticket, Clock, DollarSign, WifiOff } from 'lucide-react';
import { Voucher } from '../types';
import { computeVoucherTiming } from '../utils/voucherUtils';

interface StatsCardsProps {
  vouchers: Voucher[];
  now: number;
  onFilterSelect: (filter: 'all' | 'active' | 'unused' | 'expiring' | 'expired') => void;
  activeFilter: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  vouchers,
  now,
  onFilterSelect,
  activeFilter,
}) => {
  const stats = vouchers.reduce(
    (acc, v) => {
      const timing = computeVoucherTiming(v, now);
      if (timing.effectiveStatus === 'active') {
        acc.active += 1;
      } else if (timing.effectiveStatus === 'expiring') {
        acc.expiring += 1;
        acc.active += 1; // Expiring is also an active session
      } else if (timing.effectiveStatus === 'unused') {
        acc.unused += 1;
      } else if (timing.effectiveStatus === 'expired') {
        acc.expired += 1;
      }
      acc.totalRevenue += v.price;
      return acc;
    },
    { active: 0, unused: 0, expiring: 0, expired: 0, totalRevenue: 0 }
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      
      {/* Active Sessions */}
      <button
        id="stat-card-active"
        type="button"
        onClick={() => onFilterSelect('active')}
        className={`p-4 rounded-xl border text-left transition-all ${
          activeFilter === 'active'
            ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
            : 'bg-white border-stone-200 hover:border-emerald-200 hover:bg-stone-50/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Active Sessions
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
            {stats.active}
          </span>
          <span className="text-xs text-emerald-700 font-medium">Online now</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1.5">
          Clients browsing with active time
        </p>
      </button>

      {/* Available Unused */}
      <button
        id="stat-card-unused"
        type="button"
        onClick={() => onFilterSelect('unused')}
        className={`p-4 rounded-xl border text-left transition-all ${
          activeFilter === 'unused'
            ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400'
            : 'bg-white border-stone-200 hover:border-sky-200 hover:bg-stone-50/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Unused Codes
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
            <Ticket className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
            {stats.unused}
          </span>
          <span className="text-xs text-sky-700 font-medium">Ready to sell</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1.5">
          Pre-minted for cash sale or slip printing
        </p>
      </button>

      {/* Expiring Soon */}
      <button
        id="stat-card-expiring"
        type="button"
        onClick={() => onFilterSelect('expiring')}
        className={`p-4 rounded-xl border text-left transition-all ${
          activeFilter === 'expiring'
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400'
            : 'bg-white border-stone-200 hover:border-amber-200 hover:bg-stone-50/50'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Expiring Soon
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
            {stats.expiring}
          </span>
          <span className="text-xs text-amber-700 font-medium">&lt; 10m left</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1.5">
          Eligible for quick time extension
        </p>
      </button>

      {/* Revenue */}
      <div
        id="stat-card-revenue"
        className="p-4 rounded-xl border border-stone-200 bg-white text-left"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Voucher Sales
          </span>
          <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
            ${stats.totalRevenue.toFixed(2)}
          </span>
          <span className="text-xs text-stone-500 font-medium">{vouchers.length} total</span>
        </div>
        <p className="text-[11px] text-stone-500 mt-1.5">
          Gross value of issued vouchers
        </p>
      </div>

    </div>
  );
};
