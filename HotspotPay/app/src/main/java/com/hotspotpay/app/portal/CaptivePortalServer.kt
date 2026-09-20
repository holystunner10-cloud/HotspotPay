package com.hotspotpay.app.portal

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import com.hotspotpay.app.SettingsStore
import com.hotspotpay.app.payment.PaymentMethod
import com.hotspotpay.app.payment.PaymentRouter
import com.hotspotpay.app.payment.PendingPaymentRegistry
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking

/**
 * Local web server that connected hotspot clients are routed to.
 *
 * How devices land here:
 * Phones/laptops that join a WiFi network automatically fire an HTTP request to a
 * well-known "connectivity check" URL (e.g. Android hits connectivitycheck.gstatic.com,
 * Apple hits captive.apple.com/hotspot-detect.html). If our server answers those
 * with anything other than the expected "204 No Content" / "Success" response, the OS
 * concludes it's behind a captive portal and automatically pops up this login page
 * to the user — exactly the experience you get on airport/hotel WiFi.
 *
 * We intercept:
 *  - the OS captive-portal probe URLs -> always answer in a way that triggers the portal UI
 *  - everything else -> if the client has paid, we can't literally forward the traffic
 *    without root/iptables, so this MVP instead shows an "you're connected" page and
 *    relies on the OS captive-portal browser being the gate. See README for the full
 *    picture and what changes once you move to a rooted device or dedicated router.
 */
class CaptivePortalServer(
    private val context: Context,
    port: Int = 8080,
    private val onPaymentResult: (clientIp: String, success: Boolean, method: PaymentMethod) -> Unit
) : NanoHTTPD(port) {

    private val paymentRouter = PaymentRouter()

    override fun serve(session: IHTTPSession): Response {
        val clientIp = session.headers["http-client-ip"] ?: session.remoteIpAddress
        val uri = session.uri

        return when {
            isCaptivePortalProbe(uri) -> {
                if (ClientAccessRegistry.hasAccess(clientIp)) {
                    // Let the OS know everything's fine so it stops showing the portal
                    newFixedLengthResponse(Response.Status.NO_CONTENT, "text/plain", "")
                } else {
                    redirectToLoginPage()
                }
            }

            uri == "/login" -> serveLoginPage()

            uri == "/pay" && session.method == Method.POST -> handlePayment(session, clientIp)

            else -> {
                if (ClientAccessRegistry.hasAccess(clientIp)) {
                    newFixedLengthResponse(Response.Status.OK, "text/plain", "Connected. You're online.")
                } else {
                    redirectToLoginPage()
                }
            }
        }
    }

    private fun isCaptivePortalProbe(uri: String): Boolean {
        val probePaths = listOf(
            "/generate_204",          // Android
            "/gen_204",
            "/hotspot-detect.html",   // Apple
            "/library/test/success.html",
            "/connecttest.txt",       // Windows
            "/ncsi.txt"
        )
        return probePaths.any { uri.contains(it) }
    }

    private fun redirectToLoginPage(): Response {
        val res = newFixedLengthResponse(Response.Status.REDIRECT, "text/plain", "")
        res.addHeader("Location", "http://192.168.43.1:8080/login")
        return res
    }

    private fun serveLoginPage(): Response {
        val packages = SettingsStore.getPackages(context)
        val packageOptions = packages.joinToString("\n") { pkg ->
            val dataLabel = if (pkg.dataLimitMb > 0) ", ${pkg.dataLimitMb}MB" else ""
            """<option value="${pkg.minutes}">${pkg.name} — $${"%.2f".format(pkg.price)}$dataLabel</option>"""
        }
        val mmNumber = SettingsStore.getMobileMoneyNumber(context)
        val mmInstruction = if (mmNumber.isNotBlank())
            "Send payment to <b>$mmNumber</b>, then enter the reference/confirmation code you received below."
        else
            "Ask the hotspot owner for their mobile money number."

        val html = """
            <html><head><title>Connect to WiFi</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body{font-family:sans-serif;padding:24px;max-width:420px;margin:auto}
              button{width:100%;padding:14px;margin:8px 0;border:none;border-radius:8px;font-size:16px}
              .mm{background:#2ecc71;color:#fff}
              .card{background:#3498db;color:#fff}
              .voucher{background:#8e44ad;color:#fff}
              input,select{width:100%;padding:12px;margin:6px 0;box-sizing:border-box}
              small{color:#666}
            </style></head>
            <body>
              <h2>Get Online</h2>
              <p>Choose a package, then how you'd like to pay.</p>

              <form method="POST" action="/pay">
                <input type="hidden" name="method" value="MOBILE_MONEY">
                <select name="minutes">$packageOptions</select>
                <p><small>$mmInstruction</small></p>
                <input type="tel" name="phone" placeholder="Your phone number" required>
                <input type="text" name="reference" placeholder="Payment reference/confirmation code" required>
                <button class="mm" type="submit">Submit Mobile Money Payment</button>
              </form>

              <form method="POST" action="/pay">
                <input type="hidden" name="method" value="CARD">
                <select name="minutes">$packageOptions</select>
                <button class="card" type="submit">Pay with Card</button>
              </form>

              <form method="POST" action="/pay">
                <input type="hidden" name="method" value="VOUCHER">
                <input type="text" name="code" placeholder="Voucher code" required>
                <button class="voucher" type="submit">Redeem Voucher</button>
              </form>
            </body></html>
        """.trimIndent()
        return newFixedLengthResponse(Response.Status.OK, "text/html", html)
    }

    private fun handlePayment(session: IHTTPSession, clientIp: String): Response {
        val params = HashMap<String, String>()
        session.parseBody(HashMap())
        session.parameters.forEach { (k, v) -> params[k] = v.firstOrNull() ?: "" }
        params["clientIp"] = clientIp

        val method = PaymentMethod.valueOf(params["method"] ?: "VOUCHER")

        if (method == PaymentMethod.MOBILE_MONEY) {
            val minutes = params["minutes"]?.toIntOrNull() ?: 60
            val pkg = SettingsStore.getPackages(context).find { it.minutes == minutes }
            val amountLabel = pkg?.let { "$${"%.2f".format(it.price)} (${it.name})" } ?: "unknown package"
            PendingPaymentRegistry.submit(
                clientIp = clientIp,
                phone = params["phone"] ?: "",
                reference = params["reference"] ?: "",
                minutes = minutes,
                amountLabel = amountLabel
            )
            onPaymentResult(clientIp, false, method) // not granted yet — awaiting owner approval
            val html = """
                <html><body><h2>Payment submitted</h2>
                <p>The hotspot owner will confirm your payment shortly. Refresh this page in a
                minute — once approved, you'll be connected automatically.</p></body></html>
            """.trimIndent()
            return newFixedLengthResponse(Response.Status.OK, "text/html", html)
        }

        val result = runBlocking(Dispatchers.IO) {
            paymentRouter.charge(method, params)
        }

        if (result.success) {
            ClientAccessRegistry.grantAccess(clientIp, durationMillis = result.durationMillis)
        }
        onPaymentResult(clientIp, result.success, method)

        val html = if (result.success) {
            "<html><body><h2>You're connected!</h2><p>Enjoy your internet access.</p></body></html>"
        } else {
            "<html><body><h2>Payment failed</h2><p>${result.message}</p><a href=\"/login\">Try again</a></body></html>"
        }
        return newFixedLengthResponse(Response.Status.OK, "text/html", html)
    }
}
