# ===== LOGGING MUST BE CONFIGURED FIRST =====
from logging.config import dictConfig
from app.core.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)

# ===== NOW IMPORT THE REST =====
import asyncio
import logging
import sys
from typing import Set, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import home
from app.core.cache import init_redis_client, close_redis_client
from app.core.clients import product_service_client
from app.workers.kafka_consumer import consume_and_invalidate_cache

logger = logging.getLogger(__name__)

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
    logger.info("=" * 60)
    logger.info("Application starting up: Initializing dependencies...")
    logger.info("=" * 60)
    
    try:
        # 1. Initialize Async Redis Client
        logger.info("Initializing Redis client...")
        await init_redis_client()
        logger.info("✓ Redis client initialized successfully")
        
    except Exception as e:
        logger.warning(f"⚠ Redis initialization warning: {type(e).__name__}: {e}")
        # Continue anyway; Redis might be unavailable in local dev, but app can still work
    
    try:
        # 2. Start the Async Kafka Consumer as a non-blocking background task
        logger.info("Starting Kafka Consumer as background task...")
        kafka_consumer_task = asyncio.create_task(consume_and_invalidate_cache())
        background_tasks.add(kafka_consumer_task)
        kafka_consumer_task.add_done_callback(background_tasks.discard)
        logger.info("✓ Kafka Consumer background task scheduled with asyncio")
        
    except Exception as e:
        logger.warning(f"⚠ Kafka Consumer warning: {type(e).__name__}: {e}")
        # Continue; Kafka is optional for local development
    
    logger.info("=" * 60)
    logger.info("✓ Application ready to accept requests")
    logger.info("=" * 60)
    
    yield  # <-- Application starts accepting requests here
    
    # --- SHUTDOWN ---
    logger.info("=" * 60)
    logger.info("Application shutting down: Gracefully stopping services...")
    logger.info("=" * 60)
    
    try:
        # 1. Cancel the Kafka Consumer Task
        if kafka_consumer_task and not kafka_consumer_task.done():
            logger.info("Canceling Kafka Consumer task...")
            kafka_consumer_task.cancel()
            # Wait for the consumer to gracefully stop
            await asyncio.gather(kafka_consumer_task, return_exceptions=True)
            logger.info("✓ Kafka Consumer task stopped")
        
        # 2. Close HTTPX Client (Circuit Breaker protected client)
        logger.info("Closing Product Service HTTP client...")
        await product_service_client.close()
        logger.info("✓ Product Service HTTP client closed")
        
        # 3. Close Async Redis Client
        logger.info("Closing Redis client...")
        await close_redis_client()
        logger.info("✓ Redis client closed")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {type(e).__name__}: {e}", exc_info=True)
    
    logger.info("=" * 60)
    logger.info("✓ Application shutdown complete")
    logger.info("=" * 60)

app = FastAPI(
    title="check24-widget-platform Core Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home.router)

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    logger.debug("Health check called")
    return {"status": "healthy", "service": "check24-widget-platform"}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server with Uvicorn...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
'''
//TODO: delete comment
FastAPI app initialization, event handlers
'''
