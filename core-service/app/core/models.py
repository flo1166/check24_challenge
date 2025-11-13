from pydantic import BaseModel
from typing import Dict, Any

class Widget(BaseModel):
    widget_id: str
    component_type: str  # e.g., "Card", "Hero", "TextList"
    data: Dict[str, Any] # Product-specific payload (content)
    priority: int