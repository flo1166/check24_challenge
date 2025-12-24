from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, Integer, String, ForeignKeyConstraint, Boolean
from sqlalchemy.orm import relationship, declarative_base
from pydantic import BaseModel

Base = declarative_base()

class Component(Base):
    __tablename__ = 'components'
    
    component_id = Column(String(100), primary_key=True)
    user_id = Column(Integer, primary_key=True, nullable=False)
    component_type = Column(String(50), nullable=False)
    component_order = Column(Integer, default=0)
    
    # Optional: Relationship to easily access widgets from a component
    widgets = relationship("Widget", back_populates="component")

    def to_dict(self):
        return {
            "component_id": self.component_id,
            "user_id": self.user_id,
            "component_type": self.component_type,
            "component_order": self.component_order
        }

class Widget(Base):
    __tablename__ = 'widgets'
    
    user_id = Column(Integer, nullable=False)
    widget_id = Column(String(100), primary_key=True)
    component_type = Column(String(50), nullable=False)
    priority = Column(Integer, default=0)
    data = Column(JSONB, nullable=False)
    component_id = Column(String(100), default='default_component')

    # Foreign key constraint
    __table_args__ = (
        ForeignKeyConstraint(
            ['component_id', 'user_id'],
            ['components.component_id', 'components.user_id'],
            ondelete='CASCADE',
            onupdate='CASCADE'
        ),
    )

    # Relationship
    component = relationship("Component", back_populates="widgets")

    def to_sdui_format(self):
        return {
            "widget_id": self.widget_id,
            "component_id": self.component_id,
            "component_type": self.component_type,
            "priority": self.priority,
            "data": self.data
        }
    
    def to_dict(self):
        # FIXED: Removed non-existent component_order
        return {
            "user_id": self.user_id,
            "widget_id": self.widget_id,
            "component_type": self.component_type,
            "priority": self.priority,
            "data": self.data,
            "component_id": self.component_id,
        }

class Contracts(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    widget_id = Column(String(100), nullable=False)
    type = Column(String(50), nullable=True)

class ContractRequest(BaseModel):
    user_id: int
    widget_id: str