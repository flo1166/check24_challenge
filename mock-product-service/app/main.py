# ===== LOGGING MUST BE CONFIGURED FIRST =====
from logging.config import dictConfig
from app.core.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)

# ===== NOW IMPORT THE REST =====
import random
import logging
import os
from fastapi import FastAPI, HTTPException, status, Depends
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import JSONB

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

    user_id = Column(String(50), index=True) 
    widget_id = Column(String(50), primary_key=True)
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
        stmt = select(Widget).filter(Widget.user_id == '123').order_by(func.random()).limit(6)
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