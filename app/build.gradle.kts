plugins {
    id("com.android.application")
}

// Version kommt aus dem GitHub-Build (Laufnummer), lokal 1.0.0.
val appVersionCode = (project.findProperty("versionCode") as String?)?.toIntOrNull() ?: 1
val appVersionName = (project.findProperty("versionName") as String?) ?: "1.0.0"

// Die Lern-App selbst ist die Web-App in ../web – sie wird unveraendert als Assets in die APK gepackt.

android {
    namespace = "de.tia.mathequest"
    compileSdk = 37

    defaultConfig {
        applicationId = "de.tia.mathequest"
        minSdk = 24
        targetSdk = 36
        versionCode = appVersionCode
        versionName = appVersionName
        buildConfigField("String", "GITHUB_REPO", "\"Schnielz87/Mathelern-App\"")
        buildConfigField("String", "APK_NAME", "\"Tias-Mathe-Quest.apk\"")
    }

    signingConfigs {
        create("release") {
            // Schluessel kommt aus GitHub-Secrets (SIGNING_KEYSTORE_BASE64 / SIGNING_PASSWORD),
            // lokal aus signing/tia-release.jks (nicht im Repo). Immer derselbe Schluessel, sonst passen Updates nicht.
            val ks = System.getenv("SIGNING_KEYSTORE_FILE")?.takeIf { it.isNotBlank() } ?: rootProject.file("signing/tia-release.jks").path
            val pw = System.getenv("SIGNING_PASSWORD")?.takeIf { it.isNotBlank() } ?: (project.findProperty("signingPassword") as String? ?: "")
            if (file(ks).exists()) {
                storeFile = file(ks)
                storePassword = pw
                keyAlias = "tiamathe"
                keyPassword = pw
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures {
        buildConfig = true
    }

    sourceSets {
        getByName("main") {
            assets.directories += rootProject.file("web").path
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.19.1")
    implementation("androidx.activity:activity:1.13.0")
    implementation("androidx.webkit:webkit:1.18.0")
    implementation("androidx.work:work-runtime:2.12.0")
}
