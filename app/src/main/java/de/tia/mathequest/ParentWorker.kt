package de.tia.mathequest

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.util.Calendar
import java.util.concurrent.TimeUnit

/**
 * Eltern-Benachrichtigungen: schaut alle 3 Stunden nach dem verschluesselten Lernstand der gekoppelten Kinder
 * (Entschluesselung nur hier auf dem Geraet) und meldet: heute geuebt, Boss besiegt, oder 3 Tage Pause.
 */
class ParentWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    override fun doWork(): Result {
        val app = applicationContext as TiaApp
        val cfg = app.store.get(KEY_LINKS)?.let { runCatching { JSONObject(it) }.getOrNull() } ?: return Result.success()
        if (!cfg.optBoolean("notify", true)) return Result.success()
        val kids = cfg.optJSONArray("kids") ?: return Result.success()
        val prefs = applicationContext.getSharedPreferences("parent_notify", Context.MODE_PRIVATE)
        for (i in 0 until kids.length()) {
            val k = kids.optJSONObject(i) ?: continue
            val topic = k.optString("topic").takeIf { it.matches(Regex("tmq-[a-z0-9]{10,40}")) } ?: continue
            val key = k.optString("key")
            val snap = try { latestSnap(topic, key) } catch (e: Exception) { null }
            val p = "k_$topic"
            val name = snap?.optString("name")?.ifBlank { null } ?: k.optString("name").ifBlank { "Dein Kind" }
            if (snap != null) {
                val at = snap.optLong("at")
                val lastActive = snap.optLong("lastActive")
                val today = snap.optJSONObject("today")
                val n = today?.optInt("n") ?: 0
                val ok = today?.optInt("ok") ?: 0
                val bosses = countBosses(snap)
                prefs.edit().putLong("${p}_active", maxOf(lastActive, prefs.getLong("${p}_active", 0))).apply()
                if (at > prefs.getLong("${p}_at", 0)) {
                    val day = dayStamp(at)
                    val lastDay = prefs.getLong("${p}_day", 0)
                    val lastN = if (lastDay == day) prefs.getInt("${p}_n", 0) else 0
                    if (bosses > prefs.getInt("${p}_boss", bosses)) {
                        notify(topic.hashCode() + 1, "👑 $name hat einen Boss besiegt!", "Frag doch mal, wie der Kampf war 😉")
                    } else if (dayStamp(lastActive) == dayStamp(System.currentTimeMillis()) && n > lastN && n >= 5) {
                        val pct = if (n > 0) ok * 100 / n else 0
                        notify(topic.hashCode(), "💪 $name hat heute geübt", "$n Aufgaben gelöst ($pct % richtig). Ein Lob motiviert!")
                    }
                    prefs.edit().putLong("${p}_at", at).putLong("${p}_day", day).putInt("${p}_n", n).putInt("${p}_boss", bosses).apply()
                }
            }
            // Pause: 3 Tage nichts geuebt – einmal pro Pause melden
            val active = prefs.getLong("${p}_active", 0)
            if (active > 0) {
                val pauseDays = ((System.currentTimeMillis() - active) / 86_400_000L).toInt()
                if (pauseDays >= 3 && prefs.getLong("${p}_pause", 0) != active) {
                    notify(topic.hashCode() + 2, "⏰ $name hat seit $pauseDays Tagen nicht geübt", "Ein kurzer Anstoß hilft – 10 Minuten am Tag reichen.")
                    prefs.edit().putLong("${p}_pause", active).apply()
                }
            }
        }
        return Result.success()
    }

    private fun countBosses(snap: JSONObject): Int {
        val t = snap.optJSONObject("topics") ?: return 0
        var c = 0
        t.keys().forEach { id -> if (t.optJSONArray(id)?.optInt(5) == 1) c++ }
        return c
    }

    private fun dayStamp(ts: Long): Long {
        val c = Calendar.getInstance().apply { timeInMillis = ts; set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }
        return c.timeInMillis
    }

    /** Neuesten Lernstand holen (entschluesselt auf dem Geraet). */
    private fun latestSnap(topic: String, key: String): JSONObject? =
        Relay.fetchAll(topic, key).filter { it.optString("type") == "snap" }.maxByOrNull { it.optLong("at") }

    private fun notify(id: Int, title: String, text: String) {
        val ctx = applicationContext
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        val nm = ctx.getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel(CHANNEL, "Eltern-Hinweise", NotificationManager.IMPORTANCE_DEFAULT))
        val pi = PendingIntent.getActivity(ctx, 2, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(ctx).notify(id, n)
    }

    companion object {
        const val KEY_LINKS = "parent_links"
        private const val WORK = "parent_check"
        private const val CHANNEL = "parent"

        /** Kopplungen speichern (verschluesselt) und Hintergrund-Pruefung ein- oder ausschalten. */
        fun configure(context: Context, json: String) {
            val app = context.applicationContext as TiaApp
            app.store.put(KEY_LINKS, json)
            val o = runCatching { JSONObject(json) }.getOrNull()
            val active = o != null && o.optBoolean("notify", true) && (o.optJSONArray("kids")?.length() ?: 0) > 0
            val wm = WorkManager.getInstance(context)
            if (!active) { wm.cancelUniqueWork(WORK); return }
            val req = PeriodicWorkRequest.Builder(ParentWorker::class.java, 3, TimeUnit.HOURS)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            wm.enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.KEEP, req)
        }
    }
}
