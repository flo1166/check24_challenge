import httpx
from pybreaker import CircuitBreaker, CircuitBreakerError
from typing import Dict, Any
import os
import logging
import time
import asyncio

CAR_INSURANCE_CACHE: Dict[str, Any] = {}
FRESH_PERIOD_SECONDS = 5
STALE_PERIOD_SECONDS = 30
logger = logging.getLogger(__name__)

FALLBACK_WIDGET_PAYLOAD: Dict[str, Any] = {
    # The 'widget_id' is required by the Pydantic 'Widget' model
    "widget_id": "fallback_error_card",
    "component_type": "Card",
    "data": {
        "header": "Service Temporarily Unavailable",
        "body": "We apologize for the inconvenience. Please try again in a few moments."
    },
    # Set a high priority to ensure it appears in the final response
    "priority": 999 
}

FAILURE_THRESHOLD = 5
RESET_TIMEOUT = 10

# 1. Configure the Circuit Breaker (Global)
# After 5 consecutive failures, the circuit will open.
# It will attempt to close again after 30 seconds (half-open state).
product_service_breaker = CircuitBreaker(fail_max=FAILURE_THRESHOLD, reset_timeout=RESET_TIMEOUT)

def get_fallback_widget(e: CircuitBreakerError):
    logger.warning(f"Circuit Breaker is OPEN. Returning graceful fallback. Error: {e}")
    # Define your Graceful Fallback widget structure here.
    # This structure must match the SDUI Pydantic Widget Model in core/models.py
    return {
        "component_type": "GracefulFallbackCard",
        "title": "We're sorry!",
        "message": "We're currently experiencing a high load. Please try again in a moment.",
        "icon": "warning"
    }

class ProductServiceClient:
    """
    Asynchronous client for the mock-product-service, protected by a Circuit Breaker.
    """
    def __init__(self, base_url: str):
        self.base_url = base_url
        # Use httpx.AsyncClient for non-blocking I/O
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=5.0)

    async def _fetch_and_update_cache(self):
        """
        Internal function to fetch data and update the global cache.
        This runs in the background for revalidation.
        """
        try:
            # Use the existing resilient fetch
            new_data = await self.fetch_car_insurance_data() 
            
            # Success: Update the cache
            CAR_INSURANCE_CACHE.update({
                "data": new_data,
                "timestamp": time.time(),
            })
            logger.info("SWR: Cache successfully updated with fresh data.")
            
        except (CircuitBreakerError, httpx.HTTPError, Exception) as e:
            # If the background revalidation fails, simply log and do nothing.
            # The stale data remains in the cache until the next attempt.
            logger.warning(f"SWR: Background revalidation failed. Cache remains stale. Error: {type(e).__name__}")
    
    async def get_car_insurance_widget_model_swr(self) -> Dict[str, Any]:
        """
        Implements the Stale-While-Revalidate (SWR) logic.
        """
        current_time = time.time()
        
        # --- 1. Check Cache ---
        cached_item = CAR_INSURANCE_CACHE.get("data")
        cached_timestamp = CAR_INSURANCE_CACHE.get("timestamp", 0)
        
        # If we have any cached data at all
        if cached_item:
            time_difference = current_time - cached_timestamp

            # --- 2. FRESH Data (Return immediately) ---
            if time_difference < FRESH_PERIOD_SECONDS:
                logger.info("SWR: Cache hit (FRESH). Returning data immediately.")
                return cached_item

            # --- 3. STALE Data (Return immediately and Revalidate in background) ---
            elif time_difference < STALE_PERIOD_SECONDS:
                logger.warning(f"SWR: Cache hit (STALE - {time_difference:.1f}s old). Returning stale data and starting background revalidation.")
                # Start revalidation asynchronously without awaiting it
                asyncio.create_task(self._fetch_and_update_cache())
                return cached_item
        
        # --- 4. Cache Miss / Too STALE ---
        logger.warning("SWR: Cache miss or data is too stale. Performing primary resilient fetch...")
        
        # Fall back to the original resilient (Circuit Breaker protected) fetch
        try:
            data = await self.fetch_car_insurance_data()
            
            # If successful, immediately update the cache for the next request
            CAR_INSURANCE_CACHE.update({
                "data": data,
                "timestamp": current_time,
            })
            return data
            
        except (CircuitBreakerError, httpx.HTTPError, Exception) as e:
            # Service is DOWN, Circuit is OPEN, AND we have no data in cache (or it expired)
            logger.error(f"SWR: Primary fetch failed. No fresh or stale data available. Error: {type(e).__name__}")
            return FALLBACK_WIDGET_PAYLOAD

    @product_service_breaker
    async def fetch_car_insurance_data(self) -> Dict[str, Any]:
        """
        Fetches data from the mock service asynchronously. Protected by the breaker.
        Calls the correct endpoint with a user_id parameter.
        """
        logger.info("ProductServiceClient: Fetching car insurance data...")
        response = await self.client.get("/widget/car-insurance")
        response.raise_for_status()  # Raises an exception on 4xx/5xx status
        logger.info("ProductServiceClient: Data fetched successfully")
        return response.json()

    async def get_car_insurance_widget_model(self) -> Dict[str, Any]:
        """
        Handles the fetch and provides resilience/fallback logic.
        Returns fallback data if the circuit breaker is open or service fails.
        """
        try:
            data = await self.fetch_car_insurance_data()
            logger.info("ProductServiceClient: Data fetch succeeded")
            return data 
        except CircuitBreakerError as e:
            logger.error(f"ProductServiceClient: Circuit Breaker OPEN: {e}")
            return FALLBACK_WIDGET_PAYLOAD
        except httpx.HTTPError as e:
            logger.error(f"ProductServiceClient: HTTP error - {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD
        except Exception as e:
            logger.error(f"ProductServiceClient: Unexpected error - {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD
            
    async def close(self):
        """Closes the underlying HTTP client connection."""
        await self.client.aclose()
        logger.info("ProductServiceClient: HTTP client closed")


# Global client instance (Use service name from docker-compose)
MOCK_PRODUCT_SERVICE_BASE_URL = os.getenv(
    "MOCK_PRODUCT_SERVICE_URL", 
    "http://mock-product-service:80/"
)
product_service_client = ProductServiceClient(base_url=MOCK_PRODUCT_SERVICE_BASE_URL)
logger.info(f"Initializing ProductServiceClient with URL: {MOCK_PRODUCT_SERVICE_BASE_URL}")

# Public function for home.py to use (matches the old pattern, but is now just a wrapper)
async def fetch_car_insurance_widget_swr():
    """
    The public-facing async function that core-service/app/api/home.py will call,
    implementing the SWR cache and resilience logic.
    """
    # This now calls the SWR-enabled client method
    return await product_service_client.get_car_insurance_widget_model_swr()
#//TODO# NOTE: You must also register product_service_client.close() in your app's lifespan handler!











'''
# TODO: delete comment
DELETE THIS
The goal is to wrap your HTTP client calls to external services (like your mock-product-service/) in a Circuit Breaker to prevent cascading failures.

📝 How to Scale This

As your Backend For Frontend (core-service) grows and needs to talk to more "Speedboat" services, you should implement the pattern like this:
Dependency	Breaker Variable	Service Client	Protected Method
Product Service (Car)	car_insurance_breaker	CarInsuranceClient	@car_insurance_breaker fetch_data()
Product Service (Home)	home_insurance_breaker	HomeInsuranceClient	@home_insurance_breaker fetch_data()
User Profile Service	profile_service_breaker	ProfileServiceClient	@profile_service_breaker fetch_data()

Folder	SDUI Role	Why it's Critical
core/models.py	Defining the Contract	Holds the source-of-truth for the widget JSON structure (the Pydantic schema). Consistency here is vital for multi-platform (Web, App) rendering.
core/clients.py	Data Fulfillment	Manages communication with backend data sources and, crucially, ensures the data fetching is resilient (High Availability).
core/cache.py	Performance Layer	Ensures the contract can be served quickly and scalably, directly supporting the Performance & Scalability requirement.
api/home.py	Orchestration	Contains the logic that stitches the data pieces together and performs the final transformation into the contract.
'''