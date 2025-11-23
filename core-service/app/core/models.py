from pydantic import BaseModel, Field
from typing import Dict, Any
from typing import List, Dict, Any

class Widget(BaseModel):
    widget_id: str = Field(..., description="Unique identifier for the widget")
    component_type: str = Field(..., description="Type of component (Card, Button, etc.)")
    data: Dict[str, Any] = Field(..., description="Dynamic data for the widget")
    priority: int = Field(default=0, description="Priority for rendering order")

class WidgetResponse(BaseModel):
    """The full response from the mock service."""
    widgets: List[Widget] = Field(..., description="A list of widgets to be rendered on the client.")