import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer # Non-blocking Kafka client
from app.core.cache import redis_client # Re-use the existing async redis client
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9093")
KAFKA_TOPIC = "user.car.insurance.purchased"
CACHE_KEY_PREFIX = "sdui:home_page:v1"

async def consume_and_invalidate_cache():
    """
    Asynchronous Kafka Consumer run as a background task via FastAPI Lifespan.
    """
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        group_id='widget-cache-invalidator-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        # Start consuming from the earliest available offset
        auto_offset_reset='earliest', 
        # Time the consumer waits for connection before erroring (in ms)
        request_timeout_ms=60000, 
        # Time to wait for Kafka broker selection (in ms)
        retry_backoff_ms=500,  
        # Max number of retries before giving up (set high for PoC)
        max_poll_records=500,
    )
    
    # 1. Start the Consumer (This handles Kafka connection retries internally)
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            logger.info(f"Attempting to start Kafka Consumer (Attempt {attempt + 1}/{max_attempts})...")
            await consumer.start()
            logger.info("✅ AIOKafka Consumer started successfully.")
            break
        except Exception as e:
            if attempt == max_attempts - 1:
                logger.error(f"❌ Failed to start Kafka Consumer after {max_attempts} attempts: {e}")
                return
            logger.warning(f"Connection failed: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

    try:
        # 2. Consume messages asynchronously
        async for message in consumer:
            event = message.value
            logger.info(f"📩 Received event: {event}")
            
            # The key logic for targeted invalidation
            # Note: The key for the SWR cache in home.py is HOME_PAGE_CACHE_KEY = "sdui:home_page:v1"
            # Since the current SWR key is generic, you must either:
            # A) Invalidate the generic key, or 
            # B) Ensure your SWR key is user-specific, e.g., f"sdui:home_page:{user_id}:v1" 
            
            # --- Assuming generic key invalidation for simplicity (Option A) ---
            # If the user buys a product, the main home page content might change.
            if message.topic == KAFKA_TOPIC:
                deleted_count = await redis_client.delete(CACHE_KEY_PREFIX)
                if deleted_count > 0:
                    logger.info(f"🗑️ Successfully invalidated generic cache key: {CACHE_KEY_PREFIX}")
                else:
                    logger.warning(f"Cache key not found for deletion: {CACHE_KEY_PREFIX}")

    finally:
        # 3. Stop the Consumer when the FastAPI app shuts down
        await consumer.stop()
        logger.info("AIOKafka Consumer stopped.")

# NOTE: This function needs to be scheduled in core-service/app/main.py 
# using asyncio.create_task or similar, or better, via the FastAPI Lifespan.