import { Voucher, VoucherStatus } from '../types';

export function generateVoucherCode(): string {
  // 6 digits random number like in HotspotPay VoucherGateway (100000..999999)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function formatCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return code;
}

export interface RemainingTimeInfo {
  text: string;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  percentElapsed: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  effectiveStatus: VoucherStatus;
}

export function computeVoucherTiming(voucher: Voucher, now: number): RemainingTimeInfo {
  if (voucher.status === 'revoked') {
    return {
      text: 'Revoked',
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      percentElapsed: 100,
      isExpiringSoon: false,
      isExpired: false,
      effectiveStatus: 'revoked',
    };
  }

  if (voucher.status === 'unused' || !voucher.expiresAt || !voucher.activatedAt) {
    const totalMins = voucher.durationMinutes;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const label = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    return {
      text: `${label} (Unused)`,
      hours: h,
      minutes: m,
      seconds: 0,
      totalSeconds: totalMins * 60,
      percentElapsed: 0,
      isExpiringSoon: false,
      isExpired: false,
      effectiveStatus: 'unused',
    };
  }

  const remainingMs = voucher.expiresAt - now;
  const totalDurationMs = (voucher.expiresAt - voucher.activatedAt) || (voucher.durationMinutes * 60 * 1000);

  if (remainingMs <= 0) {
    return {
      text: 'Expired',
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      percentElapsed: 100,
      isExpiringSoon: false,
      isExpired: true,
      effectiveStatus: 'expired',
    };
  }

  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const elapsedMs = Math.max(0, totalDurationMs - remainingMs);
  const percentElapsed = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));

  const pad = (n: number) => n.toString().padStart(2, '0');
  const text = hours > 0 
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` 
    : `${pad(minutes)}:${pad(seconds)}`;

  // If less than 10 minutes remaining, consider expiring soon
  const isExpiringSoon = remainingMs <= 10 * 60 * 1000;
  const effectiveStatus = isExpiringSoon ? 'expiring' : 'active';

  return {
    text,
    hours,
    minutes,
    seconds,
    totalSeconds: totalSec,
    percentElapsed,
    isExpiringSoon,
    isExpired: false,
    effectiveStatus,
  };
}

export function formatTimeAgo(timestamp: number, now: number): string {
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return 'just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function exportVouchersToCSV(vouchers: Voucher[], now: number): void {
  const headers = ['Voucher Code', 'Package', 'Duration (Min)', 'Price ($)', 'Status', 'Remaining Time', 'Client IP', 'Device', 'Created At'];
  const rows = vouchers.map(v => {
    const timing = computeVoucherTiming(v, now);
    return [
      `"${v.code}"`,
      `"${v.packageName}"`,
      v.durationMinutes,
      v.price.toFixed(2),
      timing.effectiveStatus.toUpperCase(),
      `"${timing.text}"`,
      `"${v.clientIp || 'N/A'}"`,
      `"${v.clientDeviceName || 'N/A'}"`,
      `"${new Date(v.createdAt).toISOString()}"`,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `wifi_vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
