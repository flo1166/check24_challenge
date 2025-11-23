from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api import home # Import your new orchestration router
from app.core.cache import init_redis_client, close_redis_client
from app.core.clients import product_service_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the application startup and shutdown events.
    """
    # --- STARTUP ---
    print("Application starting up: Initializing Redis client...")
    await init_redis_client()
    
    yield  # <-- This is the point where the application starts accepting requests
    
    # --- SHUTDOWN ---
    print("Application shutting down: Closing Redis client...")
    await close_redis_client()
    await product_service_client.close()
    print("Application shutdown complete.")

app = FastAPI(
    title="check24-widget-platform Core Service", 
    lifespan=lifespan # <-- CRITICAL CHANGE: Pass the function here
)

app.include_router(home.router) # Include the router

'''
//TODO: delete comment
FastAPI app initialization, event handlers
'''