###############################
### home.py of core-service ###
###############################
"This enables a FastAPI server for the aggregator (simplified without caching)."

###############
### Imports ###
###############

import logging
import asyncio
import datetime
from fastapi import APIRouter, status, HTTPException

from app.core.clients import fetch_all_widgets, fetch_user_contracts, close_all_clients

logger = logging.getLogger(__name__)

##################
### Aggregator ###
##################

router = APIRouter()

@router.get("/home")
async def get_home_page_widgets():
    """
    Aggregates data for the home page from all product services.
    Returns widgets grouped by service.
    """
    logger.info("get_home_page_widgets: Starting widget aggregation from all services.")

    try:
        # Fetch widgets from all services
        logger.info("get_home_page_widgets: Calling fetch_all_widgets...")
        grouped_widgets = await fetch_all_widgets()
        
        logger.debug(f"get_home_page_widgets: Received: {type(grouped_widgets)}")
        
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
            "timestamp": datetime.datetime.now().isoformat()
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

@router.get("/health")
async def health():
    logger.info("health: Health check called")
    return {"status": "healthy"}