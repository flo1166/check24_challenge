####################################
### models.py of banking-service ###
####################################
"This unifies the models to expect for widgets."

###############
### Imports ###
###############

from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel

##########################
### SQL Alchemy Models ###
##########################

Base = declarative_base()

class Widget(Base):
    """
    Widget model with flexible component grouping.
    
    Fields:
    - user_id: User identifier
    - widget_id: Unique widget identifier (PRIMARY KEY)
    - component_type: Type of widget (Card, Carousel, etc.)
    - component_id: Groups widgets into display components
    - component_order: Order of component groups (lower = earlier)
    - priority: Widget priority within a component
    - data: JSONB data for the widget
    """
    __tablename__ = 'widgets'
    
    user_id = Column(Integer, nullable=False)
    widget_id = Column(String(100), primary_key=True)
    component_type = Column(String(50), nullable=False)
    component_id = Column(String(100), nullable=False, default='default_component')
    component_order = Column(Integer, nullable=False, default=0)
    priority = Column(Integer, nullable=False, default=0)
    data = Column(JSONB, nullable=False)
    
    def to_sdui_format(self):
        """
        Convert widget to Server-Driven UI format.
        Includes component grouping metadata.
        """
        return {
            "widget_id": self.widget_id,
            "component_type": self.component_type,
            "component_id": self.component_id,
            "component_order": self.component_order,
            "priority": self.priority,
            "data": self.data
        }
    
    def __repr__(self):
        return f"<Widget(id={self.widget_id}, component={self.component_id}, order={self.component_order})>"

class Contracts(Base):
    __tablename__ = "contracts"
    user_id = Column(Integer)
    widget_id = Column(String(100))
    id = Column(Integer, primary_key=True, autoincrement=True)

class ContractRequest(BaseModel):
    user_id: int
    widget_id: str