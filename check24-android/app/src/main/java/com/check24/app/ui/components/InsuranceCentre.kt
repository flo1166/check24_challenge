package com.check24.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.check24.app.data.model.ContractData
import com.check24.app.data.model.InsuranceCategory
import com.check24.app.ui.theme.Check24Colors
import com.check24.app.utils.ImageUtils

@Composable
fun InsuranceCentre(
    contracts: Map<String, ContractData>,
    modifier: Modifier = Modifier
) {
    val categories = remember {
        listOf(
            InsuranceCategory(
                id = "car",
                label = "Car Insurance",
                description = "View your car insurance contracts",
                serviceKey = "car_insurance"
            ),
            InsuranceCategory(
                id = "health",
                label = "Health Insurance",
                description = "View your health insurance contracts",
                serviceKey = "health_insurance"
            ),
            InsuranceCategory(
                id = "house",
                label = "House Insurance",
                description = "View your house insurance contracts",
                serviceKey = "house_insurance"
            ),
            InsuranceCategory(
                id = "money",
                label = "Money & Banking",
                description = "View your banking & investment products",
                serviceKey = "banking"
            )
        )
    }

    // Debug: Log all contract keys
    LaunchedEffect(contracts) {
        println("📋 Contracts available: ${contracts.keys}")
        contracts.forEach { (key, value) ->
            println("   - $key: ${value.widget_id}, title: ${value.data?.title}")
        }
    }

    Column(modifier = modifier.fillMaxWidth()) {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(16.dp),
            modifier = Modifier.height(650.dp)
        ) {
            items(categories) { category ->
                val contract = contracts[category.serviceKey]
                val isUnlocked = contract != null

                // Debug logging
                println("🔍 Category: ${category.label}, ServiceKey: ${category.serviceKey}, Has Contract: $isUnlocked")

                InsuranceTile(
                    category = category,
                    isUnlocked = isUnlocked,
                    contract = contract
                )
            }
        }
    }
}

@Composable
private fun InsuranceTile(
    category: InsuranceCategory,
    isUnlocked: Boolean,
    contract: ContractData?
) {
    var isFlipped by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(300.dp)
            .clickable(enabled = isUnlocked) {
                isFlipped = !isFlipped
            },
        colors = CardDefaults.cardColors(
            containerColor = if (isUnlocked) Color.White else Color.Gray.copy(alpha = 0.3f)
        ),
        border = BorderStroke(
            2.dp,
            if (isUnlocked) Check24Colors.PrimaryMedium else Color.Gray
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            if (!isFlipped) {
                // Front of card
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Icon(
                        imageVector = getCategoryIcon(category.id),
                        contentDescription = category.label,
                        modifier = Modifier.size(80.dp),
                        tint = if (isUnlocked) Check24Colors.PrimaryMedium else Color.Gray
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = category.label,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isUnlocked) Check24Colors.TextDark else Color.Gray
                    )

                    if (contract != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Surface(
                            shape = CircleShape,
                            color = Check24Colors.SuccessGreen,
                            modifier = Modifier.padding(4.dp)
                        ) {
                            Text(
                                text = "Active",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                            )
                        }
                    }

                    if (!isUnlocked) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Locked",
                            tint = Color.Gray,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            } else {
                // Back of card - Contract details
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Title section
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        // Logo/Image if available
                        contract?.data?.image_url?.let { imagePath ->
                            val imageUrl = ImageUtils.getImageUrl(imagePath)
                            if (imageUrl != null) {        AsyncImage(
                                model = imageUrl,
                                // Update this line to check nested data if title is missing at top level
                                contentDescription = contract.data?.title,
                                modifier = Modifier
                                    .size(80.dp)
                                    .padding(bottom = 8.dp),
                                contentScale = ContentScale.Fit
                            )
                            }
                        }

                        Text(
                            // Update this line as well
                            text = contract?.data?.title ?: category.label,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Check24Colors.TextDark
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Show additional contract data if available
                        contract?.data?.let { data ->
                            data.subtitle?.let {
                                Text(
                                    text = it,
                                    fontSize = 12.sp,
                                    color = Check24Colors.TextMuted
                                )
                            }

                            data.pricing?.let { pricing ->
                                // Add this check to ensure we have a valid price value to display
                                if (pricing.price != null) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "${pricing.price} ${pricing.currency}${pricing.frequency?.let { "/$it" } ?: ""}",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Check24Colors.PrimaryMedium
                                    )
                                }
                            }
                        }
                    }

                    // Action buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { /* View contract */ },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Check24Colors.PrimaryMedium
                            )
                        ) {
                            Text("View", fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = { /* Manage */ },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(1.dp, Check24Colors.PrimaryMedium)
                        ) {
                            Text(
                                "Manage",
                                fontSize = 12.sp,
                                color = Check24Colors.PrimaryMedium
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun getCategoryIcon(categoryId: String): ImageVector {
    return when (categoryId) {
        "car" -> Icons.Default.DirectionsCar
        "health" -> Icons.Default.FavoriteBorder
        "house" -> Icons.Default.Home
        "money" -> Icons.Default.AccountBalance
        else -> Icons.Default.Category
    }
}