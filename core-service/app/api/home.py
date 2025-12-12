import logging
import asyncio
from typing import List
from fastapi import APIRouter, status, HTTPException, BackgroundTasks

from app.core.cache import get_with_swr
from app.core.clients import fetch_all_widgets_swr, fetch_user_contracts, close_all_clients
from app.core.models import Widget, WidgetResponse
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter()

HOME_PAGE_CACHE_KEY = "sdui:home_page:v1"


async def fetch_and_serialize_widgets():
    """
    Fetch widgets from ALL product services and serialize them.
    """
    logger.info("fetch_and_serialize_widgets: Fetching widgets from all services...")
    
    try:
        # Fetch widgets from all services (aggregated)
        widgets_data = await fetch_all_widgets_swr()
        
        logger.debug(f"fetch_and_serialize_widgets: Received {len(widgets_data)} total widgets")
        
        # Filter out any fallback widgets
        valid_widgets = [
            w for w in widgets_data 
            if w.get("widget_id") != "fallback_error_card"
        ]
        
        logger.info(f"fetch_and_serialize_widgets: Returning {len(valid_widgets)} valid widgets")
        return valid_widgets
    
    except Exception as e:
        logger.error(f"fetch_and_serialize_widgets: Error fetching widgets - {type(e).__name__}: {e}", exc_info=True)
        raise


@router.get("/home", response_model=WidgetResponse)
async def get_home_page_widgets(background_tasks: BackgroundTasks):
    """
    Aggregates data for the home page from all product services.
    Applies SWR logic for resilience and speed.
    """
    logger.info("get_home_page_widgets: Starting widget aggregation from all services.")

    try:
        # Fetch widgets using SWR cache
        logger.info("get_home_page_widgets: Calling get_with_swr...")
        widgets_data = await get_with_swr(
            key=HOME_PAGE_CACHE_KEY,
            fetch_function=fetch_and_serialize_widgets,
            background_tasks=background_tasks
        )
        
        logger.debug(f"get_home_page_widgets: Received from cache/fetch: {type(widgets_data)}")
        
        # Ensure we have a list
        if not isinstance(widgets_data, list):
            logger.warning(f"get_home_page_widgets: widgets_data is not a list, converting...")
            widgets_data = [widgets_data] if widgets_data else []
        
        if not widgets_data:
            logger.info("get_home_page_widgets: Empty widget list")
            widgets_data = []
        
        # Create response
        widget_response = WidgetResponse(widgets=widgets_data)
        logger.info(f"get_home_page_widgets: Aggregation finished. {len(widgets_data)} widgets returned.")
        
        return widget_response
    
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
        "state": str(product_service_breaker.current_state),
        "fail_counter": product_service_breaker.fail_counter,
        "last_failure": str(product_service_breaker.last_failure_time) if hasattr(product_service_breaker, 'last_failure_time') else None,
    }

@router.post("/debug/reset-circuit-breaker")
async def reset_circuit_breaker():
    """Debug endpoint to manually reset circuit breaker"""
    product_service_breaker.reset()
    logger.info("Circuit breaker manually reset")
    return {"status": "reset", "new_state": str(product_service_breaker.current_state)}


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