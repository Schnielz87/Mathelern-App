package de.tia.mathequest

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Update direkt aus der App: neue Version bei GitHub finden, APK laden,
 * ueber den Android-PackageInstaller installieren (Android fragt zur Sicherheit nach).
 * Der Lernfortschritt bleibt dabei erhalten.
 */
class Updater(private val context: Context) {

    /** Zustand fuer die Oberflaeche (wird als JSON an die Web-App gegeben). */
    data class State(
        val state: String,                 // idle, checking, available, uptodate, needsPermission, downloading, installing, error
        val version: String = "",
        val notes: String = "",
        val progress: Int = 0,
        val message: String = "",
    ) {
        fun toJson(): String = JSONObject()
            .put("state", state).put("version", version).put("notes", notes)
            .put("progress", progress).put("message", message).toString()
    }

    data class Release(val version: String, val notes: String, val apkUrl: String)

    private val io = Executors.newSingleThreadExecutor()
    private val main = Handler(Looper.getMainLooper())
    private val prefs = context.getSharedPreferences("updates", Context.MODE_PRIVATE)
    private var release: Release? = null

    @Volatile
    var state: State = State("idle")
        private set

    var listener: ((State) -> Unit)? = null

    private fun set(s: State) {
        state = s
        main.post { listener?.invoke(s) }
    }

    val currentVersion: String get() = BuildConfig.VERSION_NAME

    fun check(manual: Boolean) {
        if (state.state == "downloading" || state.state == "installing") return
        if (manual) set(State("checking"))
        io.execute {
            try {
                val r = fetchLatest()
                prefs.edit().putLong("lastCheck", System.currentTimeMillis()).apply()
                if (r != null && isNewer(r.version, currentVersion)) {
                    release = r
                    set(State("available", r.version, r.notes))
                } else if (manual) {
                    set(State("uptodate", currentVersion))
                } else if (state.state == "checking") {
                    set(State("idle"))
                }
            } catch (e: Exception) {
                if (manual) set(State("error", message = "Keine Verbindung zum Update-Server. Bitte Internet prüfen."))
            }
        }
    }

    /** Wird vom Hintergrund-Job benutzt (blockierend). */
    fun fetchLatest(): Release? {
        val conn = URL("https://api.github.com/repos/${BuildConfig.GITHUB_REPO}/releases/latest")
            .openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 20000
        conn.setRequestProperty("Accept", "application/vnd.github+json")
        conn.setRequestProperty("User-Agent", "TiasMatheQuest")
        try {
            if (conn.responseCode != 200) return null
            val json = JSONObject(conn.inputStream.bufferedReader().readText())
            val version = json.optString("tag_name").removePrefix("v")
            val assets = json.optJSONArray("assets")
            var apk = ""
            if (assets != null) for (i in 0 until assets.length()) {
                val a = assets.getJSONObject(i)
                if (a.optString("name") == BuildConfig.APK_NAME) apk = a.optString("browser_download_url")
            }
            if (version.isBlank() || apk.isBlank()) return null
            return Release(version, json.optString("body").take(600), apk)
        } finally {
            conn.disconnect()
        }
    }

    fun canInstall(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || context.packageManager.canRequestPackageInstalls()

    fun openInstallPermissionSettings(from: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            from.startActivity(
                Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))
            )
        }
    }

    /** Nach Rueckkehr aus den Einstellungen erneut pruefen. */
    fun onResume() {
        val r = release ?: return
        if (state.state == "needsPermission" && canInstall()) set(State("available", r.version, r.notes))
    }

    fun install() {
        val r = release ?: return
        if (!canInstall()) {
            set(State("needsPermission", r.version, r.notes))
            return
        }
        set(State("downloading", r.version, r.notes, 0))
        io.execute {
            try {
                val file = download(r)
                set(State("installing", r.version))
                installFile(file)
            } catch (e: Exception) {
                set(State("error", r.version, message = "Update fehlgeschlagen: ${e.message ?: "unbekannter Fehler"}. Bitte nochmal versuchen."))
            }
        }
    }

    private fun download(r: Release): File {
        val dir = File(context.cacheDir, "updates").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
        val file = File(dir, "update-${r.version}.apk")
        var url = URL(r.apkUrl)
        var conn: HttpURLConnection
        var redirects = 0
        while (true) {
            conn = url.openConnection() as HttpURLConnection
            conn.instanceFollowRedirects = false
            conn.connectTimeout = 15000
            conn.readTimeout = 60000
            conn.setRequestProperty("User-Agent", "TiasMatheQuest")
            val code = conn.responseCode
            if (code in 300..399 && redirects < 6) {
                url = URL(url, conn.getHeaderField("Location"))
                conn.disconnect()
                redirects++
                continue
            }
            if (code != 200) throw IOException("Download-Fehler $code")
            break
        }
        val total = conn.contentLengthLong
        conn.inputStream.use { input ->
            file.outputStream().use { out ->
                val buf = ByteArray(64 * 1024)
                var read = 0L
                var lastPct = -1
                while (true) {
                    val n = input.read(buf)
                    if (n < 0) break
                    out.write(buf, 0, n)
                    read += n
                    if (total > 0) {
                        val pct = (read * 100 / total).toInt()
                        if (pct != lastPct) { lastPct = pct; set(State("downloading", r.version, progress = pct)) }
                    }
                }
            }
        }
        conn.disconnect()
        if (file.length() < 100_000) throw IOException("Datei unvollständig")
        return file
    }

    private fun installFile(file: File) {
        val installer = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL).apply {
            setAppPackageName(context.packageName)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
            }
        }
        val sessionId = installer.createSession(params)
        installer.openSession(sessionId).use { session ->
            session.openWrite("update.apk", 0, file.length()).use { out ->
                file.inputStream().use { it.copyTo(out) }
                session.fsync(out)
            }
            val intent = Intent(context, UpdateReceiver::class.java).setAction(ACTION_INSTALL_STATUS)
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0)
            val pi = PendingIntent.getBroadcast(context, sessionId, intent, flags)
            session.commit(pi.intentSender)
        }
    }

    internal fun onInstallFailed(message: String) = set(State("error", message = message))
    internal fun onUserActionStarted() = set(State("installing", release?.version ?: ""))
    internal fun onUserCancelled() {
        val r = release
        set(if (r != null) State("available", r.version, r.notes) else State("idle"))
    }

    companion object {
        const val ACTION_INSTALL_STATUS = "de.tia.mathequest.INSTALL_STATUS"

        fun isNewer(remote: String, local: String): Boolean {
            val r = remote.split('.').map { it.filter(Char::isDigit).toIntOrNull() ?: 0 }
            val l = local.substringBefore('-').split('.').map { it.filter(Char::isDigit).toIntOrNull() ?: 0 }
            for (i in 0 until maxOf(r.size, l.size)) {
                val a = r.getOrElse(i) { 0 }
                val b = l.getOrElse(i) { 0 }
                if (a != b) return a > b
            }
            return false
        }
    }
}

/** Rueckmeldungen des PackageInstallers. */
class UpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val updater = (context.applicationContext as TiaApp).updater
        when (val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                @Suppress("DEPRECATION")
                val confirm = if (Build.VERSION.SDK_INT >= 33) intent.getParcelableExtra(Intent.EXTRA_INTENT, Intent::class.java)
                else intent.getParcelableExtra(Intent.EXTRA_INTENT)
                confirm?.let {
                    it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(it)
                    updater.onUserActionStarted()
                }
            }
            PackageInstaller.STATUS_SUCCESS -> {}
            PackageInstaller.STATUS_FAILURE_ABORTED -> updater.onUserCancelled()
            PackageInstaller.STATUS_FAILURE_CONFLICT, PackageInstaller.STATUS_FAILURE_INCOMPATIBLE ->
                updater.onInstallFailed("Das Update passt nicht zur installierten App. Bitte die App einmal neu installieren.")
            PackageInstaller.STATUS_FAILURE_STORAGE -> updater.onInstallFailed("Nicht genug Speicherplatz für das Update.")
            else -> updater.onInstallFailed(
                "Installation fehlgeschlagen (${intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE) ?: "Status $status"})."
            )
        }
    }
}
