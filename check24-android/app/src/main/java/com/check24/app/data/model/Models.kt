package com.check24.app.data.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class HomeResponse(
    val services: Map<String, ServiceData>? = null
)

@Serializable
data class ServiceData(
    val title: String,
    val widgets: List<Widget> = emptyList()
)

@Serializable
data class Widget(
    val widget_id: String,
    val component_type: String,
    val priority: Int = 0,
    val data: WidgetData? = null
)

@Serializable
data class WidgetData(
    val title: String? = null,
    val subtitle: String? = null,
    val content: String? = null,
    val description: String? = null,
    val image_url: String? = null,
    val cta_link: String? = null,
    val footer: String? = null,
    val pricing: Pricing? = null,
    val rating: Rating? = null,
    val products: List<ProductData>? = null
)

@Serializable
data class Pricing(
    val price: String? = null,
    val currency: String? = "€",
    val frequency: String? = null
)

@Serializable
data class Rating(
    val score: Double? = null
)

@Serializable
data class ProductData(
    val id: String? = null,
    val title: String? = null,
    val subtitle: String? = null,
    val content: String? = null,
    val image_url: String? = null,
    val pricing: Pricing? = null,
    val rating: Rating? = null
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
