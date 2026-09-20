package com.hotspotpay.app.payment

import okhttp3.OkHttpClient
import okhttp3.Request

/**
 * Stub for mobile money (EcoCash, M-Pesa, etc.) STK-push style payment.
 *
 * Real integration needs YOUR merchant credentials from the provider
 * (e.g. EcoCash Merchant API, Safaricom Daraja for M-Pesa). Typical flow:
 *   1. Your server (not this phone directly) calls the provider's "initiate payment"
 *      endpoint with the customer's phone number and amount.
 *   2. The customer gets a USSD prompt on their phone to approve.
 *   3. The provider calls YOUR server's webhook when they approve/decline.
 *   4. This app polls your server (or gets pushed a result) to know the outcome.
 *
 * You cannot safely put provider API secrets inside the APK itself (anyone can
 * decompile it), so this class is written to call OUT to a small backend of yours
 * (BACKEND_URL below) rather than the mobile money provider directly.
 */
class MobileMoneyGateway {

    private val client = OkHttpClient()
    private val BACKEND_URL = "https://your-backend.example.com/api/mobile-money/charge"

    suspend fun charge(phone: String): PaymentResult {
        if (phone.isBlank()) {
            return PaymentResult(success = false, message = "Enter a valid phone number")
        }

        return try {
            // TODO: replace with your real backend call, e.g.:
            // val body = FormBody.Builder().add("phone", phone).add("amount", "1.00").build()
            // val req = Request.Builder().url(BACKEND_URL).post(body).build()
            // val resp = client.newCall(req).execute()
            // parse resp for success/failure

            PaymentResult(success = false, message = "Mobile money backend not yet configured")
        } catch (e: Exception) {
            PaymentResult(success = false, message = "Network error: ${e.message}")
        }
    }
}
