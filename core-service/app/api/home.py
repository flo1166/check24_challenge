import logging
import asyncio
import json
from typing import List, Dict, Any
from fastapi import APIRouter, status, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse

from app.core.cache import get_with_swr
from app.core.clients import fetch_all_widgets_swr, fetch_user_contracts, close_all_clients

logger = logging.getLogger(__name__)

router = APIRouter()

HOME_PAGE_CACHE_KEY = "sdui:home_page:v1"

class EmptyResultError(Exception):
    """Custom exception raised when the fetched result is empty/invalid."""
    pass

async def fetch_and_serialize_widgets():
    """
    Fetch widgets from ALL product services and serialize them.
    Filters out fallbacks, calculates total, and raises EmptyResultError if total is zero.
    Returns grouped widgets by service.
    """
    logger.info("fetch_and_serialize_widgets: Fetching widgets from all services...")
    
    total_valid_widgets = 0
    grouped_widgets = {}
    
    try:
        # 1. Fetch widgets from all services (now returns grouped dict)
        grouped_widgets = await fetch_all_widgets_swr()
        
        logger.debug(f"fetch_and_serialize_widgets: Received widgets from {len(grouped_widgets)} services")
        
        # 2. Filter out fallback widgets from each service and count valid widgets
        for service_key in grouped_widgets:
            service_data = grouped_widgets[service_key]
            
            # Ensure 'widgets' key exists and is iterable before filtering
            if isinstance(service_data, dict) and 'widgets' in service_data:
                valid_widgets = [
                    w for w in service_data["widgets"]
                    if w.get("widget_id") != "fallback_error_card"
                ]
                
                # Update the data structure with filtered widgets
                service_data["widgets"] = valid_widgets
                total_valid_widgets += len(valid_widgets)
                
                logger.info(f"fetch_and_serialize_widgets: {service_key} has {len(valid_widgets)} valid widgets")
            else:
                # This branch handles cases where a service entry is malformed or missing the 'widgets' key.
                logger.warning(f"fetch_and_serialize_widgets: Skipping malformed data for {service_key}")
                service_data["widgets"] = [] # Set to empty list to avoid downstream errors
        
        
        # 3. >>> CRITICAL VALIDATION CHECK <<<
        # If we have an aggregation structure (at least one service key) but zero valid widgets,
        # we consider this a failure state and prevent caching.
        if total_valid_widgets == 0 and len(grouped_widgets) > 0:
            logger.error("fetch_and_serialize_widgets: Aggregation resulted in 0 valid widgets. Raising EmptyResultError to prevent cache update.")
            
            # The cache.py file must catch this specific exception and abort the save.
            raise EmptyResultError("Aggregation returned zero valid widgets.")

        
        return grouped_widgets
    
    except EmptyResultError:
        # Re-raise the custom exception immediately so the caching layer can handle it
        raise
        
    except Exception as e:
        logger.error(f"fetch_and_serialize_widgets: Error fetching widgets - {type(e).__name__}: {e}", exc_info=True)
        # If a generic error occurs, let it propagate to the API endpoint via the cache error handler
        raise


@router.get("/home")
async def get_home_page_widgets(background_tasks: BackgroundTasks):
    """
    Aggregates data for the home page from all product services.
    Applies SWR logic for resilience and speed.
    Returns widgets grouped by service.
    """
    logger.info("get_home_page_widgets: Starting widget aggregation from all services.")

    try:
        # Fetch widgets using SWR cache
        logger.info("get_home_page_widgets: Calling get_with_swr...")
        grouped_widgets = await get_with_swr(
            key=HOME_PAGE_CACHE_KEY,
            fetch_function=fetch_and_serialize_widgets,
            background_tasks=background_tasks
        )
        
        logger.debug(f"get_home_page_widgets: Received from cache/fetch: {type(grouped_widgets)}")
        
        # Ensure we have a dict
        if not isinstance(grouped_widgets, dict):
            logger.warning(f"get_home_page_widgets: grouped_widgets is not a dict, converting...")
            grouped_widgets = {}
        
        if not grouped_widgets:
            logger.info("get_home_page_widgets: Empty grouped widgets")
            grouped_widgets = {}
        
        # Count total widgets across all services
        total_widgets = sum(len(service["widgets"]) for service in grouped_widgets.values())
        logger.info(f"get_home_page_widgets: Aggregation finished. {total_widgets} total widgets across {len(grouped_widgets)} services.")
        
        return {"services": grouped_widgets}
    
    except HTTPException:
        logger.debug("[DEBUG] HTTPException raised - re-raising")
        raise
    
    except Exception as e:
        logger.error(f"get_home_page_widgets: Exception - {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service error: {str(e)}"
        )


@router.get("/user/{user_id}/contracts")
async def get_user_contracts_endpoint(user_id: int):
    """
    Fetches the user's contracts from all services.
    Returns contracts grouped by service.
    """
    logger.info(f"get_user_contracts: Fetching contracts for user {user_id} from all services")
    
    try:
        # Fetch contracts from all services concurrently
        results = await asyncio.gather(
            fetch_user_contracts(user_id, "car"),
            fetch_user_contracts(user_id, "health"),
            fetch_user_contracts(user_id, "house"),
            fetch_user_contracts(user_id, "banking"),
            return_exceptions=True
        )
        
        contracts = {
            "car_insurance": results[0] if not isinstance(results[0], Exception) else None,
            "health_insurance": results[1] if not isinstance(results[1], Exception) else None,
            "house_insurance": results[2] if not isinstance(results[2], Exception) else None,
            "banking": results[3] if not isinstance(results[3], Exception) else None,
        }
        
        # Filter out None values
        contracts = {k: v for k, v in contracts.items() if v}
        
        has_any_contract = len(contracts) > 0
        
        logger.info(f"get_user_contracts: Found {len(contracts)} contract(s) for user {user_id}")
        
        return {
            "has_contract": has_any_contract,
            "contracts": contracts
        }
    
    except Exception as e:
        logger.error(f"get_user_contracts: Exception - {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching contracts: {str(e)}"
        )

@router.get("/debug/circuit-breaker-status")
async def get_circuit_breaker_status():
    """Debug endpoint to check circuit breaker status"""
    return {
        "state": "placeholder",
        "fail_counter": 0,
        "last_failure": None,
    }

@router.post("/debug/reset-circuit-breaker")
async def reset_circuit_breaker():
    """Debug endpoint to manually reset circuit breaker"""
    logger.info("Circuit breaker manually reset")
    return {"status": "reset", "new_state": "placeholder"}


@router.get("/stream/updates")
async def stream_updates():
    async def event_stream():
        while True:
            # Wait for Kafka events or other triggers
            yield f"data: {json.dumps({'update': 'available'})}\n\n"
            await asyncio.sleep(30)
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/health")
async def health():
    logger.info("health: Health check called")
    return {"status": "healthy"}
#//TODO is it the other way around, so that stuff is send to it and not asked for?