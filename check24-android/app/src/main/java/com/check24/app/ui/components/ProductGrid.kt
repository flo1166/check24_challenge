package com.check24.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.check24.app.data.model.Widget
import com.check24.app.ui.theme.Check24Colors

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProductGrid(
    widget: Widget,
    modifier: Modifier = Modifier
) {
    // 1. Robust extraction (Updated to handle nested JSON "data.data.products")
    // If your WidgetData class does not have a 'data' field, you must add it to the model.
    val products = widget.data?.data?.products
        ?: emptyList()

    // 2. Title Extraction
    // Logic: Widget title -> Data title -> Default
    val title = widget.data?.title ?: "Featured Deals"

    Column(modifier = modifier.fillMaxWidth()) {

        // Widget Title
        Text(
            text = title,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Check24Colors.TextDark,
            modifier = Modifier.padding(bottom = 12.dp, start = 8.dp)
        )

        if (products.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .background(Color(0xFFF3F4F6), RoundedCornerShape(8.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "No products available for this grid.", color = Color.Gray)
            }
        } else {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                maxItemsInEachRow = 2
            ) {
                products.forEach { product ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(0.5f)
                            // Important: Ensure Box has height if image loads slowly
                            .heightIn(min = 200.dp)
                    ) {
                        CardSimple(data = product)
                    }
                }
            }
        }
    }
}
