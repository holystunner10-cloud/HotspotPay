package com.hotspotpay.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class VoucherPackage(
    val name: String,
    val minutes: Int,
    val price: Double,
    val dataLimitMb: Int = 0 // 0 = unlimited. Informational only — see README for why it can't be enforced.
)

/**
 * Simple local settings store. No backend needed — everything here lives only
 * on the owner's phone, in SharedPreferences.
 */
object SettingsStore {

    private const val PREFS = "hotspotpay_settings"
    private const val KEY_SSID = "ssid"
    private const val KEY_PASSWORD = "password"
    private const val KEY_PACKAGES = "voucher_packages"
    private const val KEY_MM_NUMBER = "mobile_money_number"
    private const val KEY_BLOCKED_SITES = "blocked_sites"

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun getSsid(context: Context): String? = prefs(context).getString(KEY_SSID, null)
    fun getPassword(context: Context): String? = prefs(context).getString(KEY_PASSWORD, null)

    fun saveNetwork(context: Context, ssid: String, password: String) {
        prefs(context).edit()
            .putString(KEY_SSID, ssid)
            .putString(KEY_PASSWORD, password)
            .apply()
    }

    fun getPackages(context: Context): List<VoucherPackage> {
        val raw = prefs(context).getString(KEY_PACKAGES, null) ?: return defaultPackages()
        return try {
            val arr = JSONArray(raw)
            (0 until arr.length()).map { i ->
                val o = arr.getJSONObject(i)
                VoucherPackage(
                    o.getString("name"),
                    o.getInt("minutes"),
                    o.getDouble("price"),
                    o.optInt("dataLimitMb", 0)
                )
            }
        } catch (e: Exception) {
            defaultPackages()
        }
    }

    fun savePackages(context: Context, packages: List<VoucherPackage>) {
        val arr = JSONArray()
        packages.forEach {
            arr.put(JSONObject().apply {
                put("name", it.name)
                put("minutes", it.minutes)
                put("price", it.price)
                put("dataLimitMb", it.dataLimitMb)
            })
        }
        prefs(context).edit().putString(KEY_PACKAGES, arr.toString()).apply()
    }

    fun getMobileMoneyNumber(context: Context): String =
        prefs(context).getString(KEY_MM_NUMBER, "") ?: ""

    fun saveMobileMoneyNumber(context: Context, number: String) {
        prefs(context).edit().putString(KEY_MM_NUMBER, number).apply()
    }

    /** Reference-only list the owner keeps for their own manual enforcement. Not actually blocked. */
    fun getBlockedSites(context: Context): String =
        prefs(context).getString(KEY_BLOCKED_SITES, "") ?: ""

    fun saveBlockedSites(context: Context, sites: String) {
        prefs(context).edit().putString(KEY_BLOCKED_SITES, sites).apply()
    }

    private fun defaultPackages() = listOf(
        VoucherPackage("30 minutes", 30, 0.50),
        VoucherPackage("1 hour", 60, 1.00),
        VoucherPackage("3 hours", 180, 2.50),
        VoucherPackage("Full day", 1440, 5.00)
    )
}
