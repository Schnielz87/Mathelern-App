package de.tia.mathequest.ai

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Base64
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.math.BigInteger
import java.net.InetAddress
import java.net.ServerSocket
import java.net.SocketTimeoutException
import java.net.URLDecoder
import java.security.KeyFactory
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.Signature
import java.security.spec.RSAPublicKeySpec
import java.util.UUID

/**
 * "Mit ChatGPT anmelden" nach OpenAIs Ablauf fuer Open-Source-/lokal laufende Apps
 * (developers.openai.com/siwc/token-sharing-open-source): OAuth 2.0 Authorization Code + PKCE,
 * dynamische Client-Registrierung, Rueckruf ueber 127.0.0.1 (Loopback) im Geraet.
 * Uebernommen aus der Englisch-App inkl. der dortigen Korrekturen:
 *  - Netzwerkfehler beim Token-Austausch/JWKS bis zu 2 Minuten wiederholen (Geraete sperren
 *    Internet fuer Apps im Hintergrund, solange der Browser vorne ist -> "Unable to resolve host").
 *  - CancellationException nicht als Fehler melden.
 *  - Keine Code-Verkleinerung (R8) im Release, damit nichts umbenannt wird.
 */
class ChatGptAuth(
    private val context: Context,
    private val store: SecureStore,
    private val http: OkHttpClient,
    private val scope: CoroutineScope,
) {
    enum class Phase { SIGNED_OUT, IN_PROGRESS, SIGNED_IN, ERROR }

    data class Credentials(
        val email: String, val subject: String, val clientId: String, val idToken: String,
        val accessToken: String, val refreshToken: String, val expiresAt: Long, val scopes: List<String>,
    ) {
        fun toJson(): String = JSONObject().put("email", email).put("subject", subject).put("clientId", clientId)
            .put("idToken", idToken).put("accessToken", accessToken).put("refreshToken", refreshToken)
            .put("expiresAt", expiresAt).put("scopes", JSONArray(scopes)).toString()

        companion object {
            fun from(s: String): Credentials? = runCatching {
                val o = JSONObject(s)
                val sc = o.optJSONArray("scopes") ?: JSONArray()
                Credentials(
                    o.getString("email"), o.getString("subject"), o.getString("clientId"), o.getString("idToken"),
                    o.getString("accessToken"), o.getString("refreshToken"), o.getLong("expiresAt"),
                    List(sc.length()) { sc.getString(it) },
                )
            }.getOrNull()
        }
    }

    @Volatile var phase: Phase = Phase.SIGNED_OUT; private set
    @Volatile var error: String = ""; private set
    var email: String = ""; private set
    var onChange: (() -> Unit)? = null

    private val refreshMutex = Mutex()
    private var pending: Job? = null

    init {
        credentials()?.let { phase = Phase.SIGNED_IN; email = it.email }
    }

    private fun set(p: Phase, err: String = "") { phase = p; error = err; onChange?.invoke() }
    private fun credentials(): Credentials? = store.get(KEY_CREDS)?.let { Credentials.from(it) }
    private fun save(c: Credentials) = store.put(KEY_CREDS, c.toJson())
    private fun hostId(): String = store.getPlain(KEY_HOST) ?: "urn:uuid:${UUID.randomUUID()}".also { store.putPlain(KEY_HOST, it) }

    fun signIn() {
        pending?.cancel()
        set(Phase.IN_PROGRESS)
        pending = scope.launch(Dispatchers.IO) {
            try {
                val c = runFlow()
                email = c.email
                set(Phase.SIGNED_IN)
            } catch (e: CancellationException) {
                throw e
            } catch (e: IOException) {
                set(Phase.ERROR, "Keine Verbindung zu OpenAI. Bitte Internet prüfen und erneut versuchen.")
            } catch (e: Exception) {
                set(Phase.ERROR, e.message ?: "Anmeldung fehlgeschlagen")
            }
        }
    }

    fun cancel() {
        pending?.cancel()
        credentials()?.let { email = it.email; set(Phase.SIGNED_IN) } ?: set(Phase.SIGNED_OUT)
    }

    private suspend fun runFlow(): Credentials {
        val savedClient = store.getPlain(KEY_CLIENT)
        val previous = credentials()
        val state = random(24)
        val nonce = random(24)
        val verifier = random(48)
        val challenge = b64url(MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray()))

        openServer().use { srv ->
            val redirect = "http://127.0.0.1:${srv.localPort}/auth/callback"
            val params = linkedMapOf(
                "client_id" to (savedClient ?: "dynamic_agent_client"),
                "ext_agent_host_id" to hostId(),
                "response_type" to "code",
                "redirect_uri" to redirect,
                "scope" to SCOPES,
                "resource" to RESOURCE,
                "state" to state,
                "nonce" to nonce,
                "code_challenge_method" to "S256",
                "code_challenge" to challenge,
            )
            if (savedClient == null) params["agent_name_hint"] = APP_NAME
            previous?.let { params["id_token_hint"] = it.idToken; params["login_hint"] = it.email }
            val url = Uri.parse(AUTHORIZE).buildUpon().apply { params.forEach { (k, v) -> appendQueryParameter(k, v) } }.build()
            withContext(Dispatchers.Main) {
                context.startActivity(Intent(Intent.ACTION_VIEW, url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            }

            val query = awaitCallback(srv)
            if (query["state"] != state) error("Sicherheitsprüfung fehlgeschlagen (state).")
            query["error"]?.let {
                error(if (it == "access_denied") "Anmeldung abgelehnt oder ChatGPT-Abo-Nutzung nicht erlaubt." else "OpenAI meldet: $it")
            }
            val code = query["code"] ?: error("Kein Autorisierungscode erhalten.")
            val issued = query["client_id"]
            val clientId = when {
                savedClient == null -> issued ?: error("Registrierung unvollständig (keine client_id).")
                issued != null && issued != savedClient -> error("Unerwartete client_id – Anmeldung verworfen.")
                else -> savedClient
            }
            val tokens = withNetworkRetry {
                tokenRequest(
                    FormBody.Builder()
                        .add("grant_type", "authorization_code").add("client_id", clientId).add("code", code)
                        .add("code_verifier", verifier).add("redirect_uri", redirect).add("resource", RESOURCE).build()
                )
            }
            val idToken = tokens.optString("id_token").ifBlank { error("Kein ID-Token erhalten.") }
            val jwks = withNetworkRetry {
                http.newCall(Request.Builder().url(JWKS).build()).execute().use { JSONObject(it.body.string()) }
            }
            val claims = verifyIdToken(idToken, clientId, nonce, jwks)
            val scopes = tokens.optString("scope").split(' ').filter { it.isNotBlank() }
            if ("chatgpt.tokens.use.direct" !in scopes) error("Die Nutzung deines ChatGPT-Abos wurde nicht freigegeben.")
            val creds = Credentials(
                email = claims.optString("email").ifBlank { "ChatGPT-Konto" },
                subject = claims.optString("sub").ifBlank { error("ID-Token ohne sub") },
                clientId = clientId,
                idToken = idToken,
                accessToken = tokens.optString("access_token").ifBlank { error("Kein Access-Token") },
                refreshToken = tokens.optString("refresh_token").ifBlank { error("Kein Refresh-Token") },
                expiresAt = System.currentTimeMillis() + tokens.optLong("expires_in", 3600) * 1000,
                scopes = scopes,
            )
            if (previous != null && previous.subject != creds.subject && savedClient != null) error("Anderes Konto als erwartet.")
            store.putPlain(KEY_CLIENT, clientId)
            save(creds)
            return creds
        }
    }

    private fun openServer(): ServerSocket {
        val lo = InetAddress.getByName("127.0.0.1")
        return runCatching { ServerSocket(1455, 4, lo) }.getOrElse { ServerSocket(0, 4, lo) }.apply { soTimeout = 5 * 60 * 1000 }
    }

    /** Wartet auf den Browser-Rueckruf und leitet zurueck in die App. */
    private fun awaitCallback(server: ServerSocket): Map<String, String> {
        while (true) {
            val socket = try { server.accept() } catch (e: SocketTimeoutException) { error("Zeitüberschreitung bei der Anmeldung.") }
            socket.use { s ->
                val reader = s.getInputStream().bufferedReader()
                val requestLine = reader.readLine() ?: return@use
                val path = requestLine.split(' ').getOrNull(1) ?: return@use
                val out = s.getOutputStream()
                if (!path.startsWith("/auth/callback")) {
                    out.write("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".toByteArray())
                    return@use
                }
                val html = "<html><head><meta name=viewport content='width=device-width'></head><body style='font-family:sans-serif;text-align:center;padding:40px'>" +
                    "<h2>Fertig! 🦊</h2><p>Du kannst jetzt zu <b>Tias Mathe-Quest</b> zurückkehren.</p>" +
                    "<p><a href='$APP_RETURN'>Zurück zur App</a></p></body></html>"
                val body = html.toByteArray()
                out.write(("HTTP/1.1 302 Found\r\nLocation: $APP_RETURN\r\nContent-Type: text/html; charset=utf-8\r\n" +
                    "Content-Length: ${body.size}\r\nConnection: close\r\n\r\n").toByteArray())
                out.write(body)
                out.flush()
                val q = path.substringAfter('?', "")
                return q.split('&').filter { '=' in it }.associate {
                    URLDecoder.decode(it.substringBefore('='), "UTF-8") to URLDecoder.decode(it.substringAfter('='), "UTF-8")
                }
            }
        }
    }

    /** Gueltiges Access-Token, bei Bedarf erneuert. */
    suspend fun accessToken(): String = refreshMutex.withLock {
        val c = credentials() ?: throw AiException("Bitte zuerst mit ChatGPT anmelden.")
        if (c.expiresAt - 60_000 > System.currentTimeMillis()) return c.accessToken
        val tokens = withContext(Dispatchers.IO) {
            runCatching {
                withNetworkRetry(30_000) {
                    tokenRequest(
                        FormBody.Builder().add("grant_type", "refresh_token").add("client_id", c.clientId)
                            .add("refresh_token", c.refreshToken).add("resource", RESOURCE).build()
                    )
                }
            }.getOrElse {
                if (it is CancellationException) throw it
                set(Phase.ERROR, "Sitzung abgelaufen – bitte erneut anmelden.")
                throw AiException("Sitzung abgelaufen – bitte erneut mit ChatGPT anmelden.")
            }
        }
        val updated = c.copy(
            accessToken = tokens.optString("access_token").ifBlank { c.accessToken },
            refreshToken = tokens.optString("refresh_token").ifBlank { c.refreshToken },
            expiresAt = System.currentTimeMillis() + tokens.optLong("expires_in", 3600) * 1000,
            scopes = tokens.optString("scope").takeIf { it.isNotBlank() }?.split(' ') ?: c.scopes,
        )
        save(updated)
        updated.accessToken
    }

    fun signOut() {
        scope.launch(Dispatchers.IO) {
            credentials()?.let { c ->
                runCatching {
                    http.newCall(
                        Request.Builder().url(REVOKE).post(
                            FormBody.Builder().add("token", c.refreshToken).add("token_type_hint", "refresh_token").add("client_id", c.clientId).build()
                        ).build()
                    ).execute().close()
                }
            }
            store.put(KEY_CREDS, null)
            email = ""
            set(Phase.SIGNED_OUT)
        }
    }

    private suspend fun <T> withNetworkRetry(maxMs: Long = 120_000, block: () -> T): T {
        val deadline = System.currentTimeMillis() + maxMs
        while (true) {
            try {
                return block()
            } catch (e: IOException) {
                if (System.currentTimeMillis() > deadline) throw AiException("Keine Verbindung zu OpenAI. Bitte Internet prüfen und erneut anmelden.")
                delay(2_000)
            }
        }
    }

    private fun tokenRequest(body: FormBody): JSONObject =
        http.newCall(Request.Builder().url(TOKEN).post(body).build()).execute().use { r ->
            val text = r.body.string()
            if (!r.isSuccessful) throw AiException("Token-Anfrage fehlgeschlagen (${r.code}).")
            JSONObject(text)
        }

    /** Prueft Signatur (RS256 gegen OpenAIs JWKS), Aussteller, Empfaenger, Ablauf und nonce. */
    private fun verifyIdToken(token: String, clientId: String, nonce: String, jwks: JSONObject): JSONObject {
        val parts = token.split('.')
        require(parts.size == 3) { "Ungültiges ID-Token" }
        val header = JSONObject(String(b64decode(parts[0])))
        val claims = JSONObject(String(b64decode(parts[1])))
        if (header.optString("alg") != "RS256") error("Nicht unterstützter Token-Algorithmus")
        val kid = header.optString("kid")
        val keys = jwks.getJSONArray("keys")
        val jwk = (0 until keys.length()).map { keys.getJSONObject(it) }.firstOrNull { it.optString("kid") == kid } ?: error("Signaturschlüssel nicht gefunden")
        val pub = KeyFactory.getInstance("RSA").generatePublic(
            RSAPublicKeySpec(BigInteger(1, b64decode(jwk.getString("n"))), BigInteger(1, b64decode(jwk.getString("e"))))
        )
        val ok = Signature.getInstance("SHA256withRSA").run {
            initVerify(pub); update("${parts[0]}.${parts[1]}".toByteArray()); verify(b64decode(parts[2]))
        }
        if (!ok) error("ID-Token-Signatur ungültig")
        if (claims.optString("iss") != ISSUER) error("Falscher Aussteller")
        val aud = claims.opt("aud")
        val audOk = when (aud) {
            is JSONArray -> (0 until aud.length()).any { aud.optString(it) == clientId }
            is String -> aud == clientId
            else -> false
        }
        if (!audOk) error("ID-Token für falschen Empfänger")
        if (claims.optLong("exp") * 1000 < System.currentTimeMillis() - 60_000) error("ID-Token abgelaufen")
        if (claims.optString("nonce") != nonce) error("Sicherheitsprüfung fehlgeschlagen (nonce).")
        return claims
    }

    private fun random(bytes: Int) = b64url(ByteArray(bytes).also { SecureRandom().nextBytes(it) })
    private fun b64url(b: ByteArray) = Base64.encodeToString(b, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    private fun b64decode(s: String) = Base64.decode(s, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)

    companion object {
        const val APP_NAME = "Tias Mathe-Quest"
        const val APP_RETURN = "tiamathe://auth-done"
        const val ISSUER = "https://auth.openai.com"
        const val AUTHORIZE = "https://auth.openai.com/api/accounts/authorize"
        const val TOKEN = "https://auth.openai.com/api/accounts/oauth/token"
        const val REVOKE = "https://auth.openai.com/api/accounts/oauth/revoke"
        const val JWKS = "https://auth.openai.com/.well-known/jwks.json"
        const val RESOURCE = "https://api.openai.com/v1"
        const val SCOPES = "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct"
        private const val KEY_CREDS = "chatgpt_credentials"
        private const val KEY_CLIENT = "chatgpt_client_id"
        private const val KEY_HOST = "chatgpt_host_id"
    }
}

class AiException(message: String) : Exception(message)
