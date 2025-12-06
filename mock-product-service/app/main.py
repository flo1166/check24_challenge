# ===== LOGGING MUST BE CONFIGURED FIRST =====
from logging.config import dictConfig
from app.core.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)

# ===== NOW IMPORT THE REST =====
import random
import logging
import os
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# --- 1. Database Configuration and Engine (KEPT) ---

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = "5432"

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

logger.info(f"Connecting to database: {DB_HOST}:{DB_PORT}/{DB_NAME}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. SQLAlchemy ORM Model (KEPT) ---

class Widget(Base):
    """
    SQLAlchemy model reflecting the new, simplified database structure.
    It now uses JSONB for the dynamic data field.
    """
    __tablename__ = "widgets"

    user_id = Column(Integer, index=True) 
    widget_id = Column(String(100), primary_key=True)
    component_type = Column(String(50), index=True)
    priority = Column(Integer, default=0)
    data = Column(JSONB, nullable=False) # Maps to the JSONB column in the DB
    
    def to_sdui_format(self):
        """Converts the ORM object to the required Widget Pydantic model dictionary format."""
        return {
            "widget_id": self.widget_id,
            "component_type": self.component_type,
            "data": self.data, # This is the dynamic dictionary from the JSONB field
            "priority": self.priority
        }

class Contracts(Base):
    """
    SQLAlchemy model reflecting the new, simplified database structure.
    It now uses JSONB for the dynamic data field.
    """
    __tablename__ = "contracts"

    user_id = Column(Integer) 
    widget_id = Column(String(100))
    id = Column(Integer, primary_key=True, autoincrement=True)

class ContractRequest(BaseModel):
    user_id: int
    widget_id: str

# --- 3. FastAPI Dependency for Database Session (KEPT) ---
def get_db():
    """Dependency that yields a database session and ensures it's closed."""
    db = None # Initialize db to None
    try:
        # The connection attempt that often fails is here
        db = SessionLocal() 
        yield db
    except OperationalError as e:
        # 💡 This CRITICAL log will now be written to your console and file!
        logger.critical(f"FATAL DB CONNECTION ERROR: {e}", exc_info=True)
        # Raise an HTTPException, which FastAPI handles gracefully
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Database service is unavailable."
        )
    finally:
        if db:
            db.close()

# --- 4. FastAPI App Initialization and Endpoint ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 3. Allow your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Returns a simple message confirming the service is running."""
    logger.info("Root endpoint called")
    return {"message": "Mock Product Service is running. Try /health or /widget/car-insurance"}

# Health Check 
@app.get("/health")
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}


@app.get("/widget/car-insurance")
def get_car_insurance_widget(db: Session = Depends(get_db)):
    """
    Fetches all car insurance widgets from the database using SQLAlchemy ORM.
    """
    logger.info('API call: /widget/car-insurance starts')
    
    # 1. Simulate a failure rate (Circuit Breaker test) - DISABLED
    '''
    if random.random() < 0.2:
        logger.info('API call: /widget/car-insurance failed (simulated)')
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Simulated upstream service failure"
        )
    //TODO: activate random again
    '''
        
    try:
        # 2. Query all 'default' widgets (the 10 car deals)
        stmt = select(Widget).filter(Widget.user_id == 123).order_by(func.random()).limit(6)
        widgets_orm = db.scalars(stmt).all()
        
        # 3. Format the results into the SDUI response structure
        widgets_list = [widget.to_sdui_format() for widget in widgets_orm]
        
        logger.info(f'API call: /widget/car-insurance {len(widgets_list)} widgets were loaded')

        return {
            "widgets": widgets_list
        }

    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve data from product service database (DB Connection Error)."
        )
    
@app.get("/widget/car-insurance/{widget_id}")
def get_car_insurance_widget(widget_id: str, db: Session = Depends(get_db)):
    """
    Fetches specific car insurance widgets from the database using SQLAlchemy ORM.
    """
    logger.info('API call: /widget/car-insurance starts')
    
    try:
        # 2. Query all 'default' widgets (the 10 car deals)
        stmt = select(Widget).filter(Widget.user_id == 123).filter(Widget.widget_id == widget_id).limit(1)
        widgets_orm = db.scalars(stmt).all()
        
        # 3. Format the results into the SDUI response structure
        widgets_list = [widget.to_sdui_format() for widget in widgets_orm]
        
        logger.info(f'API call: /widget/car-insurance {len(widgets_list)} widgets were loaded')

        return {
            "widgets": widgets_list
        }

    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve data from product service database (DB Connection Error)."
        )

@app.post("/widget/car-insurance/contract")
def post_car_insurance_contract(contract_data: ContractRequest, db: Session = Depends(get_db)):
    """
    Endpoint to create a contract for a given user and widget.
    """
    user_id = contract_data.user_id
    widget_id = contract_data.widget_id

    logger.info(f'API call: /widget/car-insurance/contract/{user_id}/{widget_id} starts')
    
    try:
        # Create a new contract entry
        new_contract = Contracts(user_id=user_id, widget_id=widget_id)
        db.add(new_contract)
        db.commit()
        db.refresh(new_contract) # Get the newly created object with its ID
        
        logger.info(f'API call completed successfully. Contract ID: {new_contract.id}')

        return {
            "message": "Contract created successfully",
            "contract_id": new_contract.id, # Return the DB ID
            "user_id": user_id,
            "widget_id": widget_id
        }

    except OperationalError as e:
        logger.error(f"Database insert error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create contract in product service database (DB Connection Error)."
        )

@app.delete("/widget/car-insurance/contract/{user_id}/{widget_id}")
def delete_car_insurance_contract(user_id: int, widget_id: str, db: Session = Depends(get_db)):
    """
    Endpoint to delete a contract for a given user and widget.
    """
    logger.info(f'API call: /widget/car-insurance/contract/{user_id}/{widget_id} starts')
    
    try:
        # Delete the contract entry
        stmt = select(Contracts).filter(
            Contracts.user_id == user_id,
            Contracts.widget_id == widget_id
        )
        contract = db.scalars(stmt).first()
        
        if contract:
            db.delete(contract)
            db.commit()
            logger.info(f'API call: /widget/car-insurance/contract/{user_id}/{widget_id} deleted successfully')
            return {
                "message": "Contract deleted successfully",
                "user_id": user_id,
                "widget_id": widget_id
            }
        else:
            logger.warning(f'API call: /widget/car-insurance/contract/{user_id}/{widget_id} not found')
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found."
            )

    except OperationalError as e:
        logger.error(f"Database delete error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete contract in product service database (DB Connection Error)."
        )
    
@app.get("/widget/car-insurance/contract/{user_id}")
def get_car_insurance_contracts(user_id: int, db: Session = Depends(get_db)):
    """
    Endpoint to retrieve car contracts for a given user.
    """
    logger.info(f'API call: /widget/car-insurance/contract/{user_id} starts')
    
    try:
        # Query all contracts for the user
        stmt = select(Contracts).filter(Contracts.user_id == user_id)
        contracts_orm = db.scalars(stmt).first()
        
        stmt = select(Widget).filter(Widget.widget_id == contracts_orm.widget_id)
        widgets_orm = db.scalars(stmt).first()

        logger.info(f'API call: /widget/car-insurance/contract/{user_id} retrieved widget sucessfully')

        return widgets_orm

    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve contract widget data from product service database (DB Connection Error)."
        )


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Mock Product Service with Uvicorn...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,  # Different port from core-service
        log_level="info"
    )

'''
//TODO: delete comment + mock data + base model centralized? + set user_id at the end
Now, you will set up the FastAPI application and implement the core endpoint with the crucial failure simulation logic.
'''