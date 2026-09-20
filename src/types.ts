export type VoucherStatus = 'active' | 'unused' | 'expiring' | 'expired' | 'revoked';

export interface Voucher {
  id: string;
  code: string;
  packageName: string;
  durationMinutes: number;
  price: number;
  status: VoucherStatus;
  createdAt: number; // epoch ms
  activatedAt?: number; // epoch ms
  expiresAt?: number; // epoch ms
  clientIp?: string;
  clientMac?: string;
  clientDeviceName?: string;
  dataUsedMb?: number;
  dataLimitMb?: number;
  notes?: string;
}

export interface VoucherPackage {
  id: string;
  name: string;
  minutes: number;
  price: number;
  dataLimitMb?: number;
  popular?: boolean;
}

export interface HotspotInfo {
  ssid: string;
  band: '2.4 GHz' | '5 GHz';
  gatewayIp: string;
  port: number;
  isBroadcasting: boolean;
  connectedDevices: number;
  maxDevices: number;
  uptimeSeconds: number;
}
