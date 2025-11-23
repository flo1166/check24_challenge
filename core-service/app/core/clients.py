import httpx
from pybreaker import CircuitBreaker, CircuitBreakerError
from typing import Dict, Any
import os

# 1. Configure the Circuit Breaker (Global)
# After 5 consecutive failures, the circuit will open.
# It will attempt to close again after 30 seconds (half-open state).
product_service_breaker = CircuitBreaker(fail_max=5, reset_timeout=30)

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
        # FIXED: Use the correct endpoint path with user_id
        response = await self.client.get("/widgets/car-insurance/1")
        response.raise_for_status()  # Raises an exception on 4xx/5xx status
        return response.json()

    async def get_car_insurance_widget_model(self) -> Dict[str, Any] | None:
        """
        Handles the fetch and provides resilience/fallback logic.
        """
        try:
            data = await self.fetch_car_insurance_data()
            print("ProductServiceClient: Data fetched successfully.")
            # Logic to map raw data to your SDUI Pydantic model (Simplified for now)
            # This data will be used by home.py's fetch_data_and_serialize function
            return data 
        except (CircuitBreakerError, httpx.HTTPError) as e:
            # Handle failure: Circuit is open or HTTP error occurred.
            print(f"ProductServiceClient: Service call failed/breaker open: {type(e).__name__}: {e}")
            raise  # Re-raise the error to be caught by the SWR logic in home.py
            
    async def close(self):
        """Closes the underlying HTTP client connection."""
        await self.client.aclose()


# Global client instance (Use service name from docker-compose)
MOCK_PRODUCT_SERVICE_BASE_URL = os.getenv(
    "MOCK_PRODUCT_SERVICE_URL", 
    "http://mock-product-service:80/"
)
product_service_client = ProductServiceClient(base_url=MOCK_PRODUCT_SERVICE_BASE_URL)

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