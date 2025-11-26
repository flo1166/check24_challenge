import redis.asyncio as redis
import json
import os
from datetime import timedelta
from typing import Callable, Any
from fastapi import BackgroundTasks
import logging

logger = logging.getLogger(__name__)

# Global asynchronous client
redis_client: redis.Redis = None 

# --- CONFIG ---
TTL = timedelta(hours=1)
SWR_GRACE_PERIOD = timedelta(minutes=5) 
REFRESH_FLAG_SUFFIX = ":is_refreshing"

# Redis connection config from environment variables
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

async def init_redis_client():
    """Initializes the asynchronous Redis client."""
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
    """Background task to fetch fresh data and update the cache."""
    refresh_flag_key = key + REFRESH_FLAG_SUFFIX
    
    if await redis_client.set(refresh_flag_key, "true", nx=True, ex=30):
        try:
            logger.info(f"Starting background revalidation for {key}...")
            fresh_data = await fetch_function() 
            
            if fresh_data:
                await redis_client.setex(key, TTL, json.dumps(fresh_data))
                logger.info(f"✓ Cache key '{key}' refreshed successfully")
            
        except Exception as e:
            logger.warning(f"✗ Background revalidation failed for {key}: {e}")
        finally:
            await redis_client.delete(refresh_flag_key)
    else:
        logger.debug(f"Revalidation for {key} is already in progress. Skipping.")

async def get_with_swr(key: str, fetch_function: Callable[[], Any], background_tasks: BackgroundTasks):
    """SWR logic implementation (Asynchronous)."""
    
    pipe = redis_client.pipeline()
    pipe.get(key)
    pipe.ttl(key)
    
    cached_data, ttl_remaining = await pipe.execute()
    
    if cached_data:
        data = json.loads(cached_data)
        
        refresh_flag_key = key + REFRESH_FLAG_SUFFIX
        is_refreshing = await redis_client.exists(refresh_flag_key)
        
        swr_grace_seconds = int(SWR_GRACE_PERIOD.total_seconds())
        
        if ttl_remaining > 0 and ttl_remaining <= swr_grace_seconds and not is_refreshing:
            await redis_client.expire(key, swr_grace_seconds)
            
            logger.info(f"Cache hit (STALE - TTL: {ttl_remaining}s). Triggering background refresh.")
            background_tasks.add_task(_revalidate_and_update, key, fetch_function)
        
        return data
        
    else:
        logger.info(f"Cache miss for {key}. Performing foreground fetch.")
        
        try:
            data = await fetch_function()
            if data:
                await redis_client.setex(key, TTL, json.dumps(data))
            return data
        except Exception as e:
            logger.error(f"✗ Foreground fetch failed: {e}")
            raise

async def close_redis_client():
    """Closes the Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis client closed")