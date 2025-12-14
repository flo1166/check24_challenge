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
import com.check24.app.data.model.Widget
import com.check24.app.ui.theme.Check24Colors
import androidx.compose.foundation.BorderStroke

@Composable
fun WidgetSection(
    title: String,
    widgets: List<Widget>,
    isCollapsed: Boolean,
    onToggleCollapse: () -> Unit,
    onAddToCart: (Widget) -> Unit,
    onToggleFavorite: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
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
                        Text(
                            text = title,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
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
        
        // Widget Content
        AnimatedVisibility(
            visible = !isCollapsed,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Column {
                Spacer(modifier = Modifier.height(16.dp))
                
                // Card widgets in horizontal scroll
                val cardWidgets = widgets.filter { it.component_type == "Card" }
                if (cardWidgets.isNotEmpty()) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp)
                    ) {
                        items(cardWidgets) { widget ->
                            ProductCard(
                                widget = widget,
                                onAddToCart = { onAddToCart(widget) },
                                onToggleFavorite = onToggleFavorite
                            )
                        }
                    }
                }
                
                // InfoBox widgets
                val infoBoxWidgets = widgets.filter { it.component_type == "InfoBox" }
                if (infoBoxWidgets.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        infoBoxWidgets.forEach { widget ->
                            InfoBoxCard(widget = widget)
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
            }
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
