import logging
import asyncio
from typing import List
from fastapi import APIRouter, status, HTTPException, BackgroundTasks

from app.core.cache import get_with_swr
from app.core.clients import fetch_car_insurance_widget_swr, fetch_user_contracts
from app.core.models import Widget, WidgetResponse

logger = logging.getLogger(__name__)

router = APIRouter()

HOME_PAGE_CACHE_KEY = "sdui:home_page:v1"


async def fetch_and_serialize_widgets():
    """
    Fetch car insurance widgets and serialize them to the expected format.
    """
    logger.info("fetch_and_serialize_widgets: Fetching car insurance widgets...")
    
    try:
        # Fetch the widget data from the product service
        result = await fetch_car_insurance_widget_swr()
        
        logger.debug(f"fetch_and_serialize_widgets: Raw result type: {type(result)}")
        logger.debug(f"fetch_and_serialize_widgets: Raw result: {result}")
        
        # Handle different response formats
        if isinstance(result, dict):
            # If result is a dict with 'widgets' key, extract it
            if "widgets" in result:
                widgets_data = result["widgets"]
                logger.info(f"fetch_and_serialize_widgets: Extracted {len(widgets_data)} widgets from response")
                return widgets_data
            else:
                logger.info("fetch_and_serialize_widgets: Single widget dict, wrapping in list")
                return [result]
        
        elif isinstance(result, list):
            logger.info(f"fetch_and_serialize_widgets: Received list of {len(result)} widgets")
            return result
        
        else:
            logger.error(f"fetch_and_serialize_widgets: Unexpected result type {type(result)}")
            return []
    
    except Exception as e:
        logger.error(f"fetch_and_serialize_widgets: Error fetching widgets - {type(e).__name__}: {e}", exc_info=True)
        raise


@router.get("/home", response_model=WidgetResponse)
async def get_home_page_widgets(background_tasks: BackgroundTasks):
    """
    Aggregates data for the home page from multiple independent widget services.
    Applies SWR logic to the Car Insurance widget for resilience and speed.
    """
    logger.info("get_home_page_widgets: Starting widget aggregation.")

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
            logger.warning("get_home_page_widgets: No widgets returned")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No widgets available from services"
            )
        
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
async def get_user_contracts(user_id: int):
    """
    Fetches the user's car insurance contracts.
    Returns the contract widget if the user has one, otherwise returns empty.
    """
    logger.info(f"get_user_contracts: Fetching contracts for user {user_id}")
    
    try:
        contract_data = await fetch_user_contracts(user_id)
        
        if not contract_data:
            logger.info(f"get_user_contracts: No contracts found for user {user_id}")
            return {"has_contract": False, "contract": None}
        
        logger.info(f"get_user_contracts: Contract found for user {user_id}")
        return {
            "has_contract": True,
            "contract": contract_data
        }
    
    except Exception as e:
        logger.error(f"get_user_contracts: Exception - {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching contracts: {str(e)}"
        )

@router.get("/health")
async def health():
    logger.info("health: Health check called")
    return {"status": "healthy"}

'''    
@router.get(
    "/home", 
    response_model=WidgetResponse,
    summary="Fetch the Server-Driven UI payload for the Home page with SWR caching."
)
async def get_home_page_data(background_tasks: BackgroundTasks):
    """
    The main API endpoint that orchestrates the data retrieval using SWR logic.
    """
    logger.info("get_home_page_data: Endpoint called")
    
    try:
        logger.info("get_home_page_data: Calling get_with_swr...")
        
        # Use the centralized SWR cache function to retrieve data
        data = await get_with_swr(
            key=HOME_PAGE_CACHE_KEY,
            fetch_function=fetch_data_and_serialize,
            background_tasks=background_tasks
        )
        
        logger.info(f"get_home_page_data: Data retrieved from cache/upstream: {data}")
        
        # If data is successfully returned (either fresh or stale), 
        # return the validated model instance.
        result = WidgetResponse(**data)
        logger.info("get_home_page_data: Returning WidgetResponse")
        return result
        
    except Exception as e:
        logger.error(f"get_home_page_data: Exception caught - {type(e).__name__}: {e}", exc_info=True)
        
        # Return a standard 503 error for upstream failures to the client
        raise HTTPException(
            status_code=503, 
            detail=f"Service temporarily unavailable: {str(e)}"
        )

@router.get("/health")
async def health():
    logger.info("health: Health check called")
    return {"status": "healthy"}
'''
#//TODO is it the other way around, so that stuff is send to it and not asked for?