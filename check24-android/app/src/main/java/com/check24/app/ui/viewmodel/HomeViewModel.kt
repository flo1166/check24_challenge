package com.check24.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.check24.app.data.model.*
import com.check24.app.data.repository.Check24Repository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class HomeUiState(
    val isLoading: Boolean = true,
    val error: String? = null,
    val homeData: HomeResponse? = null,
    val contracts: Map<String, ContractData> = emptyMap(),
    val notifications: NotificationState = NotificationState(),
    val collapsedSections: Set<String> = emptySet()
)

class HomeViewModel(private val repository: Check24Repository) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    private val userId = 123 // TODO: Get from auth

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            // Load home data
            repository.getHomeData().collect { result ->
                result.fold(
                    onSuccess = { data ->
                        _uiState.update { it.copy(homeData = data, isLoading = false) }
                        loadContracts()
                    },
                    onFailure = { error ->
                        _uiState.update {
                            it.copy(
                                error = error.message ?: "Unknown error",
                                isLoading = false
                            )
                        }
                    }
                )
            }
        }
    }

    private fun loadContracts() {
        viewModelScope.launch {
            repository.getUserContracts(userId).collect { result ->
                result.fold(
                    onSuccess = { response ->
                        if (response.has_contract && response.contracts != null) {
                            println("📋 Contracts loaded: ${response.contracts.keys}")
                            response.contracts.forEach { (key, contract) ->
                                println("   - $key: widget_id=${contract.widget_id}")
                            }
                            _uiState.update { it.copy(contracts = response.contracts) }
                            println("✨ UI updated - purchased widgets will now be filtered out")
                        } else {
                            println("📋 No contracts found for user $userId")
                        }
                    },
                    onFailure = { error ->
                        // Silently fail for contracts - not critical
                        println("❌ Failed to load contracts: ${error.message}")
                    }
                )
            }
        }
    }

    fun addToCart(serviceKey: String, widget: Widget) {
        viewModelScope.launch {
            println("🛒 Adding to cart:")
            println("   Service: $serviceKey")
            println("   Widget ID: ${widget.widget_id}")

            // Update UI immediately
            _uiState.update { state ->
                state.copy(
                    notifications = state.notifications.copy(
                        cart = state.notifications.cart + 1
                    )
                )
            }

            // Save to backend
            repository.createContract(serviceKey, userId, widget.widget_id).fold(
                onSuccess = { response ->
                    println("✅ Contract created: ${response.contract_id}")
                    println("   Reloading home data to get updated widget list...")
                    loadData() // Reload everything - backend will filter widgets
                },
                onFailure = { error ->
                    println("❌ Failed to create contract: ${error.message}")
                }
            )
        }
    }

    fun updateNotification(type: String, increment: Int) {
        _uiState.update { state ->
            val current = state.notifications
            val updated = when (type) {
                "cart" -> current.copy(cart = (current.cart + increment).coerceAtLeast(0))
                "favorites" -> current.copy(favorites = (current.favorites + increment).coerceAtLeast(0))
                "alerts" -> current.copy(alerts = (current.alerts + increment).coerceAtLeast(0))
                "hotDeals" -> current.copy(hotDeals = (current.hotDeals + increment).coerceAtLeast(0))
                "portfolio" -> current.copy(portfolio = (current.portfolio + increment).coerceAtLeast(0))
                else -> current
            }
            state.copy(notifications = updated)
        }
    }

    fun toggleSectionCollapse(serviceKey: String) {
        _uiState.update { state ->
            val collapsed = state.collapsedSections.toMutableSet()
            if (collapsed.contains(serviceKey)) {
                collapsed.remove(serviceKey)
            } else {
                collapsed.add(serviceKey)
            }
            state.copy(collapsedSections = collapsed)
        }
    }
}