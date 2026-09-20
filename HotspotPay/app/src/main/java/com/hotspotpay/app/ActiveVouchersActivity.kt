package com.hotspotpay.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.NestedScrollView
import com.hotspotpay.app.payment.VoucherGateway

/**
 * Screen to view active WiFi vouchers, their real-time remaining access time,
 * client device IPs, statuses (Active, Unused, Expired), and mint new vouchers.
 */
class ActiveVouchersActivity : AppCompatActivity() {

    private lateinit var container: LinearLayout
    private val handler = Handler(Looper.getMainLooper())
    private var filterMode = "ALL" // ALL, ACTIVE, UNUSED, EXPIRED

    private val ticker = object : Runnable {
        override fun run() {
            render()
            handler.postDelayed(this, 1000)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
        }

        // Title & Header
        root.addView(TextView(this).apply {
            text = "WiFi Vouchers & Active Sessions"
            textSize = 20f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(0, 0, 0, 12)
        })

        // Top button bar to mint
        val topActions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 0, 0, 16)
        }

        val btnGen60 = Button(this).apply {
            text = "+ 60m Voucher"
            setOnClickListener {
                val code = VoucherGateway.generate(minutes = 60, packageName = "1 Hour Standard", price = 1.50)
                Toast.makeText(this@ActiveVouchersActivity, "Minted voucher: $code", Toast.LENGTH_SHORT).show()
                render()
            }
        }
        val btnGen3h = Button(this).apply {
            text = "+ 3h Voucher"
            setOnClickListener {
                val code = VoucherGateway.generate(minutes = 180, packageName = "3 Hours Pass", price = 3.50)
                Toast.makeText(this@ActiveVouchersActivity, "Minted voucher: $code", Toast.LENGTH_SHORT).show()
                render()
            }
        }
        topActions.addView(btnGen60)
        topActions.addView(btnGen3h)
        root.addView(topActions)

        // Filter tabs
        val filterRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 0, 0, 16)
        }
        listOf("ALL", "ACTIVE", "UNUSED", "EXPIRED").forEach { mode ->
            filterRow.addView(Button(this).apply {
                text = mode
                textSize = 11f
                setOnClickListener {
                    filterMode = mode
                    render()
                }
            })
        }
        root.addView(filterRow)

        // Scrollable list container
        val scroll = NestedScrollView(this)
        container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        scroll.addView(container)
        root.addView(scroll)

        setContentView(root)
    }

    override fun onResume() {
        super.onResume()
        handler.post(ticker)
    }

    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(ticker)
    }

    private fun render() {
        container.removeAllViews()
        val allVouchers = VoucherGateway.allVouchers()

        val filtered = allVouchers.entries.filter { (_, info) ->
            when (filterMode) {
                "ACTIVE" -> info.status() == "ACTIVE"
                "UNUSED" -> info.status() == "UNUSED"
                "EXPIRED" -> info.status() == "EXPIRED" || info.status() == "REVOKED"
                else -> true
            }
        }.sortedByDescending { it.value.createdAt }

        if (filtered.isEmpty()) {
            container.addView(TextView(this).apply {
                text = if (allVouchers.isEmpty()) "No vouchers created yet. Tap buttons above to mint." else "No vouchers match filter: $filterMode"
                setPadding(0, 24, 0, 24)
            })
            return
        }

        filtered.forEach { (code, info) ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(16, 16, 16, 16)
                setBackgroundResource(android.R.drawable.dialog_holo_light_frame)
            }

            // Code and status header
            val header = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            header.addView(TextView(this).apply {
                text = "Code: $code"
                textSize = 18f
                setTypeface(null, android.graphics.Typeface.BOLD)
            })
            val statusColor = when (info.status()) {
                "ACTIVE" -> android.graphics.Color.parseColor("#2e7d32")
                "UNUSED" -> android.graphics.Color.parseColor("#1565c0")
                "EXPIRED" -> android.graphics.Color.parseColor("#757575")
                else -> android.graphics.Color.parseColor("#c62828")
            }
            header.addView(TextView(this).apply {
                text = "  [${info.status()}]"
                textSize = 14f
                setTextColor(statusColor)
                setTypeface(null, android.graphics.Typeface.BOLD)
            })
            card.addView(header)

            // Remaining Time & Plan details
            val clientDetail = if (info.clientIp != null) " • Client: ${info.clientIp}" else ""
            val detailsText = "Plan: ${info.packageName} ($${"%.2f".format(info.price)})\n" +
                    "Time Remaining: ${info.formatRemaining()}$clientDetail"

            card.addView(TextView(this).apply {
                text = detailsText
                textSize = 13f
                setPadding(0, 8, 0, 8)
            })

            // Actions row
            val btnRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            btnRow.addView(Button(this).apply {
                text = "Copy"
                textSize = 11f
                setOnClickListener {
                    val clip = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clip.setPrimaryClip(ClipData.newPlainText("Voucher", code))
                    Toast.makeText(this@ActiveVouchersActivity, "Copied $code", Toast.LENGTH_SHORT).show()
                }
            })

            if (info.status() == "ACTIVE") {
                btnRow.addView(Button(this).apply {
                    text = "+30m"
                    textSize = 11f
                    setOnClickListener {
                        VoucherGateway.extend(code, 30)
                        Toast.makeText(this@ActiveVouchersActivity, "Added 30 mins to $code", Toast.LENGTH_SHORT).show()
                        render()
                    }
                })
                btnRow.addView(Button(this).apply {
                    text = "Revoke"
                    textSize = 11f
                    setOnClickListener {
                        VoucherGateway.revoke(code)
                        Toast.makeText(this@ActiveVouchersActivity, "Revoked $code", Toast.LENGTH_SHORT).show()
                        render()
                    }
                })
            }

            card.addView(btnRow)
            container.addView(card)
        }
    }
}
