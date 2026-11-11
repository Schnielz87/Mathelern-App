package de.tia.mathequest

import android.util.Base64
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/** Gemeinsamer Abruf vom Weiterleitungsdienst (ntfy.sh); entschluesselt wird nur hier auf dem Geraet. */
object Relay {
    private val TOPIC = Regex("tmq-[a-z0-9]{10,40}")

    /** Alle lesbaren Nachrichten eines Kanals (AES-GCM, Schluessel aus dem QR-Code). */
    fun fetchAll(topic: String, key: String): List<JSONObject> {
        if (!topic.matches(TOPIC)) return emptyList()
        val conn = URL("https://ntfy.sh/$topic/json?poll=1&since=all").openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 20000
        try {
            if (conn.responseCode != 200) return emptyList()
            val out = mutableListOf<JSONObject>()
            conn.inputStream.bufferedReader().forEachLine { line ->
                val m = runCatching { JSONObject(line) }.getOrNull() ?: return@forEachLine
                if (m.optString("event") != "message") return@forEachLine
                decrypt(key, m.optString("message"))?.let { out += it }
            }
            return out
        } finally {
            conn.disconnect()
        }
    }

    fun decrypt(key: String, text: String): JSONObject? {
        if (!text.startsWith("tmq1:")) return null
        return runCatching {
            val flags = Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
            val data = Base64.decode(text.substring(5), flags)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(Base64.decode(key, flags), "AES"), GCMParameterSpec(128, data, 0, 12))
            JSONObject(String(cipher.doFinal(data, 12, data.size - 12), Charsets.UTF_8))
        }.getOrNull()
    }
}
