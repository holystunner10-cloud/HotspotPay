package com.hotspotpay.app

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.hotspotpay.app.payment.VoucherGateway

class HotspotSettingsActivity : AppCompatActivity() {

    private lateinit var packagesContainer: LinearLayout
    private lateinit var packages: MutableList<VoucherPackage>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_hotspot_settings)

        val etMmNumber = findViewById<EditText>(R.id.etMmNumber)
        val etBlockedSites = findViewById<EditText>(R.id.etBlockedSites)
        packagesContainer = findViewById(R.id.packagesContainer)

        etMmNumber.setText(SettingsStore.getMobileMoneyNumber(this))
        etBlockedSites.setText(SettingsStore.getBlockedSites(this))
        packages = SettingsStore.getPackages(this).toMutableList()
        renderPackages()

        findViewById<Button>(R.id.btnSavePayment).setOnClickListener {
            SettingsStore.saveMobileMoneyNumber(this, etMmNumber.text.toString().trim())
            SettingsStore.saveBlockedSites(this, etBlockedSites.text.toString().trim())
            Toast.makeText(this, "Saved.", Toast.LENGTH_SHORT).show()
        }

        findViewById<Button>(R.id.btnAddPackage).setOnClickListener {
            packages.add(VoucherPackage("New package", 60, 1.00))
            SettingsStore.savePackages(this, packages)
            renderPackages()
        }
    }

    private fun renderPackages() {
        packagesContainer.removeAllViews()
        packages.forEachIndexed { index, pkg ->
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }

            val nameField = EditText(this).apply {
                setText(pkg.name)
                hint = "Name"
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 2f)
            }
            val minutesField = EditText(this).apply {
                setText(pkg.minutes.toString())
                hint = "Minutes"
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val priceField = EditText(this).apply {
                setText(pkg.price.toString())
                hint = "Price"
                inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val dataField = EditText(this).apply {
                setText(if (pkg.dataLimitMb > 0) pkg.dataLimitMb.toString() else "")
                hint = "MB (label only)"
                inputType = android.text.InputType.TYPE_CLASS_NUMBER
                layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            }
            val genBtn = Button(this).apply {
                text = "Generate"
                setOnClickListener {
                    val name = nameField.text.toString()
                    val minutes = minutesField.text.toString().toIntOrNull() ?: pkg.minutes
                    val price = priceField.text.toString().toDoubleOrNull() ?: pkg.price
                    val dataLimitMb = dataField.text.toString().toIntOrNull() ?: 0
                    packages[index] = VoucherPackage(name, minutes, price, dataLimitMb)
                    SettingsStore.savePackages(this@HotspotSettingsActivity, packages)
                    val code = VoucherGateway.generate(minutes, name, price)
                    Toast.makeText(
                        this@HotspotSettingsActivity,
                        "Voucher: $code ($name, \$$price)",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            row.addView(nameField)
            row.addView(minutesField)
            row.addView(priceField)
            row.addView(dataField)
            row.addView(genBtn)
            packagesContainer.addView(row)
        }
    }
}
