import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Plus, 
  Ticket, 
  Clock, 
  Activity, 
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { Voucher } from '../types';
import { computeVoucherTiming } from '../utils/voucherUtils';
import { VoucherCard } from './VoucherCard';
import { VoucherRow } from './VoucherRow';

interface VoucherListSectionProps {
  vouchers: Voucher[];
  now: number;
  filter: 'all' | 'active' | 'unused' | 'expiring' | 'expired';
  onFilterChange: (filter: 'all' | 'active' | 'unused' | 'expiring' | 'expired') => void;
  onOpenGenerateModal: () => void;
  onExtend: (voucherId: string, extraMinutes: number) => void;
  onOpenCustomExtend: (voucher: Voucher) => void;
  onRevoke: (voucherId: string) => void;
  onDelete: (voucherId: string) => void;
  onSimulateRedeem: (voucherId: string) => void;
  onPrint: (voucher: Voucher) => void;
  onClearExpired: () => void;
}

export const VoucherListSection: React.FC<VoucherListSectionProps> = ({
  vouchers,
  now,
  filter,
  onFilterChange,
  onOpenGenerateModal,
  onExtend,
  onOpenCustomExtend,
  onRevoke,
  onDelete,
  onSimulateRedeem,
  onPrint,
  onClearExpired,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'remaining' | 'created' | 'price'>('remaining');

  // Filter and sort vouchers
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const timing = computeVoucherTiming(voucher, now);
      
      // Status filter
      if (filter === 'active') {
        if (timing.effectiveStatus !== 'active' && timing.effectiveStatus !== 'expiring') return false;
      } else if (filter === 'unused') {
        if (timing.effectiveStatus !== 'unused') return false;
      } else if (filter === 'expiring') {
        if (timing.effectiveStatus !== 'expiring') return false;
      } else if (filter === 'expired') {
        if (timing.effectiveStatus !== 'expired' && timing.effectiveStatus !== 'revoked') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = voucher.code.toLowerCase().includes(q);
        const matchesPkg = voucher.packageName.toLowerCase().includes(q);
        const matchesIp = (voucher.clientIp || '').toLowerCase().includes(q);
        const matchesDevice = (voucher.clientDeviceName || '').toLowerCase().includes(q);
        const matchesNotes = (voucher.notes || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesPkg && !matchesIp && !matchesDevice && !matchesNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'remaining') {
        const timingA = computeVoucherTiming(a, now);
        const timingB = computeVoucherTiming(b, now);
        // Active vouchers with remaining time first
        const isLiveA = timingA.effectiveStatus === 'active' || timingA.effectiveStatus === 'expiring';
        const isLiveB = timingB.effectiveStatus === 'active' || timingB.effectiveStatus === 'expiring';
        if (isLiveA && !isLiveB) return -1;
        if (!isLiveA && isLiveB) return 1;
        if (isLiveA && isLiveB) return timingA.totalSeconds - timingB.totalSeconds;
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'price') return b.price - a.price;
      return b.createdAt - a.createdAt;
    });
  }, [vouchers, now, filter, searchQuery, sortBy]);

  // Tab counts
  const counts = useMemo(() => {
    return vouchers.reduce(
      (acc, v) => {
        const timing = computeVoucherTiming(v, now);
        acc.all += 1;
        if (timing.effectiveStatus === 'active') acc.active += 1;
        else if (timing.effectiveStatus === 'expiring') {
          acc.expiring += 1;
          acc.active += 1;
        } else if (timing.effectiveStatus === 'unused') acc.unused += 1;
        else if (timing.effectiveStatus === 'expired' || timing.effectiveStatus === 'revoked') acc.expired += 1;
        return acc;
      },
      { all: 0, active: 0, expiring: 0, unused: 0, expired: 0 }
    );
  }, [vouchers, now]);

  return (
    <section id="voucher-management-section" className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-6 shadow-xs">
      
      {/* Section Title & Subheading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-stone-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
              WiFi Vouchers &amp; Active Access List
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
              {filteredVouchers.length} shown
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Monitor real-time remaining session times, track client IPs, and mint new access codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {counts.expired > 0 && (
            <button
              type="button"
              onClick={onClearExpired}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              title="Delete all expired and revoked vouchers"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Expired</span>
            </button>
          )}

          <button
            id="btn-quick-generate"
            type="button"
            onClick={onOpenGenerateModal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Mint Voucher</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="py-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-stone-100">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            id="tab-filter-all"
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'all' ? 'bg-stone-700 text-stone-200' : 'bg-stone-200/80 text-stone-700'}`}>
              {counts.all}
            </span>
          </button>

          <button
            id="tab-filter-active"
            type="button"
            onClick={() => onFilterChange('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Active In-Use</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'active' ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200/80 text-stone-700'}`}>
              {counts.active}
            </span>
          </button>

          <button
            id="tab-filter-expiring"
            type="button"
            onClick={() => onFilterChange('expiring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === 'expiring'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>Expiring (&lt;10m)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'expiring' ? 'bg-amber-800 text-amber-100' : 'bg-stone-200/80 text-stone-700'}`}>
              {counts.expiring}
            </span>
          </button>

          <button
            id="tab-filter-unused"
            type="button"
            onClick={() => onFilterChange('unused')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === 'unused'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>Unused Ready</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'unused' ? 'bg-sky-800 text-sky-100' : 'bg-stone-200/80 text-stone-700'}`}>
              {counts.unused}
            </span>
          </button>

          <button
            id="tab-filter-expired"
            type="button"
            onClick={() => onFilterChange('expired')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === 'expired'
                ? 'bg-stone-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>Expired / Revoked</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'expired' ? 'bg-stone-600 text-stone-200' : 'bg-stone-200/80 text-stone-700'}`}>
              {counts.expired}
            </span>
          </button>
        </div>

        {/* Search & Layout View Toggles */}
        <div className="flex items-center gap-2">
          
          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              id="search-vouchers-input"
              type="text"
              placeholder="Search code, IP, package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-lg py-1.5 pl-2.5 pr-6 text-stone-700 cursor-pointer focus:outline-none"
            >
              <option value="remaining">Sort: Remaining Time</option>
              <option value="created">Sort: Newest</option>
              <option value="price">Sort: Price</option>
            </select>
          </div>

          {/* Grid vs Table View Switch */}
          <div className="flex items-center border border-stone-200 rounded-lg p-0.5 bg-stone-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Dense Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Main List Rendering */}
      <div className="pt-4">
        {filteredVouchers.length === 0 ? (
          <div className="py-12 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
              <Ticket className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800">No vouchers found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery
                ? `No vouchers matched the search "${searchQuery}".`
                : filter !== 'all'
                ? `There are currently no vouchers matching the "${filter}" filter.`
                : 'Start minting WiFi access vouchers for your hotspot clients.'}
            </p>
            <button
              type="button"
              onClick={onOpenGenerateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Vouchers</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                now={now}
                onExtend={onExtend}
                onOpenCustomExtend={onOpenCustomExtend}
                onRevoke={onRevoke}
                onDelete={onDelete}
                onSimulateRedeem={onSimulateRedeem}
                onPrint={onPrint}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Voucher Code</th>
                  <th className="py-2.5 px-4">Plan / Price</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Remaining Time</th>
                  <th className="py-2.5 px-4">Connected Client</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => (
                  <VoucherRow
                    key={voucher.id}
                    voucher={voucher}
                    now={now}
                    onExtend={onExtend}
                    onOpenCustomExtend={onOpenCustomExtend}
                    onRevoke={onRevoke}
                    onDelete={onDelete}
                    onSimulateRedeem={onSimulateRedeem}
                    onPrint={onPrint}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </section>
  );
};
