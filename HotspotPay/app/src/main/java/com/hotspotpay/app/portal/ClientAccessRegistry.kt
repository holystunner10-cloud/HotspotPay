package com.hotspotpay.app.portal

import java.util.concurrent.ConcurrentHashMap

/**
 * Tracks which connected client IPs have paid, and for how long.
 * The captive portal server consults this before deciding whether
 * to serve the login/payment page or let a request through.
 */
object ClientAccessRegistry {

    private val paidUntil = ConcurrentHashMap<String, Long>() // clientIp -> expiry epoch millis

    fun grantAccess(clientIp: String, durationMillis: Long) {
        paidUntil[clientIp] = System.currentTimeMillis() + durationMillis
    }

    fun hasAccess(clientIp: String): Boolean {
        val expiry = paidUntil[clientIp] ?: return false
        if (System.currentTimeMillis() > expiry) {
            paidUntil.remove(clientIp)
            return false
        }
        return true
    }

    fun revoke(clientIp: String) {
        paidUntil.remove(clientIp)
    }
}
