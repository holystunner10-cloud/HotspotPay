package com.hotspotpay.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.hotspotpay.app.payment.VoucherGateway

class MainActivity : AppCompatActivity() {

    private val requiredPermissions = buildList {
        add(Manifest.permission.ACCESS_FINE_LOCATION)
        add(Manifest.permission.RECEIVE_SMS)
        if (Build.VERSION.SDK_INT >= 33) add(Manifest.permission.POST_NOTIFICATIONS)
        if (Build.VERSION.SDK_INT >= 33) add(Manifest.permission.NEARBY_WIFI_DEVICES)
    }.toTypedArray()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        if (!hasPermissions()) {
            ActivityCompat.requestPermissions(this, requiredPermissions, REQUEST_CODE_PERMISSIONS)
        }

        findViewById<Button>(R.id.btnStart).setOnClickListener {
            if (hasPermissions()) startHotspotService()
            else ActivityCompat.requestPermissions(this, requiredPermissions, REQUEST_CODE_PERMISSIONS)
        }

        findViewById<Button>(R.id.btnStop).setOnClickListener {
            stopService(Intent(this, HotspotForegroundService::class.java))
            Toast.makeText(this, "Hotspot stopped", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnGenerateVoucher).setOnClickListener {
            val code = VoucherGateway.generate(minutes = 60)
            findViewById<TextView>(R.id.tvVoucherCode).text = "New voucher (60 min): $code"
        }

        findViewById<Button>(R.id.btnViewVouchers).setOnClickListener {
            startActivity(Intent(this, ActiveVouchersActivity::class.java))
        }

        findViewById<Button>(R.id.btnSettings).setOnClickListener {
            startActivity(Intent(this, HotspotSettingsActivity::class.java))
        }

        findViewById<Button>(R.id.btnPendingPayments).setOnClickListener {
            startActivity(Intent(this, PendingPaymentsActivity::class.java))
        }
    }

    private fun hasPermissions() = requiredPermissions.all {
        ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun startHotspotService() {
        val intent = Intent(this, HotspotForegroundService::class.java)
        ContextCompat.startForegroundService(this, intent)
        Toast.makeText(this, "Starting hotspot...", Toast.LENGTH_SHORT).show()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
            Toast.makeText(this, "All set — tap Start Paid Hotspot when ready", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(
                this,
                "Some permissions were denied. You can grant them later in Settings > Apps > HotspotPay > Permissions.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 42
    }
}
