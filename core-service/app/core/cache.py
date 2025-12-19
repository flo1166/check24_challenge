################
### cache.py ###
################
"This enables caching of widgets."

###############
### Imports ###
###############

import redis.asyncio as redis
import json
import os
from datetime import timedelta
from typing import Callable, Any
from fastapi import BackgroundTasks, HTTPException, status
import logging

try:
    from app.api.home import EmptyResultError
except ImportError:
    # Define a temporary placeholder if the exact path is unknown
    class EmptyResultError(Exception): pass

logger = logging.getLogger(__name__)

redis_client: redis.Redis = None 

##############################################
### Configurations / Environment Variables ###
##############################################

TTL = timedelta(hours=1)
SWR_GRACE_PERIOD = timedelta(minutes=5) 
REFRESH_FLAG_SUFFIX = ":is_refreshing"

# Redis connection config from environment variables
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

#############
### Redis ###
#############

async def init_redis_client():
    """
    Initializes the asynchronous Redis client.
    """
    global redis_client
    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True,
            retry_on_timeout=True
        )
        await redis_client.ping()
        logger.info(f"✓ Successfully connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
    except Exception as e:
        logger.error(f"✗ Could not connect to Redis at {REDIS_HOST}:{REDIS_PORT}: {e}")
        raise

async def _revalidate_and_update(key: str, fetch_function: Callable[[], Any]):
    """
    Background task to fetch fresh data and update the cache.
    """
    refresh_flag_key = key + REFRESH_FLAG_SUFFIX
    
    # Use SET NX (Not eXist) to ensure only one refresh task runs
    if await redis_client.set(refresh_flag_key, "true", nx=True, ex=30):
        try:
            logger.info(f"Starting background revalidation for {key}...")
            
            # This call might raise EmptyResultError or a generic network Exception
            fresh_data = await fetch_function() 
            
            # --- MODIFIED: Save only if fetch_function succeeded ---
            await redis_client.setex(key, TTL, json.dumps(fresh_data))
            logger.info(f"✓ Cache key '{key}' refreshed successfully")
            
        except EmptyResultError as e:
            # Catch custom error: Abort save, keep old stale data
            logger.warning(f"⚠ Background revalidation skipped for {key}: Empty result. Old data retained.")
            
        except Exception as e:
            logger.warning(f"✗ Background revalidation failed for {key} (General Error): {e}")
            
        finally:
            # Always delete the flag key after the attempt finishes
            await redis_client.delete(refresh_flag_key)
    else:
        logger.debug(f"Revalidation for {key} is already in progress. Skipping.")

async def get_with_swr(key: str, fetch_function: Callable[[], Any], background_tasks: BackgroundTasks):
    """
    SWR logic implementation (Asynchronous).
    """
    pipe = redis_client.pipeline()
    pipe.get(key)
    pipe.ttl(key)
    
    cached_data, ttl_remaining = await pipe.execute()
    
    if cached_data:
        data = json.loads(cached_data)
        
        # CHECK IF IT'S FALLBACK DATA - DON'T SERVE IT (Guard against old format errors)
        if isinstance(data, list) and len(data) == 1:
            if isinstance(data[0], dict) and data[0].get("widget_id") == "fallback_error_card":
                logger.warning("⚠ Cached data is fallback error card - treating as cache miss")
                cached_data = None  # Force fresh fetch
        
        if cached_data:  # Only use cache if it's not explicitly marked as fallback
            refresh_flag_key = key + REFRESH_FLAG_SUFFIX
            is_refreshing = await redis_client.exists(refresh_flag_key)
            
            swr_grace_seconds = int(SWR_GRACE_PERIOD.total_seconds())
            
            # Check for staleness to trigger background refresh
            if ttl_remaining > 0 and ttl_remaining <= swr_grace_seconds and not is_refreshing:
                # Extend the expiration time to ensure the next request gets the same data
                await redis_client.expire(key, swr_grace_seconds)
                
                logger.info(f"Cache hit (STALE - TTL: {ttl_remaining}s). Triggering background refresh.")
                background_tasks.add_task(_revalidate_and_update, key, fetch_function)
            
            return data
    
    # Cache miss or forced fresh fetch (e.g., due to cached fallback)
    logger.info(f"Cache miss for {key}. Performing foreground fetch.")
    
    try:
        # This call might raise EmptyResultError or a generic network Exception
        data = await fetch_function()
        
        # --- MODIFIED: Save only if fetch_function succeeded without error ---
        await redis_client.setex(key, TTL, json.dumps(data))
        logger.info("✓ Fresh data cached successfully")
        
        return data

    except EmptyResultError as e:
        logger.warning(f"⚠ Foreground fetch failed ({e}). Raising 503 as cache is cold.")
        # If cache is cold AND the fetch returned an empty/invalid result, 
        # we must signal an outage via HTTP exception.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service failed to generate valid data and cache is cold."
        )

    except Exception as e:
        logger.error(f"✗ Foreground fetch failed (Network/Client Error): {e}")
        # If cache is cold AND a general error occurred, signal an outage.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable due to network or client error: {type(e).__name__}"
        )

async def close_redis_client():
    """
    Closes the Redis connection.
    """
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis client closed")