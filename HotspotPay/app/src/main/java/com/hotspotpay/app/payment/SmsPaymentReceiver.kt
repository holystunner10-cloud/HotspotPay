package com.hotspotpay.app.payment

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.hotspotpay.app.portal.ClientAccessRegistry

/**
 * Fires on every incoming SMS. Checks it against pending mobile money claims —
 * if the reference code a guest typed into the login page shows up in the SMS
 * text (e.g. your provider's "You received $X from Y, TxID: 482910" message),
 * that guest is auto-approved with no owner action needed.
 *
 * This is deliberately simple substring matching rather than trying to parse
 * every provider's SMS format — it works with any provider that includes the
 * transaction/reference number in its confirmation text, which is virtually
 * all of them (EcoCash, M-Pesa, etc.).
 *
 * If your provider doesn't send you a confirmation SMS at all, this won't
 * trigger — the manual Approve button in PendingPaymentsActivity still works
 * as the fallback either way.
 */
class SmsPaymentReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        val fullBody = messages.joinToString("") { it.messageBody ?: "" }
        if (fullBody.isBlank()) return

        matchAndApprove(context, fullBody)
    }

    companion object {
        /** Minimum reference length to consider a match, to avoid false positives on short codes. */
        private const val MIN_REFERENCE_LENGTH = 4

        fun matchAndApprove(context: Context, smsBody: String) {
            val normalizedBody = smsBody.replace("\\s".toRegex(), "").lowercase()

            PendingPaymentRegistry.all()
                .filter { it.status == PendingPayment.Status.PENDING }
                .forEach { payment ->
                    val ref = payment.reference.replace("\\s".toRegex(), "").lowercase()
                    if (ref.length >= MIN_REFERENCE_LENGTH && normalizedBody.contains(ref)) {
                        ClientAccessRegistry.grantAccess(payment.clientIp, payment.minutes * 60 * 1000L)
                        PendingPaymentRegistry.setStatus(payment.id, PendingPayment.Status.APPROVED)
                        Log.i("SmsPaymentReceiver", "Auto-approved payment ${payment.id} via SMS match")
                    }
                }
        }
    }
}
