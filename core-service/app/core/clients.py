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
    "widget_id": "fallback_error_card",
    "component_type": "Card",
    "data": {
        "header": "Service Temporarily Unavailable",
        "body": "We apologize for the inconvenience. Please try again in a few moments."
    },
    "priority": 999 
}

FAILURE_THRESHOLD = 5
RESET_TIMEOUT = 10

# Circuit Breaker
product_service_breaker = CircuitBreaker(fail_max=FAILURE_THRESHOLD, reset_timeout=RESET_TIMEOUT)

def get_fallback_widget(e: CircuitBreakerError):
    logger.warning(f"Circuit Breaker is OPEN. Returning graceful fallback. Error: {e}")
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
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=5.0)
        print(f"[DEBUG] ProductServiceClient initialized with base_url: {self.base_url}")
        logger.info(f"ProductServiceClient initialized with base_url: {self.base_url}")

    async def _fetch_and_update_cache(self):
        """
        Internal function to fetch data and update the global cache.
        This runs in the background for revalidation.
        """
        try:
            print("[DEBUG] _fetch_and_update_cache: Starting background revalidation")
            new_data = await self.fetch_car_insurance_data() 
            
            CAR_INSURANCE_CACHE.update({
                "data": new_data,
                "timestamp": time.time(),
            })
            logger.info("SWR: Cache successfully updated with fresh data.")
            print("[DEBUG] SWR: Cache updated successfully")
            
        except (CircuitBreakerError, httpx.HTTPError, Exception) as e:
            logger.warning(f"SWR: Background revalidation failed. Error: {type(e).__name__}: {e}")
            print(f"[DEBUG] _fetch_and_update_cache FAILED: {type(e).__name__}: {e}")
    
    async def get_car_insurance_widget_model_swr(self) -> Dict[str, Any]:
        """
        Implements the Stale-While-Revalidate (SWR) logic.
        """
        print("[DEBUG] get_car_insurance_widget_model_swr called")
        logger.info("get_car_insurance_widget_model_swr called")
        
        current_time = time.time()
        
        # Check Cache
        cached_item = CAR_INSURANCE_CACHE.get("data")
        cached_timestamp = CAR_INSURANCE_CACHE.get("timestamp", 0)
        
        print(f"[DEBUG] Cache check - cached_item exists: {cached_item is not None}, timestamp: {cached_timestamp}")
        
        # If we have any cached data at all
        if cached_item:
            time_difference = current_time - cached_timestamp

            # FRESH Data (Return immediately)
            if time_difference < FRESH_PERIOD_SECONDS:
                logger.info("SWR: Cache hit (FRESH). Returning data immediately.")
                print(f"[DEBUG] Returning FRESH cache data (age: {time_difference:.1f}s)")
                return cached_item

            # STALE Data (Return immediately and Revalidate in background)
            elif time_difference < STALE_PERIOD_SECONDS:
                logger.warning(f"SWR: Cache hit (STALE - {time_difference:.1f}s old).")
                print(f"[DEBUG] Returning STALE cache data (age: {time_difference:.1f}s), revalidating in background")
                asyncio.create_task(self._fetch_and_update_cache())
                return cached_item
        
        # Cache Miss / Too STALE
        logger.warning("SWR: Cache miss or data is too stale. Performing primary resilient fetch...")
        print("[DEBUG] Cache miss or too stale - fetching fresh data")
        
        try:
            data = await self.fetch_car_insurance_data()
            print(f"[DEBUG] Fresh data fetched successfully, type: {type(data)}")
            
            # Update cache
            CAR_INSURANCE_CACHE.update({
                "data": data,
                "timestamp": current_time,
            })
            return data
            
        except (CircuitBreakerError, httpx.HTTPError, Exception) as e:
            logger.error(f"SWR: Primary fetch failed. Error: {type(e).__name__}: {e}")
            print(f"[DEBUG] PRIMARY FETCH FAILED: {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD

    @product_service_breaker
    async def fetch_car_insurance_data(self) -> Dict[str, Any]:
        """
        Fetches data from the mock service asynchronously. Protected by the breaker.
        """
        print(f"[DEBUG] fetch_car_insurance_data: Making request to {self.base_url}/widget/car-insurance")
        logger.info(f"ProductServiceClient: Fetching from {self.base_url}/widget/car-insurance")
        
        try:
            response = await self.client.get("/widget/car-insurance")
            print(f"[DEBUG] Response status: {response.status_code}")
            logger.info(f"Response status: {response.status_code}")
            
            response.raise_for_status()
            result = response.json()
            print(f"[DEBUG] Response JSON: {result}")
            logger.info(f"Response JSON received: {type(result)}")
            return result
            
        except httpx.HTTPError as e:
            print(f"[DEBUG] HTTP Error: {type(e).__name__}: {e}")
            logger.error(f"HTTP error: {type(e).__name__}: {e}")
            raise
        except Exception as e:
            print(f"[DEBUG] Exception in fetch_car_insurance_data: {type(e).__name__}: {e}")
            logger.error(f"Exception: {type(e).__name__}: {e}")
            raise

    async def get_car_insurance_widget_model(self) -> Dict[str, Any]:
        """
        Handles the fetch and provides resilience/fallback logic.
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

    @product_service_breaker
    async def fetch_user_car_contracts(self, user_id: int) -> Dict[str, Any]:
        """
        Fetches the user's car insurance contracts from the mock service.
        Protected by the circuit breaker.
        """
        print(f"[DEBUG] fetch_user_car_contracts: Fetching contracts for user {user_id}")
        logger.info(f"ProductServiceClient: Fetching contracts for user {user_id}")
        
        try:
            response = await self.client.get(f"/widget/car-insurance/contract/{user_id}")
            print(f"[DEBUG] Response status: {response.status_code}")
            logger.info(f"Response status: {response.status_code}")
            
            response.raise_for_status()
            result = response.json()
            print(f"[DEBUG] Contract response JSON: {result}")
            logger.info(f"Contract response received: {type(result)}")
            return result
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.info(f"No contracts found for user {user_id}")
                return None
            print(f"[DEBUG] HTTP Status Error: {type(e).__name__}: {e}")
            logger.error(f"HTTP status error: {type(e).__name__}: {e}")
            raise
        except httpx.HTTPError as e:
            print(f"[DEBUG] HTTP Error: {type(e).__name__}: {e}")
            logger.error(f"HTTP error: {type(e).__name__}: {e}")
            raise
        except Exception as e:
            print(f"[DEBUG] Exception in fetch_user_car_contracts: {type(e).__name__}: {e}")
            logger.error(f"Exception: {type(e).__name__}: {e}")
            raise

    async def get_user_car_contracts(self, user_id: int) -> Dict[str, Any]:
        """
        Handles fetching user contracts with resilience/fallback logic.
        """
        try:
            data = await self.fetch_user_car_contracts(user_id)
            logger.info(f"ProductServiceClient: Contract fetch succeeded for user {user_id}")
            print(f"[DEBUG] Contract fetch succeeded for user {user_id}")
            return data if data else {}
        except CircuitBreakerError as e:
            logger.error(f"ProductServiceClient: Circuit Breaker OPEN: {e}")
            print(f"[DEBUG] Circuit breaker OPEN: {e}")
            return {}
        except httpx.HTTPError as e:
            logger.error(f"ProductServiceClient: HTTP error - {type(e).__name__}: {e}")
            print(f"[DEBUG] HTTP error: {type(e).__name__}: {e}")
            return {}
        except Exception as e:
            logger.error(f"ProductServiceClient: Unexpected error - {type(e).__name__}: {e}")
            print(f"[DEBUG] Unexpected error: {type(e).__name__}: {e}")
            return {}
            
    async def close(self):
        """Closes the underlying HTTP client connection."""
        await self.client.aclose()
        logger.info("ProductServiceClient: HTTP client closed")

# Global client instance
MOCK_PRODUCT_SERVICE_BASE_URL = os.getenv(
    "MOCK_PRODUCT_SERVICE_URL", 
    "http://localhost:8001"
)
product_service_client = ProductServiceClient(base_url=MOCK_PRODUCT_SERVICE_BASE_URL)

async def fetch_car_insurance_widget_swr():
    """
    The public-facing async function that home.py calls.
    """
    return await product_service_client.get_car_insurance_widget_model_swr()

async def fetch_user_contracts(user_id: int):
    """
    The public-facing async function to fetch user contracts.
    """
    return await product_service_client.get_user_car_contracts(user_id)








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