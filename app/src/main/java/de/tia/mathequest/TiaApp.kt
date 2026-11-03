package de.tia.mathequest

import android.app.Application

class TiaApp : Application() {
    lateinit var updater: Updater
        private set

    override fun onCreate() {
        super.onCreate()
        updater = Updater(this)
        // Alle 24 Stunden im Hintergrund nach einer neuen Version schauen.
        UpdateWorker.schedule(this)
    }
}
