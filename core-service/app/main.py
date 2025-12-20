###############################
### main.py of core-service ###
###############################
"This enables a FastAPI server for the core-service (without Kafka/Redis)."

###############
### Imports ###
###############

from logging.config import dictConfig
from app.core.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)

from pathlib import Path
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import home

from app.core.clients import (
    car_insurance_client,
    health_insurance_client,
    house_insurance_client,
    banking_client
)

logger = logging.getLogger(__name__)

async def wait_for_services():
    """
    Wait for dependent services to be ready
    """
    logger.info("Waiting for dependent services...")
    
    # Wait for all product services to be ready
    services = [
        ("Car Insurance", car_insurance_client),
        ("Health Insurance", health_insurance_client),
        ("House Insurance", house_insurance_client),
        ("Banking", banking_client)
    ]
    
    for service_name, client in services:
        max_attempts = 15
        for attempt in range(max_attempts):
            try:
                logger.info(f"Checking {service_name} service (attempt {attempt + 1}/{max_attempts})...")
                response = await client.client.get("/health")
                if response.status_code == 200:
                    logger.info(f"✓ {service_name} service is ready!")
                    break
            except Exception as e:
                logger.warning(f"{service_name} service not ready: {e}")
                if attempt < max_attempts - 1:
                    await asyncio.sleep(2)
                else:
                    logger.error(f"⚠ {service_name} service still not ready after waiting")
    
    # Small additional delay for database connections to stabilize
    await asyncio.sleep(1)

###############
### FASTAPI ###
###############

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    This function handles startup and shutdown of the FastAPI.
    
    :param app: The Fast API object
    :type app: FastAPI
    """
    logger.info("=" * 60)
    logger.info("Application starting up: Initializing dependencies...")
    logger.info("=" * 60)
    
    await wait_for_services()
    
    logger.info("=" * 60)
    logger.info("✓ Application ready to accept requests")
    logger.info("=" * 60)
    
    yield 
    
    logger.info("=" * 60)
    logger.info("Application shutting down: Gracefully stopping services...")
    logger.info("=" * 60)
    
    try:
        logger.info("Closing Product Service HTTP clients...")
        await car_insurance_client.close()
        await health_insurance_client.close()
        await house_insurance_client.close()
        await banking_client.close()
        logger.info("✓ Product Service HTTP clients closed")
        
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

ASSETS_PATH = Path("/app/assets")

if ASSETS_PATH.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_PATH)), name="assets")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
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