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
import java.util.concurrent.TimeUnit

/** Kinder-Handy: meldet neue Mut-Nachrichten von Mama/Papa, auch wenn die App geschlossen ist (stuendlich). */
class ChildWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    override fun doWork(): Result {
        val app = applicationContext as TiaApp
        val link = app.store.get(KEY)?.let { runCatching { JSONObject(it) }.getOrNull() } ?: return Result.success()
        val prefs = applicationContext.getSharedPreferences("child_notify", Context.MODE_PRIVATE)
        val seen = maxOf(link.optLong("seen"), prefs.getLong("notified", 0))
        val fresh = try {
            Relay.fetchAll(link.optString("topic"), link.optString("key"))
                .filter { it.optString("type") == "cheer" && it.optLong("at") > seen }
                .sortedBy { it.optLong("at") }
        } catch (e: Exception) { return Result.retry() }
        if (fresh.isEmpty()) return Result.success()
        val last = fresh.last()
        val from = last.optString("from").ifBlank { "Mama" }.take(20)
        val title = if (fresh.size > 1) "💌 ${fresh.size} neue Nachrichten von $from" else "💌 Neue Nachricht von $from"
        notify(title, last.optString("text").take(200))
        prefs.edit().putLong("notified", last.optLong("at")).apply()
        return Result.success()
    }

    private fun notify(title: String, text: String) {
        val ctx = applicationContext
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        val nm = ctx.getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(NotificationChannel(CHANNEL, "Nachrichten von Mama/Papa", NotificationManager.IMPORTANCE_HIGH))
        val pi = PendingIntent.getActivity(ctx, 3, Intent(ctx, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()
        NotificationManagerCompat.from(ctx).notify(9, n)
    }

    companion object {
        private const val KEY = "child_link"
        private const val WORK = "child_check"
        private const val CHANNEL = "cheers"

        /** Kopplung des Kindes speichern (verschluesselt) und die stuendliche Pruefung starten/stoppen. */
        fun configure(context: Context, json: String) {
            val app = context.applicationContext as TiaApp
            val wm = WorkManager.getInstance(context)
            if (json.isBlank()) { app.store.put(KEY, null); wm.cancelUniqueWork(WORK); return }
            app.store.put(KEY, json)
            val req = PeriodicWorkRequest.Builder(ChildWorker::class.java, 1, TimeUnit.HOURS)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            wm.enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.KEEP, req)
        }
    }
}
