package com.check24.app

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.SvgDecoder

class Check24Application : Application(), ImageLoaderFactory {

    override fun onCreate() {
        super.onCreate()
        // Initialize any application-wide components here
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .components {
                add(SvgDecoder.Factory())
            }
            .crossfade(true) // Optional: Adds a nice fade-in animation
            .build()
    }
}
