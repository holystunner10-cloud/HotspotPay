# HotspotPay

Turns your phone into a paid WiFi hotspot: guests connect, get shown a
login/payment page (mobile money, card, or voucher code), and only then
get treated as "online" by the OS captive-portal prompt.

## How it works

1. `HotspotManager` starts Android's `LocalOnlyHotspot` — an app-scoped
   WiFi hotspot (not the regular system "Portable Hotspot" toggle).
2. `CaptivePortalServer` (NanoHTTPD) runs on the phone and answers the
   standard captive-portal probe requests that every OS fires when it
   joins a new WiFi network (`/generate_204`, `/hotspot-detect.html`,
   etc.), which is what triggers the "Sign in to network" popup on the
   guest's phone.
3. The guest picks Mobile Money, Card, or Voucher on the login page.
4. `PaymentRouter` dispatches to the matching gateway in `payment/`.
5. On success, `ClientAccessRegistry` marks that client's IP as paid for
   N minutes.

## What's real vs. stubbed

- **Voucher codes**: fully working offline, no backend needed. Generate
  codes from the main screen, sell them, guests redeem them.
- **Mobile money / card**: architecture is in place, but both need a
  small backend server of yours (never put provider API secrets in the
  APK). See the `TODO`s in `MobileMoneyGateway.kt` / `CardGateway.kt`.

## The important limitation — read before you build a business on this

On a **non-rooted** phone, an app cannot actually block a connected
client's internet traffic at the network level — Android's WiFi
tethering path runs in the kernel, outside what apps can touch. This
app gets you the real *captive portal login prompt* (same UX as hotel
WiFi), but a technically savvy guest could bypass "pay first" by simply
dismissing the login popup, since nothing is physically stopping their
packets.

For a real cash-generating public hotspot where paying is actually
enforced, the standard approach is a small dedicated router (e.g.
GL.iNet, or any OpenWrt device) running **CoovaChilli** or **openNDS** —
purpose-built captive portal software with real traffic enforcement —
with this app's UI/payment flow reused as the portal page. Happy to help
wire that up if/when you're ready to move off a bare phone.

## Auto-approving mobile money payments via SMS

`SmsPaymentReceiver` listens for incoming SMS. When a guest's login-page
reference code appears anywhere in a received message (e.g. your provider's
"You received $1.00, TxID: 482910" confirmation), that guest is approved
automatically — no need to tap Approve in Pending Payments. If your
provider doesn't SMS you a confirmation, this simply never fires and the
manual Approve button remains the way to grant access.

**Important if you ever publish to Google Play:** apps requesting SMS
permissions (`RECEIVE_SMS`/`READ_SMS`) are restricted by Play Store policy
to a short list of approved use cases (default SMS handlers, verification
apps, etc.) and typically get rejected otherwise. This is fine for a debug
APK you build and install yourself via GitHub Actions, but if you later
want this on the Play Store you'd need to either request a policy
exception, drop SMS auto-approval and rely on the manual button, or move
verification to a real payment provider API instead.

## Setup

1. Open in Android Studio (Giraffe+), let Gradle sync.
2. Wire `MobileMoneyGateway` / `CardGateway` to your own backend once you
   have merchant accounts with a provider (EcoCash/M-Pesa, Stripe/PayPal).
3. Run on a physical device — hotspot APIs don't work on the emulator.
