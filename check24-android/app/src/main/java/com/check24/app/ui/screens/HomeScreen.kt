package com.check24.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.check24.app.ui.components.*
import com.check24.app.ui.theme.Check24Colors
import com.check24.app.ui.viewmodel.HomeUiState
import androidx.compose.foundation.BorderStroke

@Composable
fun HomeScreen(
    uiState: HomeUiState,
    onAddToCart: (String, com.check24.app.data.model.Widget) -> Unit,
    onToggleFavorite: (Boolean) -> Unit,
    onToggleSection: (String) -> Unit,
    onRetry: () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        when {
            uiState.isLoading -> {
                LoadingScreen()
            }
            uiState.error != null -> {
                ErrorScreen(
                    error = uiState.error,
                    onRetry = onRetry
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    // Hero Section
                    item {
                        HeroSection()
                    }

                    // Insurance Centre
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        InsuranceCentre(contracts = uiState.contracts)
                    }

                    // Dynamic Widget Sections - Only show sections WITH widgets
                    val sectionsWithWidgets = uiState.homeData?.services?.filter { (_, serviceData) ->
                        serviceData.widgets.isNotEmpty()
                    }

                    val sectionsWithoutWidgets = uiState.homeData?.services?.filter { (_, serviceData) ->
                        serviceData.widgets.isEmpty()
                    }

                    // Show sections that have widgets
                    sectionsWithWidgets?.forEach { (serviceKey, serviceData) ->
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            WidgetSection(
                                title = serviceData.title,
                                widgets = serviceData.widgets,
                                isCollapsed = uiState.collapsedSections.contains(serviceKey),
                                onToggleCollapse = { onToggleSection(serviceKey) },
                                onAddToCart = { widget -> onAddToCart(serviceKey, widget) },
                                onToggleFavorite = onToggleFavorite,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                        }
                    }

                    // Show single "No Deals Available" message if any sections are empty
                    if (!sectionsWithoutWidgets.isNullOrEmpty()) {
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            NoDealsAvailableSection(
                                emptyServices = sectionsWithoutWidgets.values.map { it.title }
                            )
                        }
                    }

                    // Footer CTA
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                        FooterCTA()
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun HeroSection() {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp),
        color = Check24Colors.PrimaryDeep
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Check24Colors.PrimaryDeep,
                            Check24Colors.PrimaryMedium
                        )
                    )
                )
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Insurance & Banking Centre",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Find the best insurance deals and banking products tailored to your needs",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun NoDealsAvailableSection(emptyServices: List<String>) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        shadowElevation = 2.dp,
        border = BorderStroke(1.dp, Check24Colors.PrimaryMedium.copy(alpha = 0.2f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No Deals Available",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Check24Colors.TextDark
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Check back soon for personalized insurance recommendations!",
                fontSize = 14.sp,
                color = Check24Colors.TextMuted,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun FooterCTA() {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(12.dp),
        color = Check24Colors.PrimaryMedium
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Check24Colors.PrimaryMedium,
                            Check24Colors.PrimaryDeep
                        )
                    )
                )
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Ready to Save Money?",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Join millions of smart shoppers finding the best deals on Check24",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = { /* TODO */ },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Check24Colors.HighlightYellow,
                        contentColor = Check24Colors.PrimaryDeep
                    ),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = "Get Started Now",
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            CircularProgressIndicator(
                color = Check24Colors.PrimaryMedium,
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Loading...",
                color = Check24Colors.TextMuted,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

@Composable
private fun ErrorScreen(error: String, onRetry: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .padding(32.dp)
                .fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = BorderStroke(1.dp, Check24Colors.AlertRed.copy(alpha = 0.2f)),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "âš ï¸ Connection Error",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Check24Colors.TextDark
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = error,
                    color = Check24Colors.TextMuted,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Make sure the Core Service (BFF) and Product Services are running.",
                    fontSize = 11.sp,
                    color = Check24Colors.TextMuted,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onRetry,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Check24Colors.PrimaryMedium
                    )
                ) {
                    Text("Retry")
                }
            }
        }
    }
}