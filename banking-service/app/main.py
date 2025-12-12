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
KAFKA_TOPIC = "user.banking.product.purchased"
kafka_producer: AIOKafkaProducer = None

# --- Database Configuration ---
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = "5432"

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

logger.info(f"Connecting to database: {DB_HOST}:{DB_PORT}/{DB_NAME}")

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models ---
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

# --- Database Dependency ---
def get_db():
    db = None
    try:
        db = SessionLocal()
        yield db
    except OperationalError as e:
        logger.critical(f"FATAL DB CONNECTION ERROR: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable."
        )
    finally:
        if db:
            db.close()

# --- Kafka Functions ---
async def init_kafka_producer():
    global kafka_producer
    try:
        kafka_producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BROKER,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            request_timeout_ms=60000,
            retry_backoff_ms=500,
        )
        
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
                    return
                logger.warning(f"Connection failed: {e}. Retrying in 5 seconds...")
                await asyncio.sleep(5)
    except Exception as e:
        logger.error(f"Failed to initialize Kafka Producer: {e}")

async def publish_contract_event(event_type: str, user_id: int, widget_id: str, contract_id: int = None):
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
        await kafka_producer.send_and_wait(KAFKA_TOPIC, event)
        logger.info(f"✅ Successfully published event to topic '{KAFKA_TOPIC}'")
    except KafkaError as e:
        logger.error(f"❌ Failed to publish Kafka event: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error publishing event: {e}")

async def close_kafka_producer():
    global kafka_producer
    if kafka_producer:
        try:
            await kafka_producer.stop()
            logger.info("Kafka Producer stopped")
        except Exception as e:
            logger.error(f"Error stopping Kafka Producer: {e}")

# --- Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("Banking Service starting up...")
    logger.info("=" * 60)
    
    try:
        logger.info("Initializing Kafka Producer...")
        await init_kafka_producer()
        logger.info("✅ Kafka Producer initialized")
    except Exception as e:
        logger.warning(f"⚠️ Kafka Producer initialization warning: {e}")
    
    logger.info("=" * 60)
    logger.info("✅ Banking Service ready to accept requests")
    logger.info("=" * 60)
    
    yield
    
    logger.info("=" * 60)
    logger.info("Banking Service shutting down...")
    logger.info("=" * 60)
    
    try:
        logger.info("Closing Kafka Producer...")
        await close_kafka_producer()
        logger.info("✅ Kafka Producer closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)
    
    logger.info("=" * 60)
    logger.info("✅ Banking Service shutdown complete")
    logger.info("=" * 60)

# --- FastAPI App ---
app = FastAPI(lifespan=lifespan, title="Banking Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    logger.info("Root endpoint called")
    return {"message": "Banking Service is running"}

@app.get("/health")
def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok"}

@app.get("/widget/banking")
def get_banking_widget(db: Session = Depends(get_db)):
    logger.info('API call: /widget/banking starts')
    
    try:
        user_id = 123
        
        # Check if user has ANY contracts
        stmt_contracts = select(func.count(Contracts.id)).filter(Contracts.user_id == user_id)
        contract_count = db.scalar(stmt_contracts)
        has_any_contract = contract_count > 0
        
        logger.info(f'User {user_id} has {contract_count} banking contract(s)')
        
        # If user has contract, return empty list
        if has_any_contract:
            logger.info('User has contract - returning NO widgets (empty list)')
            return {"widgets": []}
        
        # Return widgets
        logger.info('User has no contract - returning widgets')
        stmt = (
            select(Widget)
            .filter(Widget.user_id == user_id)
            .order_by(Widget.priority)
        )
        
        widgets_orm = db.scalars(stmt).all()
        widgets_list = [widget.to_sdui_format() for widget in widgets_orm]
        
        logger.info(f'API call: /widget/banking returned {len(widgets_list)} widgets')
        return {"widgets": widgets_list}

    except OperationalError as e:
        logger.error(f"Database query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve data from banking database."
        )

@app.post("/widget/banking/contract")
async def post_banking_contract(contract_data: ContractRequest, db: Session = Depends(get_db)):
    user_id = contract_data.user_id
    widget_id = contract_data.widget_id
    
    logger.info(f'API call: /widget/banking/contract/{user_id}/{widget_id} starts')
    
    try:
        new_contract = Contracts(user_id=user_id, widget_id=widget_id)
        db.add(new_contract)
        db.commit()
        db.refresh(new_contract)
        
        logger.info(f'Contract created successfully. Contract ID: {new_contract.id}')
        
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
            detail="Could not create contract."
        )

@app.get("/widget/banking/contract/{user_id}")
def get_banking_contracts(user_id: int, db: Session = Depends(get_db)):
    logger.info(f'API call: /widget/banking/contract/{user_id} starts')
    
    try:
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
            detail="Could not retrieve contract widget data."
        )

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Banking Service with Uvicorn...")
    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")