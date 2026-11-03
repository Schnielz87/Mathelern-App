package de.tia.mathequest.ai

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject

/** Ein Eintrag im Gespraech. */
data class AiMessage(val fromUser: Boolean, val text: String)
data class AiModel(val id: String, val name: String)

/**
 * Zugang zu den KI-Anbietern (aus der Englisch-App uebernommen). Alle Verbindungen gehen per HTTPS
 * direkt vom Geraet zum Anbieter. Schluessel/Tokens liegen verschluesselt im Android Keystore.
 */
class AiClient(private val store: SecureStore, private val http: OkHttpClient, val chatGpt: ChatGptAuth) {
    private val jsonType = "application/json".toMediaType()
    private val providers = listOf("CHATGPT", "GEMINI", "OPENAI", "ANTHROPIC")

    val provider: String get() = store.getPlain("provider")?.takeIf { it in providers } ?: "NONE"
    fun model(p: String = provider): String? = store.getPlain("model_$p")
    fun hasKey(p: String) = !store.get("key_$p").isNullOrBlank()

    fun setProvider(p: String) = store.putPlain("provider", if (p in providers) p else "NONE")
    fun setKey(p: String, key: String) = store.put("key_$p", key.trim().ifBlank { null })
    fun setModel(p: String, m: String) = store.putPlain("model_$p", m)

    fun ready(): Boolean {
        val p = provider
        val auth = when (p) {
            "NONE" -> false
            "CHATGPT" -> chatGpt.phase == ChatGptAuth.Phase.SIGNED_IN
            else -> hasKey(p)
        }
        return auth && model(p) != null
    }

    fun stateJson(): String = JSONObject()
        .put("provider", provider).put("model", model() ?: JSONObject.NULL).put("ready", ready())
        .put("hasKey", provider != "NONE" && provider != "CHATGPT" && hasKey(provider))
        .put("chatgpt", when (chatGpt.phase) {
            ChatGptAuth.Phase.SIGNED_IN -> "signedIn"; ChatGptAuth.Phase.IN_PROGRESS -> "inProgress"
            ChatGptAuth.Phase.ERROR -> "error"; else -> "signedOut"
        })
        .put("email", chatGpt.email).put("error", chatGpt.error).toString()

    private fun key(p: String) = store.get("key_$p") ?: throw AiException("Kein API-Schlüssel hinterlegt.")

    // ---------------- Modelle ----------------
    suspend fun listModels(p: String): List<AiModel> = when (p) {
        "CHATGPT" -> get("https://api.openai.com/v1/models", "Authorization" to "Bearer ${chatGpt.accessToken()}") { o ->
            val arr = o.optJSONArray("models") ?: o.optJSONArray("data") ?: JSONArray()
            objs(arr).filter { it.optString("visibility").let { v -> v.isBlank() || v == "list" } }
                .mapNotNull { m -> (m.optString("slug").ifBlank { m.optString("id") }).takeIf { it.isNotBlank() }?.let { AiModel(it, m.optString("display_name").ifBlank { it }) } }
        }
        "OPENAI" -> get("https://api.openai.com/v1/models", "Authorization" to "Bearer ${key(p)}") { o ->
            val skip = Regex("audio|realtime|tts|transcribe|image|search|embedding|moderation|instruct|codex|dall|whisper|davinci|babbage")
            objs(o.getJSONArray("data")).map { it.getString("id") }.filter { it.startsWith("gpt-") && !skip.containsMatchIn(it) }
                .sortedDescending().map { AiModel(it, it) }
        }
        "ANTHROPIC" -> get("https://api.anthropic.com/v1/models?limit=50", "x-api-key" to key(p), "anthropic-version" to "2023-06-01") { o ->
            objs(o.getJSONArray("data")).map { AiModel(it.getString("id"), it.optString("display_name").ifBlank { it.getString("id") }) }
        }
        "GEMINI" -> get("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", "x-goog-api-key" to key(p)) { o ->
            objs(o.getJSONArray("models")).filter { m ->
                val g = m.optJSONArray("supportedGenerationMethods") ?: JSONArray()
                (0 until g.length()).any { g.optString(it) == "generateContent" }
            }.map { AiModel(it.getString("name").removePrefix("models/"), it.optString("displayName").ifBlank { it.getString("name") }) }
                .filter { it.id.startsWith("gemini") && !Regex("embedding|image|tts|audio").containsMatchIn(it.id) }
                .sortedWith(compareByDescending<AiModel> { "flash" in it.id }.thenByDescending { it.id })
        }
        else -> emptyList()
    }

    // ---------------- Antworten ----------------
    suspend fun reply(instructions: String, history: List<AiMessage>, onDelta: (String) -> Unit): String {
        val p = provider
        val m = model(p) ?: throw AiException("Bitte zuerst ein KI-Modell auswählen.")
        val text = when (p) {
            "CHATGPT" -> responsesStream(chatGpt.accessToken(), m, instructions, history, onDelta)
            "OPENAI" -> responsesStream(key(p), m, instructions, history, onDelta)
            "ANTHROPIC" -> anthropic(m, instructions, history)
            "GEMINI" -> gemini(m, instructions, history)
            else -> throw AiException("Keine KI eingerichtet.")
        }
        if (p == "ANTHROPIC" || p == "GEMINI") onDelta(text)
        return text
    }

    /** OpenAI Responses API mit Streaming (Pflicht fuer die ChatGPT-Abo-Nutzung: store=false, stream=true). */
    private fun responsesStream(token: String, model: String, instructions: String, history: List<AiMessage>, onDelta: (String) -> Unit): String {
        val input = JSONArray()
        history.forEach { input.put(JSONObject().put("role", if (it.fromUser) "user" else "assistant").put("content", it.text)) }
        val body = JSONObject().put("model", model).put("instructions", instructions).put("input", input).put("store", false).put("stream", true)
        val req = Request.Builder().url("https://api.openai.com/v1/responses")
            .header("Authorization", "Bearer $token").header("Accept", "text/event-stream")
            .post(body.toString().toRequestBody(jsonType)).build()
        http.newCall(req).execute().use { r ->
            if (!r.isSuccessful) throw AiException(errorMessage(r))
            val out = StringBuilder()
            var completed = false
            val source = r.body.source()
            while (!source.exhausted()) {
                val line = source.readUtf8Line() ?: break
                if (!line.startsWith("data:")) continue
                val data = line.removePrefix("data:").trim()
                if (data == "[DONE]") break
                val ev = runCatching { JSONObject(data) }.getOrNull() ?: continue
                when (ev.optString("type")) {
                    "response.output_text.delta" -> { out.append(ev.optString("delta")); onDelta(out.toString()) }
                    "response.completed", "response.incomplete" -> completed = true
                    "response.failed", "error" -> {
                        val code = ev.optJSONObject("response")?.optJSONObject("error")?.optString("code")?.takeIf { it.isNotBlank() }
                            ?: ev.optString("code").ifBlank { "unbekannt" }
                        throw AiException(
                            when (code) {
                                "subscription_sharing_usage_limit_exceeded" -> "Dein ChatGPT-Nutzungslimit ist erreicht. Versuche es später erneut."
                                "subscription_sharing_usage_unavailable" -> "Die Abo-Nutzung ist für dein Konto gerade nicht verfügbar."
                                else -> "Die KI konnte nicht antworten ($code)."
                            }
                        )
                    }
                }
            }
            if (!completed && out.isEmpty()) throw AiException("Die Verbindung wurde unterbrochen.")
            return out.toString()
        }
    }

    private fun anthropic(model: String, instructions: String, history: List<AiMessage>): String {
        val msgs = JSONArray()
        normalized(history).forEach { msgs.put(JSONObject().put("role", if (it.fromUser) "user" else "assistant").put("content", it.text)) }
        val body = JSONObject().put("model", model).put("max_tokens", 1500).put("system", instructions).put("messages", msgs)
        val req = Request.Builder().url("https://api.anthropic.com/v1/messages")
            .header("x-api-key", key("ANTHROPIC")).header("anthropic-version", "2023-06-01")
            .post(body.toString().toRequestBody(jsonType)).build()
        return http.newCall(req).execute().use { r ->
            if (!r.isSuccessful) throw AiException(errorMessage(r))
            objs(JSONObject(r.body.string()).getJSONArray("content")).joinToString("") { it.optString("text") }
        }
    }

    private fun gemini(model: String, instructions: String, history: List<AiMessage>): String {
        val contents = JSONArray()
        normalized(history).forEach {
            contents.put(JSONObject().put("role", if (it.fromUser) "user" else "model").put("parts", JSONArray().put(JSONObject().put("text", it.text))))
        }
        val body = JSONObject()
            .put("systemInstruction", JSONObject().put("parts", JSONArray().put(JSONObject().put("text", instructions))))
            .put("contents", contents)
        val req = Request.Builder().url("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent")
            .header("x-goog-api-key", key("GEMINI")).post(body.toString().toRequestBody(jsonType)).build()
        return http.newCall(req).execute().use { r ->
            if (!r.isSuccessful) throw AiException(errorMessage(r))
            val parts = JSONObject(r.body.string()).optJSONArray("candidates")?.optJSONObject(0)?.optJSONObject("content")?.optJSONArray("parts")
            parts?.let { objs(it).joinToString("") { p -> p.optString("text") } }?.takeIf { it.isNotBlank() }
                ?: throw AiException("Die KI hat keine Antwort geliefert.")
        }
    }

    private fun normalized(history: List<AiMessage>): List<AiMessage> {
        val out = mutableListOf<AiMessage>()
        history.forEach { m ->
            if (out.isEmpty() && !m.fromUser) out += AiMessage(true, "(Start)")
            if (out.isNotEmpty() && out.last().fromUser == m.fromUser) out[out.lastIndex] = AiMessage(m.fromUser, out.last().text + "\n\n" + m.text)
            else out += m
        }
        return out
    }

    private fun <T> get(url: String, vararg headers: Pair<String, String>, parse: (JSONObject) -> T): T {
        val req = Request.Builder().url(url).apply { headers.forEach { (k, v) -> header(k, v) } }.build()
        return http.newCall(req).execute().use { r ->
            if (!r.isSuccessful) throw AiException(errorMessage(r))
            parse(JSONObject(r.body.string()))
        }
    }

    private fun objs(a: JSONArray): List<JSONObject> = (0 until a.length()).mapNotNull { a.optJSONObject(it) }

    private fun errorMessage(r: Response): String = when (r.code) {
        401, 403 -> "Zugang abgelehnt – bitte Schlüssel bzw. Anmeldung prüfen."
        404 -> "Modell nicht gefunden – bitte ein anderes Modell wählen."
        429 -> "Zu viele Anfragen oder Kontingent erschöpft. Bitte später erneut versuchen."
        in 500..599 -> "Der KI-Dienst ist gerade nicht erreichbar."
        else -> "KI-Anfrage fehlgeschlagen (Fehler ${r.code})."
    }
}
