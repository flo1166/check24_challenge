package com.check24.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.check24.app.data.model.NotificationState
import com.check24.app.ui.theme.Check24Colors
import androidx.compose.material3.ExperimentalMaterial3Api

data class NavItem(
    val id: String,
    val icon: ImageVector,
    val label: String
)

@Composable
fun NavigationBar(
    notifications: NotificationState,
    selectedItem: String,
    onItemSelected: (String) -> Unit
) {
    val items = listOf(
        NavItem("home", Icons.Default.Home, "Home"),
        NavItem("cart", Icons.Default.ShoppingCart, "Cart"),
        NavItem("favorites", Icons.Default.Favorite, "Favorites"),
        NavItem("alerts", Icons.Default.Notifications, "Alerts"),
        NavItem("deals", Icons.Default.LocalOffer, "Deals"),
        NavItem("portfolio", Icons.Default.TrendingUp, "Portfolio")
    )

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(70.dp),
        color = Check24Colors.PrimaryDeep,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                NavIconButton(
                    item = item,
                    isSelected = selectedItem == item.id,
                    badgeCount = getNotificationCount(item.id, notifications),
                    onClick = { onItemSelected(item.id) }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NavIconButton(
    item: NavItem,
    isSelected: Boolean,
    badgeCount: Int,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .padding(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        IconButton(onClick = onClick) {
            BadgedBox(
                badge = {
                    if (badgeCount > 0) {
                        Badge(
                            containerColor = Check24Colors.AlertRed,
                            contentColor = Color.White
                        ) {
                            Text(
                                text = if (badgeCount > 99) "99+" else badgeCount.toString(),
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = item.label,
                    tint = if (isSelected) Check24Colors.HighlightYellow else Color.White,
                    modifier = Modifier.size(24.dp)
                )
            }
        }
        Text(
            text = item.label,
            fontSize = 9.sp,
            color = if (isSelected) Check24Colors.HighlightYellow else Color.White,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
        )
    }
}

private fun getNotificationCount(itemId: String, notifications: NotificationState): Int {
    return when (itemId) {
        "cart" -> notifications.cart
        "favorites" -> notifications.favorites
        "alerts" -> notifications.alerts
        "deals" -> notifications.hotDeals
        "portfolio" -> notifications.portfolio
        else -> 0
    }
}
