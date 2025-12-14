package com.check24.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Check24ColorScheme = lightColorScheme(
    primary = Check24Colors.PrimaryMedium,
    onPrimary = Color.White,
    primaryContainer = Check24Colors.PrimaryLight,
    onPrimaryContainer = Color.White,
    
    secondary = Check24Colors.HighlightYellow,
    onSecondary = Check24Colors.PrimaryDeep,
    
    error = Check24Colors.AlertRed,
    onError = Color.White,
    
    background = Color.White,
    onBackground = Check24Colors.TextDark,
    
    surface = Color.White,
    onSurface = Check24Colors.TextDark,
    
    surfaceVariant = Check24Colors.LightGray,
    onSurfaceVariant = Check24Colors.TextMuted
)

@Composable
fun Check24Theme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = Check24ColorScheme,
        typography = Typography,
        content = content
    )
}
