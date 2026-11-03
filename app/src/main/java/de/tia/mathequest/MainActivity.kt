package de.tia.mathequest

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import org.json.JSONObject

/**
 * Die App zeigt die Lern-App (Ordner web/, identisch mit der Web-App fuers iPhone)
 * in einer WebView. Alles laeuft offline; Fortschritt bleibt auf dem Geraet.
 */
class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private val updater get() = (application as TiaApp).updater

    private val notifPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)

        // Platz fuer Statusleiste/Navigationsleiste lassen
        ViewCompat.setOnApplyWindowInsetsListener(web) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            textZoom = 100
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }
        web.setBackgroundColor(0xFF2B1055.toInt())
        web.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val url = request.url
                if (url.host == "appassets.androidplatform.net") return false
                // Externe Links (z. B. GitHub) im Browser oeffnen
                runCatching { startActivity(Intent(Intent.ACTION_VIEW, url)) }
                return true
            }
        }
        web.addJavascriptInterface(Bridge(), "TiaNative")

        updater.listener = { s -> sendUpdateState(s) }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        updater.onResume()
    }

    override fun onDestroy() {
        updater.listener = null
        super.onDestroy()
    }

    private fun sendUpdateState(s: Updater.State) {
        val js = "window.onNativeUpdate && window.onNativeUpdate(${JSONObject.quote(s.toJson())})"
        web.post { web.evaluateJavascript(js, null) }
    }

    /** Schnittstelle fuer die Web-App (window.TiaNative). */
    inner class Bridge {
        @JavascriptInterface fun version(): String = updater.currentVersion
        @JavascriptInterface fun checkUpdate(manual: Boolean) = updater.check(manual)
        @JavascriptInterface fun updateState(): String = updater.state.toJson()
        @JavascriptInterface fun installUpdate() = runOnUiThread { updater.install() }
        @JavascriptInterface fun openInstallSettings() = runOnUiThread { updater.openInstallPermissionSettings(this@MainActivity) }
        @JavascriptInterface fun openUrl(url: String) = runOnUiThread {
            if (url.startsWith("https://")) runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
        }
        @JavascriptInterface fun vibrate(ms: Int) {
            val v = getSystemService(Vibrator::class.java) ?: return
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(ms.toLong().coerceIn(10, 400), VibrationEffect.DEFAULT_AMPLITUDE))
            else @Suppress("DEPRECATION") v.vibrate(ms.toLong())
        }
    }
}
