import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from starlette import status
from app.core.cache import get_with_swr
from app.core.clients import get_product_page_data
from app.core.models import WidgetResponse

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

router = APIRouter()

HOME_PAGE_CACHE_KEY = "sdui:home_page:v1"


async def fetch_data_and_serialize():
    """
    This is the async fetch_function passed to get_with_swr.
    It fetches data, validates it via Pydantic, and returns a dict ready for JSON serialization.
    """
    logger.info("fetch_data_and_serialize: Starting fetch from upstream service...")
    try:
        # 1. Fetch raw data from the upstream service (Circuit Breaker protected)
        raw_data = await get_product_page_data()
        logger.info(f"fetch_data_and_serialize: Raw data received: {raw_data}")
        
        # 2. Validate using the Pydantic model
        validated_model = WidgetResponse(**raw_data)
        logger.info("fetch_data_and_serialize: Data validated successfully")
        
        # 3. Return a dictionary that can be JSON dumped/stored in Redis
        result = validated_model.model_dump()
        logger.info(f"fetch_data_and_serialize: Returning serialized data")
        return result
    except Exception as e:
        logger.error(f"fetch_data_and_serialize: Error - {type(e).__name__}: {e}", exc_info=True)
        raise


@router.get("/home", response_model=WidgetResponse)
async def get_home_page_widgets():
    """
    Aggregates data for the home page from dependent services.
    Simplified version without SWR caching for now - focuses on data flow.
    """
    try:
        logger.info("get_home_page_widgets: Called")
        
        # 1. Fetch raw data from the upstream service (Circuit Breaker protected)
        raw_data = await get_product_page_data()
        logger.info(f"get_home_page_widgets: Raw data received")
        
        # 2. Validate and return
        widget_data = WidgetResponse(**raw_data)
        logger.info("get_home_page_widgets: Data validated and returned successfully")
        return widget_data
        
    except Exception as e:
        logger.error(f"get_home_page_widgets: Error - {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service temporarily unavailable: {str(e)}"
        )
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