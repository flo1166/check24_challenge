import httpx
from pybreaker import CircuitBreaker, CircuitBreakerError
from typing import Dict, Any
import os
import logging

logger = logging.getLogger(__name__)

FALLBACK_WIDGET_PAYLOAD: Dict[str, Any] = {
    "title": "Welcome to CHECK24",
    "widgets": [
        {
            "component_type": "Card",
            "data": {
                "header": "Service Temporarily Unavailable",
                "body": "We apologize for the inconvenience. Please try again in a few moments."
            }
        }
    ]
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
async def get_product_page_data():
    """
    The public-facing async function that core-service/app/api/home.py will call.
    """
    return await product_service_client.get_car_insurance_widget_model()
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