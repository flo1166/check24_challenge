# ===== LOGGING MUST BE CONFIGURED FIRST =====
from logging.config import dictConfig
from app.core.logging_config import LOGGING_CONFIG

dictConfig(LOGGING_CONFIG)

# ===== NOW IMPORT THE REST =====
import logging
import os
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import JSONB
from pydantic import BaseModel
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError
import json

logger = logging.getLogger(__name__)

# --- Kafka Configuration ---
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9093")
KAFKA_TOPIC = "user.health.insurance.purchased"
kafka_producer: AIOKafkaProducer = None

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

# --- Kafka Producer Functions ---

async def init_kafka_producer():
    """Initialize the Kafka producer on application startup."""
    global kafka_producer
    
    try:
        kafka_producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            request_timeout_ms=60000,
            retry_backoff_ms=500,
        )
        
        # Start the producer with retries
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                logger.info(f"Attempting to start Kafka Producer (Attempt {attempt + 1}/{max_attempts})...")
                await kafka_producer.start()
                logger.info("✅ Kafka Producer started successfully")
                return
            except Exception as e:
                if attempt == max_attempts - 1:
                    logger.error(f"❌ Failed to start Kafka Producer after {max_attempts} attempts: {e}")
                    # Don't raise - allow service to start without Kafka
                    return
                logger.warning(f"Connection failed: {e}. Retrying in 5 seconds...")
                await asyncio.sleep(5)
                
    except Exception as e:
        logger.error(f"Failed to initialize Kafka Producer: {e}")


async def publish_contract_event(event_type: str, user_id: int, widget_id: str, contract_id: int = None):
    """
    Publish a contract event to Kafka.
    
    Args:
        event_type: "contract_created" or "contract_deleted"
        user_id: The user ID
        widget_id: The widget/product ID
        contract_id: The database ID of the contract (optional for deletion)
    """
    if not kafka_producer:
        logger.warning("Kafka producer not initialized, skipping event publish")
        return
    
    event = {
        "event_type": event_type,
        "user_id": user_id,
        "widget_id": widget_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if contract_id:
        event["contract_id"] = contract_id
    
    try:
        logger.info(f"📤 Publishing {event_type} event: {event}")
        
        # Send message to Kafka
        await kafka_producer.send_and_wait(KAFKA_TOPIC, event)
        
        logger.info(f"✅ Successfully published event to topic '{KAFKA_TOPIC}'")
        
    except KafkaError as e:
        logger.error(f"❌ Failed to publish Kafka event: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error publishing event: {e}")


async def close_kafka_producer():
    """Close the Kafka producer on application shutdown."""
    global kafka_producer
    
    if kafka_producer:
        try:
            await kafka_producer.stop()
            logger.info("Kafka Producer stopped")
        except Exception as e:
            logger.error(f"Error stopping Kafka Producer: {e}")


# --- Lifespan Context Manager ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles the application startup and shutdown events.
    """
    # --- STARTUP ---
    logger.info("=" * 60)
    logger.info("Mock Product Service starting up...")
    logger.info("=" * 60)
    
    try:
        # Initialize Kafka Producer
        logger.info("Initializing Kafka Producer...")
        await init_kafka_producer()
        logger.info("✅ Kafka Producer initialized")
        
    except Exception as e:
        logger.warning(f"⚠️ Kafka Producer initialization warning: {e}")
        # Continue anyway; Kafka might be unavailable in local dev
    
    logger.info("=" * 60)
    logger.info("✅ Mock Product Service ready to accept requests")
    logger.info("=" * 60)
    
    yield  # <-- Application starts accepting requests here
    
    # --- SHUTDOWN ---
    logger.info("=" * 60)
    logger.info("Mock Product Service shutting down...")
    logger.info("=" * 60)
    
    try:
        # Close Kafka Producer
        logger.info("Closing Kafka Producer...")
        await close_kafka_producer()
        logger.info("✅ Kafka Producer closed")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)
    
    logger.info("=" * 60)
    logger.info("✅ Mock Product Service shutdown complete")
    logger.info("=" * 60)


# --- 4. FastAPI App Initialization and Endpoint ---

app = FastAPI(lifespan=lifespan, title="Health Insurance Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Allow your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Returns a simple message confirming the service is running."""
    logger.info("Root endpoint called")
    return {"message": "Health Insurance Service is running."}

# Health Check 
@app.get("/health")
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}


@app.get("/widget/health-insurance")
def get_health_insurance_widget(db: Session = Depends(get_db)):
    """
    Fetches health insurance widgets from the database.
    If user has ANY contract: Returns EMPTY list (no Card widgets)
    If user has NO contract: Returns 6 random Card widgets
    """
    logger.info('API call: /widget/health-insurance starts')
    
    try:
        # Get user_id (hardcoded for now, should come from auth)
        user_id = 123
        
        # Check if user has ANY contracts
        stmt_contracts = select(func.count(Contracts.id)).filter(Contracts.user_id == user_id)
        contract_count = db.scalar(stmt_contracts)
        has_any_contract = contract_count > 0
        
        logger.info(f'User {user_id} has {contract_count} contract(s)')
        
        # If user has any contract, return EMPTY list
        if has_any_contract:
            logger.info('User has contract - returning NO widgets (empty list)')
            return {"widgets": []}
        
        # User has no contract - return random Card widgets
        logger.info('User has no contract - returning random Card widgets')
        stmt = (
            select(Widget)
            .filter(Widget.user_id == user_id)
            .order_by(Widget.priority)
        )
        
        widgets_orm = db.scalars(stmt).all()
        widgets_list = [widget.to_sdui_format() for widget in widgets_orm]
        
        logger.info(f'API call: /widget/health-insurance returned {len(widgets_list)} widgets')

        return {"widgets": widgets_list}

    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve data from health insurance database (DB Connection Error)."
        )
    
@app.get("/widget/health-insurance/{widget_id}")
def get_health_insurance_widget_by_id(widget_id: str, db: Session = Depends(get_db)):
    """
    Fetches specific health insurance widget from the database using SQLAlchemy ORM.
    """
    logger.info(f'API call: /widget/health-insurance/{widget_id} starts')
    
    try:
        # Query specific widget
        stmt = select(Widget).filter(Widget.user_id == 123).filter(Widget.widget_id == widget_id).limit(1)
        widgets_orm = db.scalars(stmt).all()
        
        # Format the results into the SDUI response structure
        widgets_list = [widget.to_sdui_format() for widget in widgets_orm]
        
        logger.info(f'API call: /widget/health-insurance/{widget_id} {len(widgets_list)} widgets were loaded')

        return {
            "widgets": widgets_list
        }

    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve data from health insurance service database (DB Connection Error)."
        )

@app.post("/widget/health-insurance/contract")
async def post_health_insurance_contract(contract_data: ContractRequest, db: Session = Depends(get_db)):
    """
    Endpoint to create a contract for a given user and widget.
    PUBLISHES KAFKA EVENT after successful creation.
    """
    user_id = contract_data.user_id
    widget_id = contract_data.widget_id

    logger.info(f'API call: /widget/health-insurance/contract/{user_id}/{widget_id} starts')
    
    try:
        # Create a new contract entry
        new_contract = Contracts(user_id=user_id, widget_id=widget_id)
        db.add(new_contract)
        db.commit()
        db.refresh(new_contract) # Get the newly created object with its ID
        
        logger.info(f'Contract created successfully. Contract ID: {new_contract.id}')
        
        # 🎯 PUBLISH KAFKA EVENT
        await publish_contract_event(
            event_type="contract_created",
            user_id=user_id,
            widget_id=widget_id,
            contract_id=new_contract.id
        )

        return {
            "message": "Contract created successfully",
            "contract_id": new_contract.id,
            "user_id": user_id,
            "widget_id": widget_id
        }

    except OperationalError as e:
        logger.error(f"Database insert error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create contract in health insurance service database (DB Connection Error)."
        )

@app.delete("/widget/health-insurance/contract/{user_id}/{widget_id}")
async def delete_health_insurance_contract(user_id: int, widget_id: str, db: Session = Depends(get_db)):
    """
    Endpoint to delete a contract for a given user and widget.
    PUBLISHES KAFKA EVENT after successful deletion.
    """
    logger.info(f'API call: DELETE /widget/health-insurance/contract/{user_id}/{widget_id} starts')
    
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
            logger.info(f'Contract deleted successfully for user {user_id}, widget {widget_id}')
            
            # 🎯 PUBLISH KAFKA EVENT
            await publish_contract_event(
                event_type="contract_deleted",
                user_id=user_id,
                widget_id=widget_id
            )
            
            return {
                "message": "Contract deleted successfully",
                "user_id": user_id,
                "widget_id": widget_id
            }
        else:
            logger.warning(f'Contract not found for user {user_id}, widget {widget_id}')
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found."
            )

    except OperationalError as e:
        logger.error(f"Database delete error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete contract in health insurance service database (DB Connection Error)."
        )
    
@app.get("/widget/health-insurance/contract/{user_id}")
def get_car_insurance_contracts(user_id: int, db: Session = Depends(get_db)):
    """
    Endpoint to retrieve health contracts for a given user.
    """
    logger.info(f'API call: /widget/health-insurance/contract/{user_id} starts')
    
    try:
        # Query all contracts for the user
        stmt = select(Contracts).filter(Contracts.user_id == user_id)
        contracts_orm = db.scalars(stmt).first()
        
        if not contracts_orm:
            logger.info(f'No contracts found for user {user_id}')
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No contracts found."
            )
        
        stmt = select(Widget).filter(Widget.widget_id == contracts_orm.widget_id)
        widgets_orm = db.scalars(stmt).first()

        logger.info(f'Contract widget retrieved successfully for user {user_id}')

        return widgets_orm.to_sdui_format()

    except HTTPException:
        raise
    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve contract widget data from health insurance service database (DB Connection Error)."
        )


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Mock Product Service with Uvicorn...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,  # Different port from core-service
        log_level="info"
    )

'''
//TODO: delete comment + mock data + base model centralized? + set user_id at the end
Now, you will set up the FastAPI application and implement the core endpoint with the crucial failure simulation logic.
'''