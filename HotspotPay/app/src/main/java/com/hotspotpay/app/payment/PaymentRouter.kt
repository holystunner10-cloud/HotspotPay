package com.hotspotpay.app.payment

class PaymentRouter {

    private val mobileMoney = MobileMoneyGateway()
    private val card = CardGateway()
    private val voucher = VoucherGateway()

    suspend fun charge(method: PaymentMethod, params: Map<String, String>): PaymentResult {
        return when (method) {
            PaymentMethod.MOBILE_MONEY -> mobileMoney.charge(params["phone"] ?: "")
            PaymentMethod.CARD -> card.charge(params)
            PaymentMethod.VOUCHER -> voucher.redeem(params["code"] ?: "", params["clientIp"] ?: "")
        }
    }
}
