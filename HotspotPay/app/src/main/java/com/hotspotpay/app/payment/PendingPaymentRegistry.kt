package com.hotspotpay.app.payment

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

data class PendingPayment(
    val id: Int,
    val clientIp: String,
    val phone: String,
    val reference: String,
    val minutes: Int,
    val amountLabel: String,
    var status: Status = Status.PENDING
) {
    enum class Status { PENDING, APPROVED, REJECTED }
}

/**
 * Holds mobile-money payment claims until the owner checks their mobile money
 * app/SMS for the matching transaction and approves or rejects here. No backend
 * or provider API integration needed — this is the "send money, then I'll let
 * you online" workflow used by small hotspot vendors.
 */
object PendingPaymentRegistry {

    private val nextId = AtomicInteger(1)
    private val payments = ConcurrentHashMap<Int, PendingPayment>()

    fun submit(clientIp: String, phone: String, reference: String, minutes: Int, amountLabel: String): PendingPayment {
        val id = nextId.getAndIncrement()
        val p = PendingPayment(id, clientIp, phone, reference, minutes, amountLabel)
        payments[id] = p
        return p
    }

    fun all(): List<PendingPayment> = payments.values.sortedByDescending { it.id }

    fun get(id: Int): PendingPayment? = payments[id]

    fun setStatus(id: Int, status: PendingPayment.Status) {
        payments[id]?.status = status
    }
}
