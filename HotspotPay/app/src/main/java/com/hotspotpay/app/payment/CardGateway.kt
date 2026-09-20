package com.hotspotpay.app.payment

/**
 * Stub for card payments (Stripe/PayPal style).
 *
 * Never collect raw card numbers inside this app. The safe pattern is:
 *   1. This server-side route asks your backend to create a Stripe Checkout
 *      Session (or PayPal order).
 *   2. The captive portal page redirects the client's browser to that
 *      hosted checkout URL (still works fine inside the OS captive-portal
 *      mini-browser).
 *   3. Stripe/PayPal redirects back to a "success" URL on your local server,
 *      or you confirm via webhook to your backend, then this app grants access.
 *
 * This keeps PCI-DSS scope on Stripe/PayPal, not on your app.
 */
class CardGateway {

    private val BACKEND_URL = "https://your-backend.example.com/api/card/create-session"

    suspend fun charge(params: Map<String, String>): PaymentResult {
        // TODO: call your backend to create a checkout session, return its URL,
        // and have CaptivePortalServer redirect the client there instead of
        // resolving success/failure synchronously like this stub does.
        return PaymentResult(success = false, message = "Card payment backend not yet configured")
    }
}
