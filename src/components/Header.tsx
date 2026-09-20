import React from 'react';
import { Wifi, Plus, Download, RefreshCw, ShieldCheck, Radio } from 'lucide-react';
import { HotspotInfo } from '../types';

interface HeaderProps {
  hotspot: HotspotInfo;
  onOpenGenerateModal: () => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  isBroadcasting: boolean;
  onToggleBroadcasting: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hotspot,
  onOpenGenerateModal,
  onExportCSV,
  onRefresh,
  isBroadcasting,
  onToggleBroadcasting,
}) => {
  return (
    <header id="dashboard-header" className="bg-white border-b border-stone-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Brand & Hotspot Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-stone-900 tracking-tight font-display">
                  HotspotPay
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Voucher Engine
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                <span>SSID: <strong className="text-stone-700 font-mono">{hotspot.ssid}</strong></span>
                <span>•</span>
                <span>Captive: <strong className="text-stone-700 font-mono">{hotspot.gatewayIp}:{hotspot.port}</strong></span>
              </p>
            </div>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Hotspot Toggle */}
            <button
              id="btn-toggle-hotspot"
              type="button"
              onClick={onToggleBroadcasting}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                isBroadcasting
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-stone-100 border-stone-300 text-stone-600 hover:bg-stone-200'
              }`}
              title="Toggle hotspot broadcast state"
            >
              <Radio className={`w-3.5 h-3.5 ${isBroadcasting ? 'text-emerald-600' : 'text-stone-500'}`} />
              <span>{isBroadcasting ? 'Hotspot Online' : 'Hotspot Paused'}</span>
            </button>

            {/* Refresh */}
            <button
              id="btn-refresh-dashboard"
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
              title="Refresh vouchers and statuses"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export CSV */}
            <button
              id="btn-export-csv"
              type="button"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
              title="Download vouchers report in CSV"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Export CSV</span>
            </button>

            {/* Generate Voucher Primary Button */}
            <button
              id="btn-generate-voucher-modal"
              type="button"
              onClick={onOpenGenerateModal}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 shadow-sm transition-all focus:ring-2 focus:ring-stone-500 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Vouchers</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
