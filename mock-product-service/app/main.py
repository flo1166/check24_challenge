from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import random
import time
from typing import List, Dict, Any

app = FastAPI(title="Mock Product Service")

class Widget(BaseModel):
    widget_id: str = Field(..., description="Unique identifier for the widget")
    component_type: str = Field(..., description="Type of component (Card, Button, etc.)")
    data: Dict[str, Any] = Field(..., description="Dynamic data for the widget")
    priority: int = Field(default=0, description="Priority for rendering order")

class WidgetResponse(BaseModel):
    """The full response from the mock service."""
    widgets: List[Widget] = Field(..., description="A list of widgets to be rendered on the client.")

MOCK_WIDGET_DATA = WidgetResponse(
    widgets=[
        Widget(
            widget_id="car_ins_promo_01",  # New field added
            component_type="Card",
            data={
                "title": "Your Exclusive Car Insurance Deal",
                "subtitle": "Save up to €300/year!",
                "cta_text": "Compare Now",
                # The cta_link will be dynamically updated on each request
                "cta_link": "/car-insurance/compare/1234", 
                "icon": "car_shield",
            },
            priority=100  # New field added
        )
    ]
).model_dump()

@app.get("/widgets/car-insurance/{user_id}", response_model=WidgetResponse)
async def get_car_insurance_widget(user_id: int):
    """
    Simulates fetching the Car Insurance widget for a user with a failure rate.
    """
    
    # 1. 🛑 SIMULATE FAILURE (20% chance of a 500 Internal Server Error)
    if random.random() < 0.2:
        print(f"[{time.strftime('%H:%M:%S')}] MOCK-SERVICE: 🚨 Simulating a 500 error for user {user_id}")
        # Raising an HTTPException will return the desired HTTP status code
        raise HTTPException(
            status_code=500,
            detail="Simulated Internal Server Error: The database is down."
        )

    # 2. ⏳ SIMULATE HIGH LATENCY (10% chance of a 500ms delay)
    if random.random() < 0.1:
        delay_ms = 500
        print(f"[{time.strftime('%H:%M:%S')}] MOCK-SERVICE: 🐌 Simulating {delay_ms}ms high latency for user {user_id}")
        time.sleep(delay_ms / 1000)

    # 3. ✅ SUCCESS PATH (80% of the time, or after the delay)
    print(f"[{time.strftime('%H:%M:%S')}] MOCK-SERVICE: ✨ Success for user {user_id}")

    # Update the dynamic link to ensure we return fresh data
    MOCK_WIDGET_DATA['widgets'][0]['data']['cta_link'] = f"/car-insurance/compare/{random.randint(1000, 9999)}"

    # Returning the dictionary directly; FastAPI handles Pydantic validation
    return MOCK_WIDGET_DATA

@app.get("/")
async def root():
    """Root endpoint for healthcheck"""
    return {"status": "ok", "service": "mock-product-service"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


'''
//TODO: delete comment + mock data + base model centralized?
Now, you will set up the FastAPI application and implement the core endpoint with the crucial failure simulation logic.
'''