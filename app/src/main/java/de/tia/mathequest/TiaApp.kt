package de.tia.mathequest

import android.app.Application
import de.tia.mathequest.ai.AiClient
import de.tia.mathequest.ai.ChatGptAuth
import de.tia.mathequest.ai.SecureStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

class TiaApp : Application() {
    lateinit var updater: Updater
        private set
    lateinit var ai: AiClient
        private set
    lateinit var tts: Speech
        private set
    val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        updater = Updater(this)
        val http = OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .build()
        val store = SecureStore(this)
        ai = AiClient(store, http, ChatGptAuth(this, store, http, scope))
        tts = Speech(this)
        // Alle 24 Stunden im Hintergrund nach einer neuen Version schauen.
        UpdateWorker.schedule(this)
    }
}
