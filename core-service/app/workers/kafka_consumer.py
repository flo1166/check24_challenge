import json
import logging
import asyncio
from aiokafka import AIOKafkaConsumer
import os

logger = logging.getLogger(__name__)
logging.getLogger("aiokafka").setLevel(logging.INFO)

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9093")

# All Kafka topics
KAFKA_TOPICS = [
    "user.car.insurance.purchased",
    "user.health.insurance.purchased",
    "user.house.insurance.purchased",
    "user.banking.product.purchased"
]

CACHE_KEY_PREFIX = "sdui:home_page:v1"


async def consume_and_invalidate_cache():
    """
    Asynchronous Kafka Consumer that listens to ALL product service topics.
    Listens for contract creation/deletion events and invalidates the Redis cache.
    """
    consumer = AIOKafkaConsumer(
        *KAFKA_TOPICS,  # Subscribe to all topics
        bootstrap_servers=KAFKA_BROKER,
        group_id='widget-cache-invalidator-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        auto_offset_reset='earliest',
        request_timeout_ms=60000,
        retry_backoff_ms=500,
        max_poll_records=500,
    )
    
    # Start the Consumer
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            logger.info(f"Attempting to start Kafka Consumer (Attempt {attempt + 1}/{max_attempts})...")
            await consumer.start()
            logger.info("✅ AIOKafka Consumer started successfully.")
            logger.info(f"📡 Subscribed to topics: {', '.join(KAFKA_TOPICS)}")
            break
        except Exception as e:
            if attempt == max_attempts - 1:
                logger.error(f"❌ Failed to start Kafka Consumer after {max_attempts} attempts: {e}")
                return
            logger.warning(f"Connection failed: {e}. Retrying in 5 seconds...")
            await asyncio.sleep(5)

    try:
        # Consume messages asynchronously
        async for message in consumer:
            event = message.value
            topic = message.topic
            
            logger.info(f"📩 Received event from topic '{topic}': {event}")
            
            # Extract event details
            event_type = event.get("event_type")
            user_id = event.get("user_id")
            widget_id = event.get("widget_id")
            
            # Determine service type from topic
            if "car.insurance" in topic:
                service = "Car Insurance"
            elif "health.insurance" in topic:
                service = "Health Insurance"
            elif "house.insurance" in topic:
                service = "House Insurance"
            elif "banking" in topic:
                service = "Banking"
            else:
                service = "Unknown"
            
            # Handle contract creation/deletion
            if event_type in ["contract_created", "contract_deleted"]:
                logger.info(f"Processing {event_type} for {service}: user {user_id}, widget {widget_id}")
                
                try:
                    # Import redis_client at runtime
                    from app.core.cache import redis_client
                    
                    if redis_client is None:
                        logger.error("❌ Redis client is None - cache cannot be invalidated!")
                        continue
                    
                    # Invalidate the home page cache
                    deleted_count = await redis_client.delete(CACHE_KEY_PREFIX)
                    
                    if deleted_count > 0:
                        logger.info(f"🗑️ Successfully invalidated cache key: {CACHE_KEY_PREFIX}")
                        logger.info(f"   Reason: {event_type} in {service} for user {user_id}")
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
        # Stop the Consumer
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