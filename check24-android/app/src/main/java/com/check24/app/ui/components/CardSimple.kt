package com.check24.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.check24.app.data.model.ProductData
import com.check24.app.ui.theme.Check24Colors
import com.check24.app.utils.ImageUtils
import java.text.NumberFormat
import java.util.Locale

@Composable
fun CardSimple(
    data: ProductData,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp), // Fixed height for uniformity
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Picture
            val imageUrl = ImageUtils.getImageUrl(data.image_url)
            if (imageUrl != null) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = data.title,
                    modifier = Modifier
                        .height(100.dp)
                        .fillMaxWidth(),
                    contentScale = ContentScale.Fit
                )
            } else {
                Box(
                    modifier = Modifier
                        .height(100.dp)
                        .fillMaxWidth()
                        .background(Color.LightGray),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No Image", fontSize = 10.sp)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 2. Name
            Text(
                text = data.title ?: "Unknown Product",
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                lineHeight = 18.sp,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.weight(1f))

            // 3. Price
            data.pricing?.let { pricing ->
                // --- START: Formatting Logic ---
                val numberFormatter = NumberFormat.getNumberInstance(Locale.GERMANY).apply {
                    // Set desired decimal places (e.g., 2 for currency)
                    minimumFractionDigits = 2
                    maximumFractionDigits = 2
                }

                // Format the number part
                val formattedPrice = numberFormatter.format(pricing.price)

                // Construct the final text string
                val textToShow = "$formattedPrice ${pricing.currency}"
                // --- END: Formatting Logic ---

                Text(
                    text = textToShow, // Use the localized string here
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Check24Colors.PrimaryDeep, // Or your primary color
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}
