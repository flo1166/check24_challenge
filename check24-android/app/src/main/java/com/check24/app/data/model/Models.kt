package com.check24.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class HomeResponse(
    val services: Map<String, ServiceData>? = null
)

// 🔥 UPDATED: ServiceData now contains components instead of flat widgets
@Serializable
data class ServiceData(
    val title: String,
    val components: List<Component> = emptyList()  // ← Changed from widgets to components
)

// 🔥 NEW: Component structure
@Serializable
data class Component(
    val component_id: String,
    val component_order: Int = 0,
    val component_type: String,  // "ProductGrid", "Card", "InfoBox", "SectionHeader"
    val widgets: List<Widget> = emptyList()
)

@Serializable
data class Widget(
    val widget_id: String,
    val component_type: String,
    val component_id: String? = null,
    val component_order: Int = 0,
    val priority: Int = 0,
    val data: WidgetData? = null,
    val service: String? = null
)

@Serializable
data class WidgetData(
    val id: String? = null,
    val type: String? = null,
    val title: String? = null,
    val subtitle: String? = null,
    val content: String? = null,
    val description: String? = null,
    val image_url: String? = null,
    val cta_link: String? = null,
    val footer: String? = null,
    val pricing: Pricing? = null,
    val rating: Rating? = null,
    val data: ProductGridData? = null  // For nested ProductGrid structure
)

@Serializable
data class ProductGridData(
    val products: List<ProductData>? = null
)

@Serializable
data class Pricing(
    val price: Double? = null,
    val currency: String? = "€",
    val frequency: String? = null
)

@Serializable
data class Rating(
    val score: Double? = null,
    val label: String? = null
)

@Serializable
data class ProductData(
    val id: String? = null,
    val title: String? = null,
    val subtitle: String? = null,
    val content: String? = null,
    val image_url: String? = null,
    val pricing: Pricing? = null,
    val rating: Double? = null
)

@Serializable
data class ContractsResponse(
    val has_contract: Boolean,
    val contracts: Map<String, ContractData>? = null
)

@Serializable
data class ContractData(
    val widget_id: String? = null,
    val data: WidgetData? = null
)

@Serializable
data class CreateContractRequest(
    val user_id: Int,
    val widget_id: String
)

@Serializable
data class CreateContractResponse(
    val contract_id: Int
)

// Category for Insurance Centre
data class InsuranceCategory(
    val id: String,
    val label: String,
    val description: String,
    val serviceKey: String
)

// Notification state
data class NotificationState(
    val cart: Int = 0,
    val favorites: Int = 0,
    val alerts: Int = 0,
    val hotDeals: Int = 0,
    val portfolio: Int = 0
)