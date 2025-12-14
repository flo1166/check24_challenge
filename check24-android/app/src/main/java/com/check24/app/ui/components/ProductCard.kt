package com.check24.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.check24.app.data.model.Widget
import com.check24.app.ui.theme.Check24Colors
import androidx.compose.foundation.BorderStroke
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay

@Composable
fun ProductCard(
    widget: Widget,
    onAddToCart: () -> Unit,
    onToggleFavorite: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    var isFavorite by remember { mutableStateOf(false) }
    var isAdded by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()
    val data = widget.data
    
    Card(
        modifier = modifier
            .width(280.dp)
            .height(400.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Check24Colors.BorderGray),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp, hoveredElevation = 8.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Image Section
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .background(Check24Colors.LightGray)
            ) {
                if (data?.image_url != null) {
                    AsyncImage(
                        model = data.image_url,
                        contentDescription = data.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                }
                
                // Rating Badge
                data?.rating?.score?.let { score ->
                    Surface(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp),
                        shape = CircleShape,
                        color = Color.Black.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Text(
                                text = String.format("%.1f", score),
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Icon(
                                Icons.Default.Star,
                                contentDescription = null,
                                tint = Check24Colors.HighlightYellow,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
                
                // Favorite Button
                IconButton(
                    onClick = {
                        isFavorite = !isFavorite
                        onToggleFavorite(isFavorite)
                    },
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(8.dp)
                        .background(Color.White, CircleShape)
                        .size(40.dp)
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = if (isFavorite) Check24Colors.AlertRed else Check24Colors.TextDark
                    )
                }
            }
            
            // Content Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .padding(12.dp)
            ) {
                // Title
                Text(
                    text = data?.title ?: "Product",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Check24Colors.TextDark,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                
                // Subtitle
                data?.subtitle?.let { subtitle ->
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = subtitle,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Check24Colors.PrimaryMedium
                    )
                }
                
                // Price
                data?.pricing?.let { pricing ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.Bottom
                    ) {
                        Text(
                            text = "${pricing.price} ${pricing.currency ?: "€"}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Check24Colors.TextDark
                        )
                        pricing.frequency?.let { freq ->
                            Text(
                                text = "/$freq",
                                fontSize = 11.sp,
                                color = Check24Colors.TextMuted,
                                modifier = Modifier.padding(start = 2.dp)
                            )
                        }
                    }
                }
                
                // Description
                data?.content?.let { content ->
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = content,
                        fontSize = 11.sp,
                        color = Check24Colors.TextMuted,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                        lineHeight = 16.sp
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Add to Cart Button
                Button(
                    onClick = {
                        onAddToCart()
                        isAdded = true
                        // Reset after 2 seconds
                        coroutineScope.launch {
                            delay(2000)
                            isAdded = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isAdded) Check24Colors.SuccessGreen else Check24Colors.PrimaryMedium
                    ),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Icon(
                        Icons.Default.ShoppingCart,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isAdded) "Added!" else "Add to Cart",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}
