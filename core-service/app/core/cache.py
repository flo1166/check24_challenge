import redis
import json
from datetime import timedelta
from fastapi import BackgroundTasks # Needed for Revalidate step

# 1. Initialize Redis Client (adjust connection details as needed)
redis_client = redis.Redis(host='redis', port=6379, db=0)

# Define time-to-live constants
TTL = timedelta(minutes=5)
STALE_TTL = timedelta(seconds=30) # How long we'll serve stale data for

def _revalidate_and_update(key: str, fetch_function: callable):
    """Background task to fetch fresh data and update the cache."""
    try:
        fresh_data = fetch_function()
        if fresh_data:
            # Update cache with the new data and a new, full TTL
            redis_client.setex(key, TTL, json.dumps(fresh_data))
    except Exception as e:
        print(f"Background revalidation failed for {key}: {e}")

async def get_with_swr(key: str, fetch_function: callable, background_tasks: BackgroundTasks):
    """SWR logic implementation."""
    cached_data = redis_client.get(key)
    
    if cached_data:
        # Cache Hit: Serve stale data immediately
        data = json.loads(cached_data)
        
        # Check if cache is *also* stale (needs revalidation)
        if redis_client.ttl(key) < TTL.total_seconds() - STALE_TTL.total_seconds():
            # If the remaining TTL is less than our freshness threshold, revalidate
            background_tasks.add_task(_revalidate_and_update, key, fetch_function)
        
        return data
    else:
        # Cache Miss: Fetch synchronously, cache, and return
        data = fetch_function()
        if data:
            redis_client.setex(key, TTL, json.dumps(data))
        return data
    

'''
//TODO: delete comment
SWR Logic:
Checks Cache: Tries to get the data from Redis.

Cache Hit: If found, returns the data immediately (stale) and then triggers a background task (revalidate) to fetch new data and update the cache.

Cache Miss: Fetches the data synchronously, returns it, and caches it.

Why SWR? It serves the user with the old (stale) data instantly while asynchronously fetching fresh data, providing a perceptually fast experience even if the upstream service is slow.

'''