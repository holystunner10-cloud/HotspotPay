package com.hotspotpay.app

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.NestedScrollView
import com.hotspotpay.app.payment.PendingPayment
import com.hotspotpay.app.payment.PendingPaymentRegistry
import com.hotspotpay.app.portal.ClientAccessRegistry

/**
 * Lists mobile money payment claims submitted from the login page. Check the
 * amount/reference against your actual mobile money app or SMS, then approve
 * or reject — no automatic verification happens, this is manual by design
 * since there's no payment provider API wired in yet.
 */
class PendingPaymentsActivity : AppCompatActivity() {

    private lateinit var container: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val scroll = NestedScrollView(this)
        container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
        }
        scroll.addView(container)
        setContentView(scroll)

        render()
    }

    override fun onResume() {
        super.onResume()
        render()
    }

    private fun render() {
        container.removeAllViews()
        val payments = PendingPaymentRegistry.all()

        if (payments.isEmpty()) {
            container.addView(TextView(this).apply { text = "No payment claims yet." })
            return
        }

        payments.forEach { p ->
            val row = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(0, 0, 0, 24)
            }
            row.addView(TextView(this).apply {
                text = "Phone: ${p.phone}\nRef: ${p.reference}\nAmount: ${p.amountLabel}\nStatus: ${p.status}"
            })

            if (p.status == PendingPayment.Status.PENDING) {
                val btnRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
                btnRow.addView(Button(this).apply {
                    text = "Approve"
                    setOnClickListener {
                        ClientAccessRegistry.grantAccess(p.clientIp, p.minutes * 60 * 1000L)
                        PendingPaymentRegistry.setStatus(p.id, PendingPayment.Status.APPROVED)
                        render()
                    }
                })
                btnRow.addView(Button(this).apply {
                    text = "Reject"
                    setOnClickListener {
                        PendingPaymentRegistry.setStatus(p.id, PendingPayment.Status.REJECTED)
                        render()
                    }
                })
                row.addView(btnRow)
            }
            container.addView(row)
        }
    }
}
