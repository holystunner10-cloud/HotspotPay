package com.hotspotpay.app.payment

enum class PaymentMethod { MOBILE_MONEY, CARD, VOUCHER }

data class PaymentResult(
    val success: Boolean,
    val message: String,
    val durationMillis: Long = 60 * 60 * 1000L // default: 1 hour of access
)
