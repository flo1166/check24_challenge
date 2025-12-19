###############################
### home.py of core-service ###
###############################
"This enables a FastAPI server for the aggregator."

###############
### Imports ###
###############

import logging
import asyncio
import json
from fastapi import APIRouter, status, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import datetime

from app.core.cache import get_with_swr
from app.core.clients import fetch_all_widgets_swr, fetch_user_contracts, close_all_clients

logger = logging.getLogger(__name__)

##################
### Aggregator ###
##################

router = APIRouter()

HOME_PAGE_CACHE_KEY = "sdui:home_page:v1"

class EmptyResultError(Exception):
    """Custom exception raised when the fetched result is empty/invalid."""
    pass

async def fetch_and_serialize_widgets():
    """
    Fetch widgets from ALL product services and serialize them.
    Filters out fallbacks, calculates total, and raises EmptyResultError if ONLY fallbacks exist.
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
        
        return {
            "services": grouped_widgets,
            "timestamp": datetime.datetime.now().isoformat(),
            "cache_key": HOME_PAGE_CACHE_KEY
        }
    
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

@router.delete("/user/{user_id}/contract/{service}/{widget_id}")
async def delete_user_contract(user_id: int, service: str, widget_id: str):
    """
    Deletes a contract for a specific user and service.
    Proxies the deletion request to the appropriate product service.
    
    Args:
        user_id: The user's ID
        service: The service type ('car', 'health', 'house', 'banking')
        widget_id: The widget/contract ID to delete
    """
    logger.info(f"delete_user_contract: Deleting contract for user {user_id}, service {service}, widget {widget_id}")
    
    # Map service names to clients
    from app.core.clients import (
        car_insurance_client,
        health_insurance_client,
        house_insurance_client,
        banking_client
    )
    
    service_map = {
        "car": car_insurance_client,
        "health": health_insurance_client,
        "house": house_insurance_client,
        "banking": banking_client
    }
    
    client = service_map.get(service)
    
    if not client:
        logger.error(f"delete_user_contract: Unknown service type: {service}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown service type: {service}"
        )
    
    try:
        # Call the product service's delete endpoint
        response = await client.client.delete(
            f"{client.endpoint}/contract/{user_id}/{widget_id}"
        )
        
        response.raise_for_status()
        result = response.json()
        
        logger.info(f"delete_user_contract: Successfully deleted contract for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"delete_user_contract: Failed to delete contract: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete contract: {str(e)}"
        )

@router.get("/debug/circuit-breaker-status")
async def get_circuit_breaker_status():
    """
    Debug endpoint to check circuit breaker status
    """
    return {
        "state": "placeholder",
        "fail_counter": 0,
        "last_failure": None,
    }

@router.post("/debug/reset-circuit-breaker")
async def reset_circuit_breaker():
    """
    Debug endpoint to manually reset circuit breaker
    """
    logger.info("Circuit breaker manually reset")
    return {"status": "reset", "new_state": "placeholder"}


@router.get("/stream/updates")
async def stream_updates():
    """
    Server-Sent Events endpoint for real-time updates.
    Clients connect here and receive notifications when cache is invalidated.
    """
    async def event_stream():
        # Create a queue for this client
        client_queue = asyncio.Queue()
        
        try:
            # Import here to avoid circular dependency
            from app.workers.kafka_consumer import add_sse_client, remove_sse_client
            
            # Register this client
            add_sse_client(client_queue)
            logger.info("🔌 New SSE client connected")
            
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE connection established'})}\n\n"
            
            # Keep connection alive and send updates
            while True:
                try:
                    # Wait for updates from Kafka consumer (with timeout to keep connection alive)
                    message = await asyncio.wait_for(client_queue.get(), timeout=30.0)
                    logger.info(f"📤 Sending SSE update to client: {message}")
                    yield f"data: {message}\n\n"
                except asyncio.TimeoutError:
                    # Send keepalive ping every 30 seconds
                    logger.debug("Sending SSE keepalive ping")
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
                except asyncio.CancelledError:
                    logger.info("SSE stream cancelled")
                    break
                    
        except ImportError as e:
            # If kafka_consumer functions don't exist, provide basic SSE
            logger.warning(f"Kafka consumer not available for SSE: {e}")
            logger.info("🔌 SSE client connected (fallback mode)")
            
            yield f"data: {json.dumps({'type': 'connected', 'message': 'SSE connected (fallback)'})}\n\n"
            
            # Fallback: just send keepalive pings
            while True:
                try:
                    await asyncio.sleep(30)
                    yield f"data: {json.dumps({'type': 'ping'})}\n\n"
                except asyncio.CancelledError:
                    break
                    
        except Exception as e:
            logger.error(f"SSE stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
        finally:
            # Unregister client when connection closes
            try:
                from app.workers.kafka_consumer import remove_sse_client
                remove_sse_client(client_queue)
                logger.info("🔌 SSE client disconnected")
            except ImportError:
                logger.info("🔌 SSE client disconnected (fallback mode)")
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )

@router.get("/health")
async def health():
    logger.info("health: Health check called")
    return {"status": "healthy"}