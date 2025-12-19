##################
### clients.py ###
##################
"This enables the FastAPI server to safely fetch data from multiple microservices."

###############
### Imports ###
###############

import httpx
from pybreaker import CircuitBreaker, CircuitBreakerError
from typing import Dict, Any
import os
import logging
import time
import asyncio

logger = logging.getLogger(__name__)

################
### Fallback ###
################

FALLBACK_WIDGET_PAYLOAD: Dict[str, Any] = {
    "widget_id": "fallback_error_card",
    "component_type": "Card",
    "data": {
        "header": "Service Temporarily Unavailable",
        "body": "We apologize for the inconvenience. Please try again in a few moments."
    },
    "priority": 999 
}

#######################
### Circuit Breaker ###
#######################

FAILURE_THRESHOLD = 5
RESET_TIMEOUT = 10

car_insurance_breaker = CircuitBreaker(fail_max=FAILURE_THRESHOLD, reset_timeout=RESET_TIMEOUT)
health_insurance_breaker = CircuitBreaker(fail_max=FAILURE_THRESHOLD, reset_timeout=RESET_TIMEOUT)
house_insurance_breaker = CircuitBreaker(fail_max=FAILURE_THRESHOLD, reset_timeout=RESET_TIMEOUT)
banking_breaker = CircuitBreaker(fail_max=FAILURE_THRESHOLD, reset_timeout=RESET_TIMEOUT)

##############
### Client ###
##############

class ProductServiceClient:
    """
    Universal client for product services with circuit breaker protection.
    """
    def __init__(self, service_name: str, base_url: str, endpoint: str, breaker: CircuitBreaker):
        self.service_name = service_name
        self.base_url = base_url
        self.endpoint = endpoint
        self.breaker = breaker
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=5.0)
        
        logger.info(f"{service_name} initialized with base_url: {base_url}")

    async def _fetch_and_update_cache(self):
        """
        Background task to fetch fresh data and update cache.
        """
        try:
            logger.info(f"[{self.service_name}] Starting background revalidation")
            new_data = await self.fetch_data() 
            
            self.cache.update({
                "data": new_data,
                "timestamp": time.time(),
            })
            logger.info(f"[{self.service_name}] Cache successfully updated")
            
        except (CircuitBreakerError, httpx.HTTPError, Exception) as e:
            logger.warning(f"[{self.service_name}] Background revalidation failed: {type(e).__name__}: {e}")
    
    async def get_widget_model_swr(self) -> Dict[str, Any]:
        """
        Fetch widget data directly without in-memory caching.
        Caching is handled by Redis in the core service layer.
        """
        logger.info(f"[{self.service_name}] Fetching widget data")
        
        try:
            data = await self.fetch_data()
            logger.info(f"[{self.service_name}] Data fetch succeeded")
            return data
            
        except CircuitBreakerError as e:
            logger.error(f"[{self.service_name}] Circuit Breaker OPEN: {e}")
            return FALLBACK_WIDGET_PAYLOAD
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] HTTP error: {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD
        except Exception as e:
            logger.error(f"[{self.service_name}] Unexpected error: {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD
    
    async def fetch_data(self) -> Dict[str, Any]:
        """
        Fetches data from the service, protected by circuit breaker.
        """
        logger.info(f"[{self.service_name}] Fetching from {self.base_url}{self.endpoint}")
        
        try:
            response = await self.client.get(self.endpoint)
            logger.info(f"[{self.service_name}] Response status: {response.status_code}")
            
            response.raise_for_status()
            result = response.json()
            logger.info(f"[{self.service_name}] Response JSON received")
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] HTTP error: {type(e).__name__}: {e}")
            raise
        except Exception as e:
            logger.error(f"[{self.service_name}] Exception: {type(e).__name__}: {e}")
            raise

    async def get_widget_model(self) -> Dict[str, Any]:
        """
        Handles fetch with resilience/fallback logic.
        """
        try:
            data = await self.fetch_data()
            logger.info(f"[{self.service_name}] Data fetch succeeded")
            return data 
        except CircuitBreakerError as e:
            logger.error(f"[{self.service_name}] Circuit Breaker OPEN: {e}")
            return FALLBACK_WIDGET_PAYLOAD
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] HTTP error: {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD
        except Exception as e:
            logger.error(f"[{self.service_name}] Unexpected error: {type(e).__name__}: {e}")
            return FALLBACK_WIDGET_PAYLOAD

    async def fetch_user_contracts(self, user_id: int) -> Dict[str, Any]:
        """
        Fetches user contracts from the service.
        """
        logger.info(f"[{self.service_name}] Fetching contracts for user {user_id}")
        
        try:
            response = await self.client.get(f"{self.endpoint}/contract/{user_id}")
            logger.info(f"[{self.service_name}] Contract response status: {response.status_code}")
            
            response.raise_for_status()
            result = response.json()
            logger.info(f"[{self.service_name}] Contract response received")
            return result
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.info(f"[{self.service_name}] No contracts found for user {user_id}")
                return None
            logger.error(f"[{self.service_name}] HTTP status error: {type(e).__name__}: {e}")
            raise
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] HTTP error: {type(e).__name__}: {e}")
            raise
        except Exception as e:
            logger.error(f"[{self.service_name}] Exception: {type(e).__name__}: {e}")
            raise

    async def get_user_contracts(self, user_id: int) -> Dict[str, Any]:
        """
        Handles fetching user contracts with resilience.
        """
        try:
            data = await self.fetch_user_contracts(user_id)
            logger.info(f"[{self.service_name}] Contract fetch succeeded for user {user_id}")
            return data if data else {}
        except CircuitBreakerError as e:
            logger.error(f"[{self.service_name}] Circuit Breaker OPEN: {e}")
            return {}
        except httpx.HTTPError as e:
            logger.error(f"[{self.service_name}] HTTP error: {type(e).__name__}: {e}")
            return {}
        except Exception as e:
            logger.error(f"[{self.service_name}] Unexpected error: {type(e).__name__}: {e}")
            return {}
            
    async def close(self):
        """Closes the HTTP client."""
        await self.client.aclose()
        logger.info(f"[{self.service_name}] HTTP client closed")

#########################
### Service Instances ###
#########################

# Car Insurance Service
CAR_INSURANCE_SERVICE_URL = os.getenv("CAR_INSURANCE_SERVICE_URL", "http://localhost:8001")
car_insurance_client = ProductServiceClient(
    service_name="CarInsurance",
    base_url=CAR_INSURANCE_SERVICE_URL,
    endpoint="/widget/car-insurance",
    breaker=car_insurance_breaker
)

# Health Insurance Service
HEALTH_INSURANCE_SERVICE_URL = os.getenv("HEALTH_INSURANCE_SERVICE_URL", "http://localhost:8002")
health_insurance_client = ProductServiceClient(
    service_name="HealthInsurance",
    base_url=HEALTH_INSURANCE_SERVICE_URL,
    endpoint="/widget/health-insurance",
    breaker=health_insurance_breaker
)

# House Insurance Service
HOUSE_INSURANCE_SERVICE_URL = os.getenv("HOUSE_INSURANCE_SERVICE_URL", "http://localhost:8003")
house_insurance_client = ProductServiceClient(
    service_name="HouseInsurance",
    base_url=HOUSE_INSURANCE_SERVICE_URL,
    endpoint="/widget/house-insurance",
    breaker=house_insurance_breaker
)

# Banking Service
BANKING_SERVICE_URL = os.getenv("BANKING_SERVICE_URL", "http://localhost:8004")
banking_client = ProductServiceClient(
    service_name="Banking",
    base_url=BANKING_SERVICE_URL,
    endpoint="/widget/banking",
    breaker=banking_breaker
)

########################
### Public API calls ###
########################

async def fetch_all_widgets_swr() -> Dict[str, Any]:
    """
    Aggregates widgets from all product services.
    Returns widgets grouped by service.
    """
    logger.info("Fetching widgets from all services...")
    
    # Fetch from all services concurrently
    results = await asyncio.gather(
        car_insurance_client.get_widget_model_swr(),
        health_insurance_client.get_widget_model_swr(),
        house_insurance_client.get_widget_model_swr(),
        banking_client.get_widget_model_swr(),
        return_exceptions=True
    )
    
    # Group widgets by service
    service_configs = [
        {"key": "car_insurance", "name": "CarInsurance", "title": "Car Insurance Deals"},
        {"key": "health_insurance", "name": "HealthInsurance", "title": "Health Insurance Deals"},
        {"key": "house_insurance", "name": "HouseInsurance", "title": "House Insurance Deals"},
        {"key": "banking", "name": "Banking", "title": "Banking & Money Deals"}
    ]
    
    grouped_widgets = {}
    total_count = 0
    
    for i, result in enumerate(results):
        config = service_configs[i]
        service_key = config["key"]
        service_name = config["name"]
        service_title = config["title"]
        
        if isinstance(result, Exception):
            logger.error(f"[{service_name}] Exception during fetch: {result}")
            grouped_widgets[service_key] = {
                "title": service_title,
                "widgets": []
            }
            continue
        
        if isinstance(result, dict):
            if "widgets" in result:
                widgets = result["widgets"]
                # Tag each widget with its service source
                for widget in widgets:
                    widget["service"] = service_key
                
                logger.info(f"[{service_name}] Retrieved {len(widgets)} widgets")
                grouped_widgets[service_key] = {
                    "title": service_title,
                    "widgets": widgets
                }
                total_count += len(widgets)
            else:
                logger.warning(f"[{service_name}] No 'widgets' key in response")
                grouped_widgets[service_key] = {
                    "title": service_title,
                    "widgets": []
                }
        else:
            grouped_widgets[service_key] = {
                "title": service_title,
                "widgets": []
            }
    
    logger.info(f"Total widgets aggregated: {total_count} across {len(grouped_widgets)} services")
    return grouped_widgets

async def fetch_user_contracts(user_id: int, service: str = "car"):
    """
    Fetches user contracts from a specific service.
    service: "car", "health", "house", or "banking"
    """
    clients = {
        "car": car_insurance_client,
        "health": health_insurance_client,
        "house": house_insurance_client,
        "banking": banking_client
    }
    
    client = clients.get(service)
    if not client:
        logger.error(f"Unknown service: {service}")
        return {}
    
    return await client.get_user_contracts(user_id)

async def close_all_clients():
    """Closes all HTTP clients."""
    await asyncio.gather(
        car_insurance_client.close(),
        health_insurance_client.close(),
        house_insurance_client.close(),
        banking_client.close()
    )
    logger.info("All service clients closed")