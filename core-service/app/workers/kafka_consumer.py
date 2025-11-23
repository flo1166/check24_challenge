import json
import logging
from kafka import KafkaConsumer
from redis import Redis
from time import sleep
import os

REDIS_HOST = "redis"  # Name of the service in docker-compose
REDIS_PORT = 6379
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9093") # Internal Docker network name and port
KAFKA_TOPIC = "user.car.insurance.purchased"

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def consume_and_invalidate_cache():
    """
    Initializes a Kafka Consumer and listens for cache invalidation events.
    """
    redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    
    # Simple check to wait for Redis to be available
    while True:
        try:
            redis_client.ping()
            logger.info("✅ Successfully connected to Redis.")
            break
        except Exception:
            logger.warning("Waiting for Redis to start...")
            sleep(3)

    # Wait for Kafka to be available using the Consumer itself
    max_retries = 30
    retry_delay = 5
    consumer = None
    
    for attempt in range(max_retries):
        try:
            consumer = KafkaConsumer(
                KAFKA_TOPIC,
                bootstrap_servers=[KAFKA_BROKER],
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                group_id='widget-cache-invalidator-group',
                value_deserializer=lambda x: json.loads(x.decode('utf-8')),
                request_timeout_ms=30000,
                session_timeout_ms=10000,
            )
            logger.info(f"✅ Successfully connected to Kafka broker at {KAFKA_BROKER}.")
            logger.info(f"👂 Kafka Consumer initialized and listening on topic: {KAFKA_TOPIC}")
            break
            
        except Exception as e:
            logger.warning(f"Waiting for Kafka to start (Attempt {attempt + 1}/{max_retries})... Error: {e}")
            sleep(retry_delay)
    
    if attempt == max_retries - 1 and consumer is None:
        logger.error(f"❌ Failed to connect to Kafka after {max_retries} attempts. Exiting consumer thread.")
        return

    # Consume messages
    try:
        for message in consumer:
            try:
                event = message.value
                logger.info(f"📩 Received event: {event} from partition {message.partition}, offset {message.offset}")
                
                # The event must contain a 'user_id' to perform targeted invalidation
                user_id = event.get('user_id')
                if not user_id:
                    logger.error("Event missing 'user_id', skipping invalidation.")
                    continue
                
                # The cache key structure is 'widget:car_insurance:{user_id}'
                cache_key = f"widget:car_insurance:{user_id}"
                
                # Execute targeted cache invalidation
                deleted_count = redis_client.delete(cache_key)
                
                if deleted_count > 0:
                    logger.info(f"🗑️ Successfully invalidated cache key: {cache_key}")
                else:
                    logger.warning(f"Cache key not found for deletion: {cache_key}")
                    
            except Exception as e:
                logger.error(f"Error processing Kafka message: {e}")
    
    except KeyboardInterrupt:
        logger.info("Consumer interrupted by user.")
    finally:
        if consumer:
            consumer.close()
        logger.info("Consumer closed.")


if __name__ == "__main__":
    consume_and_invalidate_cache()