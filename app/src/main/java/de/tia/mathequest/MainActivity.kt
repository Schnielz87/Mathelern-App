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
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import de.tia.mathequest.ai.AiMessage
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/**
 * Die App zeigt die Lern-App (Ordner web/, identisch mit der Web-App fuers iPhone)
 * in einer WebView. Alles laeuft offline; Fortschritt bleibt auf dem Geraet.
 */
class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private val tia get() = application as TiaApp
    private val updater get() = tia.updater
    private var pendingCamera: PermissionRequest? = null

    private val notifPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }
    private val cameraPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val req = pendingCamera ?: return@registerForActivityResult
        pendingCamera = null
        if (granted) req.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) else req.deny()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        // WebView in einen Rahmen setzen: Abstaende am Rahmen werden zuverlaessig beachtet
        // (Padding direkt an der WebView ignoriert sie bei festen Elementen wie den Knoepfen unten).
        val frame = FrameLayout(this).apply { setBackgroundColor(0xFF2B1055.toInt()) }
        frame.addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(frame)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= 28) {
            window.attributes = window.attributes.apply {
                layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            }
        }
        enterFullscreen()

        // Nur Kamera-Ausschnitt, Tastatur und ggf. sichtbare Leisten freilassen
        ViewCompat.setOnApplyWindowInsetsListener(frame) { v, insets ->
            val i = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime())
            v.setPadding(i.left, i.top, i.right, i.bottom)
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
        // Kamera fuer das Scannen des Kopplungs-QR-Codes (Eltern-Ansicht)
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE !in request.resources) { request.deny(); return@runOnUiThread }
                    if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(arrayOf(PermissionRequest.RESOURCE_VIDEO_CAPTURE))
                    } else {
                        pendingCamera = request
                        cameraPermission.launch(Manifest.permission.CAMERA)
                    }
                }
            }
        }
        web.addJavascriptInterface(Bridge(), "TiaNative")

        updater.listener = { s -> js("window.onNativeUpdate && window.onNativeUpdate(${JSONObject.quote(s.toJson())})") }
        tia.tts.onDone = { id -> js("window.onNativeSpeech && window.onNativeSpeech(${JSONObject.quote(id)})") }
        tia.ai.chatGpt.onChange = { js("window.onNativeAiState && window.onNativeAiState()") }

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

    /** Rueckkehr nach "Mit ChatGPT anmelden" (tiamathe://auth-done): App kommt wieder nach vorn. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        js("window.onNativeAiState && window.onNativeAiState()")
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        updater.onResume()
        enterFullscreen()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) enterFullscreen()
    }

    /** Vollbild: Status- und Navigationsleiste ausblenden; per Wischen vom Rand kurz einblendbar. */
    private fun enterFullscreen() {
        val c = WindowCompat.getInsetsController(window, window.decorView)
        c.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        c.hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onDestroy() {
        updater.listener = null
        tia.tts.onDone = null
        tia.ai.chatGpt.onChange = null
        tia.tts.stop()
        super.onDestroy()
    }

    private fun js(code: String) {
        if (!::web.isInitialized) return
        web.post { web.evaluateJavascript(code, null) }
    }

    private fun aiCallback(id: String, o: JSONObject) =
        js("window.onNativeAi && window.onNativeAi(${JSONObject.quote(id)}, ${JSONObject.quote(o.toString())})")

    /** Schnittstelle fuer die Web-App (window.TiaNative). */
    inner class Bridge {
        // ---- Updates ----
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

        // ---- Sprache (Kikos Tafel) ----
        @JavascriptInterface fun ttsAvailable(): Boolean = tia.tts.ready
        @JavascriptInterface fun speak(text: String, id: String) = tia.tts.speak(text.take(3000), id)
        @JavascriptInterface fun stopSpeaking() = tia.tts.stop()

        // ---- KI-Tutor ----
        @JavascriptInterface fun aiState(): String = tia.ai.stateJson()
        @JavascriptInterface fun aiSetProvider(p: String) { tia.ai.setProvider(p) }
        @JavascriptInterface fun aiSetKey(p: String, key: String) { tia.ai.setKey(p, key) }
        @JavascriptInterface fun aiSetModel(p: String, m: String) { tia.ai.setModel(p, m) }
        @JavascriptInterface fun aiSignIn() = runOnUiThread { tia.ai.chatGpt.signIn() }
        @JavascriptInterface fun aiCancel() = runOnUiThread { tia.ai.chatGpt.cancel() }
        @JavascriptInterface fun aiSignOut() = runOnUiThread { tia.ai.chatGpt.signOut() }

        @JavascriptInterface fun aiModels(id: String, p: String) {
            tia.scope.launch(Dispatchers.IO) {
                try {
                    val arr = JSONArray()
                    tia.ai.listModels(p).forEach { arr.put(JSONObject().put("id", it.id).put("name", it.name)) }
                    aiCallback(id, JSONObject().put("models", arr))
                } catch (e: CancellationException) {
                    throw e
                } catch (e: java.io.IOException) {
                    aiCallback(id, JSONObject().put("error", "Keine Verbindung. Bitte Internet prüfen."))
                } catch (e: Exception) {
                    aiCallback(id, JSONObject().put("error", e.message ?: "Fehler"))
                }
            }
        }

        @JavascriptInterface fun aiAsk(id: String, instructions: String, historyJson: String) {
            tia.scope.launch(Dispatchers.IO) {
                try {
                    val arr = JSONArray(historyJson)
                    val hist = (0 until arr.length()).map { arr.getJSONObject(it) }.map { AiMessage(it.optBoolean("user"), it.optString("text")) }
                    var last = 0L
                    val text = tia.ai.reply(instructions, hist) { partial ->
                        val now = System.currentTimeMillis()
                        if (now - last > 120) { last = now; aiCallback(id, JSONObject().put("delta", partial)) }
                    }
                    aiCallback(id, JSONObject().put("text", text))
                } catch (e: CancellationException) {
                    throw e
                } catch (e: java.io.IOException) {
                    aiCallback(id, JSONObject().put("error", "Keine Verbindung zur KI. Bitte Internet prüfen."))
                } catch (e: Exception) {
                    aiCallback(id, JSONObject().put("error", e.message ?: "Die KI konnte nicht antworten."))
                }
            }
        }
    }
}
