import redis.asyncio as redis
import json
from datetime import timedelta
from typing import Callable, Any
from fastapi import BackgroundTasks # Needed for Revalidate step

# Global asynchronous client
redis_client: redis.Redis = None 

# --- CONFIG ---
# Time the data is considered valid
TTL = timedelta(hours=1)
# Time window during which we will serve the stale data, but also trigger a refresh
SWR_GRACE_PERIOD = timedelta(minutes=5) 
# A separate flag key to prevent multiple concurrent background refreshes
REFRESH_FLAG_SUFFIX = ":is_refreshing"

async def init_redis_client():
    """Initializes the asynchronous Redis client."""
    global redis_client
    # Use the appropriate connection details
    redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)
    try:
        await redis_client.ping()
        print("Successfully connected to Redis.")
    except Exception as e:
        print(f"Could not connect to Redis: {e}")

async def _revalidate_and_update(key: str, fetch_function: Callable[[], Any]):
    """Background task to fetch fresh data and update the cache."""
    refresh_flag_key = key + REFRESH_FLAG_SUFFIX
    
    # 1. Set the flag to prevent concurrent refreshes (Locking)
    # Set the flag to expire quickly (e.g., 30 seconds), so a crashed worker doesn't cause a permanent lock
    if await redis_client.set(refresh_flag_key, "true", nx=True, ex=30):
        try:
            print(f"Starting background revalidation for {key}...")
            # 2. Fetch Fresh Data (Note: fetch_function must be made awaitable if it hits another service)
            # Assuming fetch_function is now async/awaitable, or you use run_in_threadpool if it's sync.
            fresh_data = await fetch_function() 
            
            # 3. Update Cache with full TTL
            if fresh_data:
                await redis_client.setex(key, TTL, json.dumps(fresh_data))
                print(f"Cache key '{key}' refreshed successfully.")
            
        except Exception as e:
            print(f"Background revalidation failed for {key}: {e}")
        finally:
            # 4. Clean up the lock
            await redis_client.delete(refresh_flag_key)
    else:
        print(f"Revalidation for {key} is already in progress. Skipping.")

async def get_with_swr(key: str, fetch_function: Callable[[], Any], background_tasks: BackgroundTasks):
    """SWR logic implementation (Asynchronous)."""
    
    # Check if a refresh is already in progress (prevents spamming background tasks)
    refresh_flag_key = key + REFRESH_FLAG_SUFFIX
    is_refreshing = await redis_client.exists(refresh_flag_key)
    
    # 1. Check Cache
    cached_data = await redis_client.get(key)
    
    if cached_data:
        # 2. Cache Hit: Serve stale data immediately
        data = json.loads(cached_data)
        
        # 3. Check for Staleness/Near Expiration & Trigger Revalidation
        ttl_remaining = await redis_client.ttl(key)
        
        # If remaining TTL is less than the grace period AND no refresh is in progress, trigger SWR
        if ttl_remaining is not None and ttl_remaining < SWR_GRACE_PERIOD.total_seconds() and not is_refreshing:
            print(f"Cache hit, but TTL ({ttl_remaining}s) is low. Triggering background refresh.")
            background_tasks.add_task(_revalidate_and_update, key, fetch_function)
        
        return data
        
    else:
        # 4. Cache Miss: Fetch synchronously (in foreground), cache, and return
        print(f"Cache miss for {key}. Performing foreground fetch.")
        
        try:
            data = await fetch_function()
            if data:
                # Cache and serve with the full TTL
                await redis_client.setex(key, TTL, json.dumps(data))
            return data
        except Exception as e:
            print(f"Foreground fetch failed: {e}")
            # If foreground fetch fails, re-raise or return a default response
            # In a resilient app, you might try a secondary cache or default data here.
            raise e   

async def close_redis_client():
    """Closes the Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close() 

'''
//TODO: delete comment
SWR Logic:
Checks Cache: Tries to get the data from Redis.

Cache Hit: If found, returns the data immediately (stale) and then triggers a background task (revalidate) to fetch new data and update the cache.

Cache Miss: Fetches the data synchronously, returns it, and caches it.

Why SWR? It serves the user with the old (stale) data instantly while asynchronously fetching fresh data, providing a perceptually fast experience even if the upstream service is slow.

'''