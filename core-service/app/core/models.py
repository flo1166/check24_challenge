from pydantic import BaseModel, Field
from typing import List, Dict, Any

# --- 1. Base Widget Contract ---
class Widget(BaseModel):
    widget_id: str = Field(..., description="Unique identifier for the widget instance")
    component_type: str = Field(..., description="Type of component (Card, Button, Input, etc.)")
    data: Dict[str, Any] = Field(..., description="Dynamic key-value pairs specific to the component type (e.g., title, image_url)")
    priority: int = Field(default=0, description="Priority for rendering order")

# --- 2. Aggregated Response Contract ---
class WidgetResponse(BaseModel):
    """The final contract sent from the Core Service (BFF) to the Web Client."""
    widgets: List[Widget] = Field(..., description="A prioritized list of widgets to be rendered.")

# --- 3. Internal Component Props (Optional, but good practice for Card) ---
# Although 'data' is Dict[str, Any], defining expected structures helps documentation.
class CardProps(BaseModel):
    title: str
    subtitle: str
    content: str
    image_url: str
    cta_link: str