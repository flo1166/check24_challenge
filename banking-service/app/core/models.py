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
    __tablename__ = "widgets"
    user_id = Column(Integer, index=True)
    widget_id = Column(String(100), primary_key=True)
    component_type = Column(String(50), index=True)
    priority = Column(Integer, default=0)
    data = Column(JSONB, nullable=False)
    
    def to_sdui_format(self):
        return {
            "widget_id": self.widget_id,
            "component_type": self.component_type,
            "data": self.data,
            "priority": self.priority
        }

class Contracts(Base):
    __tablename__ = "contracts"
    user_id = Column(Integer)
    widget_id = Column(String(100))
    id = Column(Integer, primary_key=True, autoincrement=True)

class ContractRequest(BaseModel):
    user_id: int
    widget_id: str