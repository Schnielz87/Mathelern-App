package de.tia.mathequest

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

/** Sprachausgabe fuer Kikos Tafel (Android-WebView hat keine Web-Speech-Schnittstelle). */
class Speech(context: Context) {
    @Volatile var ready = false
        private set
    var onDone: ((String) -> Unit)? = null

    private val tts: TextToSpeech = TextToSpeech(context.applicationContext) { status ->
        if (status == TextToSpeech.SUCCESS) {
            val r = tts.setLanguage(Locale.GERMANY)
            ready = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED
            tts.setSpeechRate(0.95f)
            tts.setPitch(1.1f)
        }
    }

    init {
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) {}
            override fun onDone(utteranceId: String?) { utteranceId?.let { onDone?.invoke(it) } }
            @Deprecated("alt") override fun onError(utteranceId: String?) { utteranceId?.let { onDone?.invoke(it) } }
            override fun onError(utteranceId: String?, errorCode: Int) { utteranceId?.let { onDone?.invoke(it) } }
            override fun onStop(utteranceId: String?, interrupted: Boolean) { utteranceId?.let { onDone?.invoke(it) } }
        })
    }

    fun speak(text: String, id: String) {
        if (!ready) { onDone?.invoke(id); return }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id)
    }

    fun stop() { if (ready) tts.stop() }
}
