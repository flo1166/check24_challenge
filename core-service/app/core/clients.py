import httpx
from pybreaker import CircuitBreaker, CircuitBreBreakerError

# 1. Configure the Circuit Breaker:
# After 5 consecutive failures, the circuit will open.
# It will attempt to close again after 30 seconds (half-open state).
product_service_breaker = CircuitBreaker(fail_max=5, reset_timeout=30)

class ProductServiceClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.Client()

    @product_service_breaker
    def fetch_car_insurance_data(self):
        # 2. This is the method protected by the circuit breaker
        response = self.client.get(f"{self.base_url}/widget/car-insurance")
        response.raise_for_status() # Raises an exception on 4xx/5xx status
        return response.json()

    def get_car_insurance_widget_model(self):
        try:
            data = self.fetch_car_insurance_data()
            # 3. Logic to map raw data to your SDUI Pydantic model
            return {"component_type": "Card", "data": data} # Simplified return
        except (CircuitBreBreakerError, httpx.HTTPError) as e:
            # 4. Handle failure: return a default/fallback widget or None
            print(f"Service call failed/breaker open: {e}")
            return None # Return None or a generic Error/Fallback Widget model











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