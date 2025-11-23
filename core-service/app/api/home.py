from fastapi import APIRouter, BackgroundTasks, Depends
from core.models import Widget # The Pydantic model for a single widget
from core.cache import get_with_swr
from core.clients import ProductServiceClient # The Pybreaker-wrapped client

router = APIRouter()

# Dependency function to get the client instance (e.g., using FastAPIs DI)
def get_product_client() -> ProductServiceClient:
    # In a real app, use environment variables for the URL
    return ProductServiceClient(base_url="http://mock-product-service:8001")

@router.get("/home", response_model=list[Widget])
async def home_endpoint(
    background_tasks: BackgroundTasks,
    product_client: ProductServiceClient = Depends(get_product_client)
):
    """
    The main orchestration endpoint.
    1. Fetches data for multiple widgets concurrently using SWR.
    2. Assembles the final list of SDUI models.
    """
    
    # 1. Define the orchestration tasks
    # The lambda acts as the fetch_function for SWR, using the Pybreaker client
    car_insurance_widget = await get_with_swr(
        key="widget:car-insurance",
        fetch_function=lambda: product_client.get_car_insurance_widget_model(),
        background_tasks=background_tasks
    )

    # TODO You would typically add more widget fetching calls here for other services...

    # 2. Assemble the final list, filtering out fallbacks (None)
    all_widgets = [car_insurance_widget] # Add other fetched widgets here
    
    # 3. Filter out any None values (which represent a Circuit Breaker open or service failure fallback)
    final_response = [w for w in all_widgets if w is not None]

    # Note: Pydantic will automatically validate and serialize the list before returning
    return final_response