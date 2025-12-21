package com.check24.app.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.check24.app.data.model.Component
import com.check24.app.data.model.ServiceData
import com.check24.app.data.model.Widget
import com.check24.app.ui.theme.Check24Colors
import androidx.compose.foundation.BorderStroke

/**
 * 🔥 UPDATED: WidgetSection now accepts ServiceData with components
 * Renders components in order based on component_order
 */
@Composable
fun WidgetSection(
    serviceData: ServiceData,  // ← Changed from individual params to ServiceData
    isCollapsed: Boolean,
    onToggleCollapse: () -> Unit,
    onAddToCart: (Widget) -> Unit,
    onToggleFavorite: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    // Sort components by component_order
    val sortedComponents = remember(serviceData.components) {
        serviceData.components.sortedBy { it.component_order }
    }

    // Count total widgets across all components
    val totalWidgets = remember(sortedComponents) {
        sortedComponents.sumOf { component ->
            component.widgets.count { it.widget_id != "fallback_error_card" }
        }
    }

    // Find SectionHeader component if exists
    val sectionHeaderComponent = sortedComponents.find { 
        it.component_type == "SectionHeader" 
    }

    Column(modifier = modifier.fillMaxWidth()) {
        // Section Header
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggleCollapse() },
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
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        // Use SectionHeader title if available, otherwise service title
                        val headerTitle = sectionHeaderComponent
                            ?.widgets
                            ?.firstOrNull()
                            ?.data
                            ?.title 
                            ?: serviceData.title

                        Text(
                            text = headerTitle,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )

                        // Show widget count
                        Text(
                            text = "$totalWidgets ${if (totalWidgets == 1) "deal" else "deals"} available",
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }

                    IconButton(onClick = onToggleCollapse) {
                        Icon(
                            imageVector = if (isCollapsed) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowUp,
                            contentDescription = if (isCollapsed) "Expand" else "Collapse",
                            tint = Color.White
                        )
                    }
                }
            }
        }

        // Component Content
        AnimatedVisibility(
            visible = !isCollapsed,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Column {
                Spacer(modifier = Modifier.height(16.dp))

                // Render each component in order
                sortedComponents.forEach { component ->
                    // Skip SectionHeader since we rendered it above
                    if (component.component_type != "SectionHeader") {
                        ComponentRenderer(
                            component = component,
                            onAddToCart = onAddToCart,
                            onToggleFavorite = onToggleFavorite
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
            }
        }

        // Collapsed state indicator
        if (isCollapsed && totalWidgets > 0) {
            Spacer(modifier = Modifier.height(8.dp))
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFFF5F5F5)
            ) {
                Box(
                    modifier = Modifier.padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "$totalWidgets deals hidden. Click to expand.",
                        color = Check24Colors.TextMuted,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

/**
 * 🔥 NEW: Renders a single component based on its type
 */
@Composable
private fun ComponentRenderer(
    component: Component,
    onAddToCart: (Widget) -> Unit,
    onToggleFavorite: (Boolean) -> Unit
) {
    // Filter out fallback widgets
    val validWidgets = component.widgets.filter { 
        it.widget_id != "fallback_error_card" 
    }

    if (validWidgets.isEmpty()) {
        return
    }

    when (component.component_type) {
        "ProductGrid" -> {
            // ProductGrid: Render the first widget (contains all products)
            ProductGrid(
                widget = validWidgets.first(),
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        "Card" -> {
            // Cards: Render in horizontal carousel
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(horizontal = 16.dp)
            ) {
                items(validWidgets) { widget ->
                    ProductCard(
                        widget = widget,
                        onAddToCart = { onAddToCart(widget) },
                        onToggleFavorite = onToggleFavorite
                    )
                }
            }
        }

        "InfoBox" -> {
            // InfoBoxes: Render in vertical list
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(horizontal = 16.dp)
            ) {
                validWidgets.forEach { widget ->
                    InfoBoxCard(widget = widget)
                }
            }
        }

        else -> {
            // Unknown component type - log warning
            println("⚠️ Unknown component_type: ${component.component_type}")
        }
    }
}

@Composable
private fun InfoBoxCard(widget: Widget) {
    val data = widget.data

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF0F7FF)
        ),
        border = BorderStroke(2.dp, Check24Colors.PrimaryMedium.copy(alpha = 0.2f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top
            ) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Check24Colors.PrimaryMedium,
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "i",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = data?.title ?: "Information",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Check24Colors.TextDark
                    )

                    data?.subtitle?.let { subtitle ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = subtitle,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Check24Colors.PrimaryMedium
                        )
                    }
                }
            }

            data?.content?.let { content ->
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = content,
                    fontSize = 13.sp,
                    color = Check24Colors.TextMuted,
                    lineHeight = 18.sp
                )
            }

            data?.footer?.let { footer ->
                Spacer(modifier = Modifier.height(12.dp))
                Divider(color = Check24Colors.PrimaryMedium.copy(alpha = 0.2f))
                Spacer(modifier = Modifier.height(12.dp))

                TextButton(
                    onClick = { /* TODO */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = footer,
                        color = Check24Colors.PrimaryMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}