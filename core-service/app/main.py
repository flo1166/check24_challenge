import asyncio
import logging
from typing import Set, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import home 
from app.core.cache import init_redis_client, close_redis_client
from app.core.clients import product_service_client
from app.workers.kafka_consumer import consume_and_invalidate_cache # Assuming this is now ASYNC

# Configure basic logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Type hints for better clarity
background_tasks: Set[asyncio.Task] = set()
kafka_consumer_task: Optional[asyncio.Task] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the application startup and shutdown events using asyncio for all background tasks.
    """
    global kafka_consumer_task

    # --- STARTUP ---
    logger.info("Application starting up: Initializing dependencies...")
    
    # 1. Initialize Async Redis Client
    await init_redis_client()
    
    # 2. Start the Async Kafka Consumer as a non-blocking background task
    # We use asyncio.create_task instead of threading.Thread
    kafka_consumer_task = asyncio.create_task(consume_and_invalidate_cache())
    background_tasks.add(kafka_consumer_task)
    kafka_consumer_task.add_done_callback(background_tasks.discard) # Clean up finished tasks
    logger.info("Kafka Consumer background task scheduled with asyncio.")
    
    yield  # <-- Application starts accepting requests here
    
    # --- SHUTDOWN ---
    logger.info("Application shutting down: Gracefully stopping services...")
    
    # 1. Cancel the Kafka Consumer Task
    if kafka_consumer_task:
        logger.info("Canceling Kafka Consumer task...")
        kafka_consumer_task.cancel()
        # Wait for the consumer to gracefully stop (e.g., aiokafka consumer.stop() in finally)
        await asyncio.gather(kafka_consumer_task, return_exceptions=True) 
        logger.info("Kafka Consumer task stopped.")

    # 2. Close HTTPX Client (Circuit Breaker protected client)
    logger.info("Closing Product Service HTTP client...")
    await product_service_client.close()
    
    # 3. Close Async Redis Client
    logger.info("Closing Redis client...")
    await close_redis_client()
    
    logger.info("Application shutdown complete.")

app = FastAPI(
    title="check24-widget-platform Core Service", 
    lifespan=lifespan # Correctly passing the context manager
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

app.include_router(home.router) # Include the API router

'''
//TODO: delete comment
FastAPI app initialization, event handlers
'''

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)