package com.hotspotpay.app.payment

import java.util.concurrent.ConcurrentHashMap

/**
 * Fully offline payment method: you (the hotspot owner) pre-generate voucher
 * codes — e.g. print them on slips of paper — and sell them for cash. This one
 * needs no backend or internet connection at all, unlike mobile money/card.
 */
class VoucherGateway {

    companion object {
        // code -> (minutes of access, already used, timestamps, etc.)
        private val vouchers = ConcurrentHashMap<String, VoucherInfo>()

        data class VoucherInfo(
            val minutes: Int,
            val packageName: String = "",
            val price: Double = 0.0,
            var used: Boolean = false,
            val createdAt: Long = System.currentTimeMillis(),
            var activatedAt: Long? = null,
            var expiresAt: Long? = null,
            var clientIp: String? = null,
            var revoked: Boolean = false
        ) {
            fun remainingMillis(): Long {
                if (revoked) return 0L
                val exp = expiresAt ?: return minutes * 60 * 1000L
                val diff = exp - System.currentTimeMillis()
                return if (diff > 0) diff else 0L
            }

            fun status(): String {
                if (revoked) return "REVOKED"
                if (!used) return "UNUSED"
                val exp = expiresAt ?: return "UNUSED"
                return if (System.currentTimeMillis() > exp) "EXPIRED" else "ACTIVE"
            }

            fun formatRemaining(): String {
                if (revoked) return "Revoked"
                if (!used) return "${minutes}m (Ready)"
                val rem = remainingMillis()
                if (rem <= 0) return "Expired"
                val totalSec = rem / 1000
                val h = totalSec / 3600
                val m = (totalSec % 3600) / 60
                val s = totalSec % 60
                return if (h > 0) String.format("%02d:%02d:%02d left", h, m, s) else String.format("%02d:%02d left", m, s)
            }
        }

        /** Call this from your admin/owner screen to mint new codes to sell. */
        fun generate(minutes: Int = 60, packageName: String = "", price: Double = 0.0): String {
            val code = (100000..999999).random().toString()
            vouchers[code] = VoucherInfo(minutes, packageName, price)
            return code
        }

        fun allVouchers(): Map<String, VoucherInfo> = vouchers

        fun extend(code: String, extraMinutes: Int): Boolean {
            val v = vouchers[code] ?: return false
            val currentExp = if (v.expiresAt != null && v.expiresAt!! > System.currentTimeMillis()) {
                v.expiresAt!!
            } else {
                System.currentTimeMillis()
            }
            v.expiresAt = currentExp + (extraMinutes * 60 * 1000L)
            v.used = true
            v.revoked = false
            return true
        }

        fun revoke(code: String): Boolean {
            val v = vouchers[code] ?: return false
            v.revoked = true
            v.expiresAt = System.currentTimeMillis()
            return true
        }
    }

    fun redeem(code: String, clientIp: String = ""): PaymentResult {
        val voucher = vouchers[code]
        return when {
            voucher == null -> PaymentResult(success = false, message = "Invalid code")
            voucher.revoked -> PaymentResult(success = false, message = "Code was revoked")
            voucher.used -> PaymentResult(success = false, message = "Code already used")
            else -> {
                voucher.used = true
                voucher.activatedAt = System.currentTimeMillis()
                voucher.expiresAt = System.currentTimeMillis() + (voucher.minutes * 60 * 1000L)
                voucher.clientIp = clientIp
                PaymentResult(
                    success = true,
                    message = "Redeemed",
                    durationMillis = voucher.minutes * 60 * 1000L
                )
            }
        }
    }
}

