package com.check24.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.check24.app.data.api.ApiService
import com.check24.app.data.api.HttpClientFactory
import com.check24.app.data.repository.Check24Repository
import com.check24.app.ui.components.Header
import com.check24.app.ui.components.NavigationBar
import com.check24.app.ui.screens.HomeScreen
import com.check24.app.ui.theme.Check24Theme
import com.check24.app.ui.viewmodel.HomeViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize dependencies
        val httpClient = HttpClientFactory.create()
        val apiService = ApiService(httpClient)
        val repository = Check24Repository(apiService)
        
        setContent {
            Check24Theme {
                Check24App(repository)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Check24App(repository: Check24Repository) {
    val viewModel: HomeViewModel = viewModel(
        factory = object : androidx.lifecycle.ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                return HomeViewModel(repository) as T
            }
        }
    )
    
    val uiState by viewModel.uiState.collectAsState()
    var selectedNavItem by remember { mutableStateOf("home") }
    
    Scaffold(
        topBar = { Header() },
        bottomBar = {
            NavigationBar(
                notifications = uiState.notifications,
                selectedItem = selectedNavItem,
                onItemSelected = { selectedNavItem = it }
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (selectedNavItem) {
                "home" -> {
                    HomeScreen(
                        uiState = uiState,
                        onAddToCart = { serviceKey, widget ->
                            viewModel.addToCart(serviceKey, widget)
                        },
                        onToggleFavorite = { isFavorite ->
                            viewModel.updateNotification(
                                "favorites",
                                if (isFavorite) 1 else -1
                            )
                        },
                        onToggleSection = { serviceKey ->
                            viewModel.toggleSectionCollapse(serviceKey)
                        },
                        onRetry = {
                            viewModel.loadData()
                        }
                    )
                }
                "cart" -> {
                    PlaceholderScreen("Shopping Cart")
                }
                "favorites" -> {
                    PlaceholderScreen("Favorites")
                }
                "alerts" -> {
                    PlaceholderScreen("Alerts")
                }
                "deals" -> {
                    PlaceholderScreen("Hot Deals")
                }
                "portfolio" -> {
                    PlaceholderScreen("Portfolio")
                }
            }
        }
    }
}

@Composable
fun PlaceholderScreen(title: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = androidx.compose.ui.Alignment.Center
    ) {
        Text(
            text = "$title - Coming Soon",
            style = MaterialTheme.typography.headlineMedium
        )
    }
}
