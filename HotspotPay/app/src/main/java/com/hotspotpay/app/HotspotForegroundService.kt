package com.hotspotpay.app

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.hotspotpay.app.payment.PaymentMethod
import com.hotspotpay.app.portal.CaptivePortalServer

/**
 * Keeps the LocalOnlyHotspot + local web server alive while the app is
 * backgrounded. LocalOnlyHotspot reservations die quickly if the process
 * is killed, so this foreground service (with a persistent notification)
 * is what makes the "paid hotspot" usable as a real standing setup.
 */
class HotspotForegroundService : Service() {

    private var server: CaptivePortalServer? = null
    private lateinit var hotspotManager: HotspotManager

    override fun onCreate() {
        super.onCreate()
        hotspotManager = HotspotManager(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIF_ID, buildNotification("Starting hotspot..."))

        hotspotManager.start(
            object : HotspotManager.Callback {
                override fun onStarted(ssid: String, password: String) {
                    startServer()
                    updateNotification("Hotspot live: $ssid")
                }

                override fun onFailed(reason: String) {
                    updateNotification("Failed to start hotspot: $reason")
                    stopSelf()
                }

                override fun onStopped() {
                    stopServer()
                }
            }
        )

        return START_STICKY
    }

    private fun startServer() {
        server = CaptivePortalServer(
            context = this,
            port = 8080,
            onPaymentResult = { clientIp, success, method: PaymentMethod ->
                updateNotification(
                    if (success) "Client $clientIp paid via $method"
                    else "Client $clientIp payment failed ($method)"
                )
            }
        )
        server?.start(CaptivePortalServer.SOCKET_READ_TIMEOUT, false)
    }

    private fun stopServer() {
        server?.stop()
        server = null
    }

    override fun onDestroy() {
        stopServer()
        hotspotManager.stop()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(text: String): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "Hotspot Pay", NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("HotspotPay running")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIF_ID, buildNotification(text))
    }

    companion object {
        private const val CHANNEL_ID = "hotspotpay_channel"
        private const val NOTIF_ID = 1
    }
}
