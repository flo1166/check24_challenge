# /check24-widget-platform/send_event.py
import json
import logging
from kafka import KafkaProducer
from time import sleep

KAFKA_BROKER = "localhost:9092" # Use the host port to run from outside the docker network
KAFKA_TOPIC = "user.car.insurance.purchased"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_invalidation_event(user_id: str):
    """
    Simulates a Product Service sending a 'purchase' event.
    """
    logger.info(f"Connecting to Kafka broker at {KAFKA_BROKER}...")
    try:
        producer = KafkaProducer(
            bootstrap_servers=[KAFKA_BROKER],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            api_version=(0, 10, 1) # Good practice for compatibility
        )
    except Exception as e:
        logger.error(f"Failed to connect to Kafka: {e}")
        return

    # Payload to be sent
    event_data = {
        "user_id": user_id,
        "product_type": "car-insurance",
        "timestamp": "2025-01-01T12:00:00Z"
    }
    
    future = producer.send(KAFKA_TOPIC, event_data)
    
    try:
        record_metadata = future.get(timeout=10)
        logger.info(f"✅ Event sent successfully to: {record_metadata.topic}, partition: {record_metadata.partition}, offset: {record_metadata.offset}")
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
    finally:
        producer.close()

if __name__ == "__main__":
    # Test with a specific user ID
    TEST_USER_ID = "c24_test_user_12345" 
    send_invalidation_event(TEST_USER_ID)