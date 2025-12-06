import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer # Non-blocking Kafka client
import os

logger = logging.getLogger(__name__)
logging.getLogger("aiokafka").setLevel(logging.INFO)

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9093")
KAFKA_TOPIC = "user.car.insurance.purchased"
CACHE_KEY_PREFIX = "sdui:home_page:v1"

async def consume_and_invalidate_cache():
    """
    Asynchronous Kafka Consumer run as a background task via FastAPI Lifespan.
    Listens for contract creation/deletion events and invalidates the Redis cache.
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
            
            # Extract event details
            event_type = event.get("event_type")
            user_id = event.get("user_id")
            widget_id = event.get("widget_id")
            
            # Handle different event types
            if event_type in ["contract_created", "contract_deleted"]:
                logger.info(f"Processing {event_type} for user {user_id}, widget {widget_id}")
                
                # STRATEGY: Invalidate the generic cache key
                # This forces the next request to fetch fresh data from the product service
                # which will now exclude the contracted widget from the carousel
                
                try:
                    logger.info("Step 1: Importing redis_client...")
                    # Import redis_client at runtime to ensure it's initialized
                    from app.core.cache import redis_client
                    logger.info(f"Step 2: redis_client imported, value: {redis_client}")
                    
                    # Check if redis_client is available
                    if redis_client is None:
                        logger.error("❌ Redis client is None - cache cannot be invalidated!")
                        logger.error("This means init_redis_client() was not called or failed")
                        continue
                    
                    logger.info(f"Step 3: Attempting to delete cache key: {CACHE_KEY_PREFIX}")
                    deleted_count = await redis_client.delete(CACHE_KEY_PREFIX)
                    logger.info(f"Step 4: Delete completed, count: {deleted_count}")
                    
                    if deleted_count > 0:
                        logger.info(f"🗑️ Successfully invalidated cache key: {CACHE_KEY_PREFIX}")
                        logger.info(f"   Reason: {event_type} for user {user_id}")
                    else:
                        logger.warning(f"⚠️ Cache key not found for deletion: {CACHE_KEY_PREFIX}")
                        logger.info("This is normal if cache was already expired or empty")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to invalidate cache: {type(e).__name__}: {e}", exc_info=True)
            
            else:
                logger.warning(f"Unknown event type: {event_type}")

    except Exception as e:
        logger.error(f"Error in Kafka consumer loop: {e}", exc_info=True)
    
    finally:
        # 3. Stop the Consumer when the FastAPI app shuts down
        await consumer.stop()
        logger.info("AIOKafka Consumer stopped.")

# NOTE: This function is scheduled in core-service/app/main.py 
# using the FastAPI Lifespan context manager.

# NOTE: This function is scheduled in core-service/app/main.py 
# using the FastAPI Lifespan context manager.

# NOTE: This function is scheduled in core-service/app/main.py 
# using the FastAPI Lifespan context manager.

# NOTE: This function is scheduled in core-service/app/main.py 
# using the FastAPI Lifespan context manager.

# NOTE: This function needs to be scheduled in core-service/app/main.py 
# using asyncio.create_task or similar, or better, via the FastAPI Lifespan.