# CHECK24 Home Widgets - Developer Guideline

**Version**: 1.0  
**Last Updated**: December 27, 2025  
**Audience**: Product Team Developers (Car Insurance, Health Insurance, House Insurance, Banking, etc.)

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Integration Overview](#integration-overview)
4. [Widget JSON Contract](#widget-json-contract)
5. [API Specification](#api-specification)
6. [Personalization & Business Logic](#personalization--business-logic)
7. [Event Publishing](#event-publishing)
8. [Database Schema (Reference)](#database-schema-reference)
9. [Local Development](#local-development)
10. [Testing](#testing)
11. [Deployment Checklist](#deployment-checklist)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)
14. [FAQ](#faq)

---

## Introduction

Welcome! This guide helps your product team integrate with the **CHECK24 Home Widgets Platform**.

**What You'll Build**:
- A FastAPI service that generates personalized widget content for your product
- API endpoints that conform to the Home platform's JSON contract
- Event publishing to keep the Home page synchronized with user actions

**What You DON'T Build**:
- UI components (clients render based on your JSON)
- Caching logic (handled by Core Service)
- Cross-product aggregation (handled by Core Service)

**Prerequisites**:
- Python 3.12+
- FastAPI knowledge
- PostgreSQL database
- Kafka access (for event publishing)
- Docker (for local testing)

---

## Quick Start

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_product_db
DB_USER=your_user
DB_PASSWORD=your_password

# Kafka
KAFKA_BROKER=kafka:9093

# Core Service
CORE_SERVICE_URL=http://core-service:8000
```

### 3. Test Integration

```bash
# Health check
curl http://localhost:8001/health

# Fetch widgets
curl http://localhost:8001/widget/car-insurance
```

---

## Integration Overview

### Your Responsibilities

1. **Generate Widget JSON**: Return personalized widgets in the correct format
2. **Manage Contracts**: Handle user purchases (create/delete contracts)
3. **Publish Events**: Notify Core Service when user state changes
4. **Personalization Logic**: Decide which widgets to show each user
5. **Data Ownership**: Maintain your own database and business logic

### What Core Service Provides

- Widget aggregation from all products
- Redis caching with SWR pattern
- Circuit breaker protection for your service
- Real-time updates via SSE
- Multi-platform delivery (Web, Android)

---

## Widget JSON Contract

### Overview

All widgets must conform to this JSON schema. The Core Service validates and aggregates your widgets.

### Complete Widget Structure

```typescript
interface Widget {
  // === Identification ===
  widget_id: string;              // Unique ID (e.g., "car_offer_devk_123")
  
  // === Component Grouping ===
  component_id: string;           // Groups widgets (e.g., "carousel_featured")
  component_order: number;        // Display order of component (1 = first)
  component_type: ComponentType;  // How to display widgets in this component
  
  // === Widget Metadata ===
  priority: number;               // Order within component (higher = earlier)
  service?: string;               // Auto-added by Core (e.g., "car_insurance")
  
  // === Content ===
  data: WidgetData;               // Your custom data for the widget
}
```

### Component Types

```typescript
type ComponentType = 
  | 'Carousel'        // Horizontal scrolling (3-6 widgets)
  | 'ProductGrid'     // Grid layout (4-12 widgets)
  | 'Card'            // Single card
  | 'InfoBox'         // Information display
  | 'SectionHeader';  // Section title
```

**Usage Examples**:
- `Carousel`: Featured deals, trending products
- `ProductGrid`: Browse all offers
- `Card`: Single promotional widget
- `InfoBox`: Educational content, tips
- `SectionHeader`: "Your Personalized Deals"

Of course, if you have own ideas: check with the core-service to implement components / widgets types at UI level. You can use them afterwards.

### Widget Data Schema

```typescript
interface WidgetData {
  // === Common Fields (all widget types) ===
  title?: string;                 // Primary heading
  subtitle?: string;              // Secondary heading
  content?: string;               // Body text
  image_url?: string;             // Product/brand image
  
  // === Pricing Information ===
  pricing?: {
    price: number;                // Current price
    currency: string;             // "EUR", "USD"
    frequency?: 'monthly' | 'yearly' | 'one-time';
    original_price?: number;      // For discounts
    discount_percentage?: number; // e.g., 20 (for "20% off")
  };
  
  // === Rating & Social Proof ===
  rating?: {
    score: number;                // 0-5
    count?: number;               // Number of reviews
    source?: string;              // "Trustpilot", "Google Reviews"
  };
  
  // === Provider/Company ===
  provider?: {
    name: string;                 // "DEVK", "Allianz"
    logo_url?: string;            // Brand logo
  };
  
  // === Call-to-Action ===
  cta?: {
    text: string;                 // "Get Quote", "Compare Now"
    url?: string;                 // Deep link or web URL
    action?: 'purchase' | 'compare' | 'details' | 'learn_more';
  };
  
  // === Component-Specific ===
  header?: string;                // For SectionHeader
  body?: string;                  // For InfoBox
  features?: string[];            // For ProductGrid items
  badge?: string;                 // "Best Value", "Popular", "New"
  
  // === Custom Fields ===
  [key: string]: any;             // Product-specific data
}
```

### Example: Car Insurance Widget

```json
{
  "widget_id": "car_offer_devk_comprehensive_123",
  "component_id": "carousel_featured_deals",
  "component_order": 1,
  "component_type": "Carousel",
  "priority": 10,
  "data": {
    "title": "Comprehensive Car Insurance",
    "subtitle": "Full coverage with roadside assistance",
    "image_url": "/assets/companies/devk.svg",
    "pricing": {
      "price": 45.99,
      "currency": "EUR",
      "frequency": "monthly",
      "original_price": 59.99,
      "discount_percentage": 23
    },
    "rating": {
      "score": 4.7,
      "count": 2431,
      "source": "Trustpilot"
    },
    "provider": {
      "name": "DEVK",
      "logo_url": "/assets/companies/devk.svg"
    },
    "cta": {
      "text": "Get Quote",
      "action": "compare"
    },
    "features": [
      "24/7 Roadside Assistance",
      "Windshield Coverage",
      "Rental Car Included"
    ],
    "badge": "Best Value"
  }
}
```

### Validation Rules

**Required Fields**:
- `widget_id` (must be unique across your service)
- `component_id`
- `component_order`
- `component_type`
- `priority`
- `data` (object, not null)

**Field Constraints**:
- `widget_id`: 1-100 characters, no spaces
- `component_order`: Integer >= 0
- `priority`: Integer (higher = more important)
- `pricing.price`: >= 0
- `rating.score`: 0-5

**Optional but Recommended**:
- `data.title`
- `data.cta`
- `data.provider`

---

## API Specification

### Required Endpoints

Your service MUST implement these endpoints:

#### 1. Widget Retrieval

**Endpoint**: `GET /widget/{service-key}`

**Example**: `GET /widget/car-insurance`

**Purpose**: Core Service calls this to fetch all widgets for a user

**Request**: No body required (user context determined by your logic)

**Response**:
```json
{
  "widgets": [
    {
      "widget_id": "...",
      "component_id": "...",
      "component_order": 1,
      "component_type": "Carousel",
      "priority": 10,
      "data": { ... }
    },
    ...
  ]
}
```

**Personalization Logic**:
```python
@app.get("/widget/car-insurance")
def get_widgets(db: Session = Depends(get_db)):
    user_id = 123  # Get from session/JWT in production
    
    # 1. Check if user has active contract
    has_contract = db.query(Contracts).filter(
        Contracts.user_id == user_id
    ).count() > 0
    
    if has_contract:
        return {"widgets": []}  # Hide widgets if user is customer
    
    # 2. Fetch personalized widgets
    widgets = db.query(Widget).filter(
        Widget.user_id == user_id
    ).order_by(Widget.priority.desc()).all()
    
    return {"widgets": [w.to_sdui_format() for w in widgets]}
```
---

#### 2. Contract Creation

**Endpoint**: `POST /widget/{service-key}/contract`

**Example**: `POST /widget/car-insurance/contract`

**Purpose**: User purchases/subscribes to your product

**Request Body**:
```json
{
  "user_id": 123,
  "widget_id": "car_offer_devk_123"
}
```

**Response**:
```json
{
  "message": "Contract created successfully",
  "contract_id": 789,
  "user_id": 123,
  "widget_id": "car_offer_devk_123"
}
```

**Implementation**:
```python
@app.post("/widget/car-insurance/contract")
async def create_contract(
    contract_data: ContractRequest,
    db: Session = Depends(get_db)
):
    user_id = contract_data.user_id
    widget_id = contract_data.widget_id
    
    # 1. Create contract in database
    new_contract = Contracts(user_id=user_id, widget_id=widget_id)
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    
    # 2. CRITICAL: Invalidate Core Service cache
    await invalidate_core_cache()
    
    # 3. Publish Kafka event for SSE notifications
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
```

**CRITICAL**: You must invalidate the cache after creating a contract, otherwise users will still see your widgets.

---

#### 3. Contract Deletion

**Endpoint**: `DELETE /widget/{service-key}/contract/{user_id}/{widget_id}`

**Example**: `DELETE /widget/car-insurance/contract/123/car_offer_devk_123`

**Purpose**: User cancels subscription

**Response**:
```json
{
  "message": "Contract deleted successfully",
  "contract_id": 789,
  "user_id": 123,
  "widget_id": "car_offer_devk_123"
}
```

**Implementation**: Same pattern as creation, but delete from DB

---

#### 4. User Contracts

**Endpoint**: `GET /widget/{service-key}/contract/{user_id}`

**Example**: `GET /widget/car-insurance/contract/123`

**Purpose**: Core Service fetches user's active contract widget

**Response**: Single widget JSON (not array)

```json
{
  "widget_id": "car_offer_devk_123",
  "component_id": "user_contracts",
  "component_type": "Card",
  "priority": 1,
  "data": {
    "title": "Your Car Insurance",
    "subtitle": "DEVK Comprehensive",
    "content": "Active since Jan 2025"
  }
}
```

**Use Case**: Showing user their purchased products on a "My Contracts" page

---

#### 5. Health Check

**Endpoint**: `GET /health`

**Purpose**: Core Service monitors your availability

**Response**:
```json
{
  "status": "healthy",
  "service": "car-insurance-service"
}
```

**Implementation**:
```python
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "car-insurance-service"}
```

---

### Error Handling

**Standard HTTP Codes**:
- `200`: Success
- `404`: Resource not found (e.g., no contracts for user)
- `500`: Internal server error
- `503`: Service unavailable (database down)

**Error Response Format**:
```json
{
  "detail": "Database connection failed",
  "error_code": "DB_CONNECTION_ERROR"
}
```

**Circuit Breaker**: Core Service has circuit breakers. If your service fails 5 times in a row, it will return fallback widgets instead of calling you.

---

## Personalization & Business Logic

### Decision Framework

**Question**: Which widgets should I show to user X?

**Your Responsibility**: You decide based on:
- User profile data (age, location, preferences)
- Purchase history
- Browsing behavior
- A/B testing variants
- Inventory availability
- Pricing strategy

**Example Logic**:
```python
def get_personalized_widgets(user_id: int, db: Session):
    user = get_user_profile(user_id)
    
    # Example: Young drivers see different insurance options
    if user.age < 25:
        return get_young_driver_widgets(db)
    
    # Example: Users in Bavaria see regional providers
    if user.location == "Bavaria":
        return get_regional_widgets(db, region="Bavaria")
    
    # Default: Show top-rated deals
    return get_top_rated_widgets(db)
```

### Component Grouping Strategy

**Use `component_order` to control layout**:

```python
# Component 1: Featured deals (carousel)
widgets_featured = [
    {"component_id": "carousel_featured", "component_order": 1, ...},
    {"component_id": "carousel_featured", "component_order": 1, ...},
]

# Component 2: All offers (grid)
widgets_all = [
    {"component_id": "grid_all_offers", "component_order": 2, ...},
    {"component_id": "grid_all_offers", "component_order": 2, ...},
]

return {"widgets": widgets_featured + widgets_all}
```

**Result**: Users see featured carousel first, then browseable grid below.

### A/B Testing

**Approach 1**: Server-side variants
```python
def get_widgets(user_id):
    variant = get_ab_variant(user_id)  # "control" or "variant_a"
    
    if variant == "variant_a":
        return get_high_discount_widgets()
    else:
        return get_standard_widgets()
```

**Approach 2**: Multiple widgets, let client decide
```python
return {
    "widgets": [
        {"widget_id": "offer_v1", "ab_variant": "control", ...},
        {"widget_id": "offer_v2", "ab_variant": "variant_a", ...},
    ]
}
```

---

## Event Publishing

### Why Publish Events?

When a user creates or deletes a contract, the Home page cache must be invalidated so the user sees updated widgets.

**Dual Invalidation Strategy**:
1. **Sync HTTP POST**: Immediately invalidate Core Service cache
2. **Async Kafka Event**: Notify all connected clients via SSE

### Cache Invalidation (Sync)

```python
import httpx

async def invalidate_core_cache():
    """
    Call Core Service to invalidate cache synchronously.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CORE_SERVICE_URL}/cache/invalidate",
                timeout=5.0
            )
            
            if response.status_code == 200:
                logger.info("Cache invalidated successfully")
                return True
            else:
                logger.warning(f"Cache invalidation failed: {response.status_code}")
                return False
                
    except httpx.TimeoutException:
        logger.error("Cache invalidation timeout")
        return False
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        return False
```

### Kafka Event Publishing (Async)

**Setup Kafka Producer**:
```python
from aiokafka import AIOKafkaProducer
import json

kafka_producer: AIOKafkaProducer = None

async def init_kafka_producer():
    global kafka_producer
    
    kafka_producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    
    await kafka_producer.start()
```

**Publish Event**:
```python
async def publish_contract_event(
    event_type: str,
    user_id: int,
    widget_id: str,
    contract_id: int = None
):
    """
    Publish contract event to Kafka.
    
    event_type: "contract_created" or "contract_deleted"
    """
    event = {
        "event_type": event_type,
        "user_id": user_id,
        "widget_id": widget_id,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    if contract_id:
        event["contract_id"] = contract_id
    
    # Publish to your service's topic
    await kafka_producer.send_and_wait(
        "user.car.insurance.purchased",  # YOUR_TOPIC_NAME
        event
    )
```

**Topic Naming Convention**:
- Car Insurance: `user.car.insurance.purchased`
- Health Insurance: `user.health.insurance.purchased`
- House Insurance: `user.house.insurance.purchased`
- Banking: `user.banking.product.purchased`

**Event Schema**:
```json
{
  "event_type": "contract_created",
  "user_id": 123,
  "widget_id": "car_offer_devk_123",
  "contract_id": 789,
  "timestamp": "2025-12-27T10:30:00Z"
}
```

---

## Database Schema (Reference)

You are free to design your own database schema, but here's the reference implementation used in the PoC:

### Components Table

```sql
CREATE TABLE components (
    component_id VARCHAR(100) NOT NULL,
    user_id INTEGER NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    component_order INTEGER DEFAULT 0,
    PRIMARY KEY (component_id, user_id)
);
```

**Example Data**:
```sql
INSERT INTO components VALUES 
  ('carousel_featured', 123, 'Carousel', 1),
  ('grid_all_offers', 123, 'ProductGrid', 2);
```

### Widgets Table

```sql
CREATE TABLE widgets (
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    component_id VARCHAR(100) DEFAULT 'default_component',
    FOREIGN KEY (component_id, user_id) 
        REFERENCES components(component_id, user_id)
        ON DELETE CASCADE
);
```

**Example Data**:
```sql
INSERT INTO widgets VALUES (
  123,
  'car_offer_devk_123',
  'Card',
  10,
  '{"title": "DEVK Insurance", "pricing": {"price": 45.99}}'::jsonb,
  'carousel_featured'
);
```

### Contracts Table

```sql
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    widget_id VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    UNIQUE (user_id, widget_id)
);
```

**SQLAlchemy Models**:
```python
from sqlalchemy import Column, Integer, String, ForeignKeyConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Component(Base):
    __tablename__ = 'components'
    
    component_id = Column(String(100), primary_key=True)
    user_id = Column(Integer, primary_key=True, nullable=False)
    component_type = Column(String(50), nullable=False)
    component_order = Column(Integer, default=0)
    
    widgets = relationship("Widget", back_populates="component")

class Widget(Base):
    __tablename__ = 'widgets'
    
    user_id = Column(Integer, nullable=False)
    widget_id = Column(String(100), primary_key=True)
    component_type = Column(String(50), nullable=False)
    priority = Column(Integer, default=0)
    data = Column(JSONB, nullable=False)
    component_id = Column(String(100), default='default_component')
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['component_id', 'user_id'],
            ['components.component_id', 'components.user_id'],
            ondelete='CASCADE'
        ),
    )
    
    component = relationship("Component", back_populates="widgets")
    
    def to_sdui_format(self):
        return {
            "widget_id": self.widget_id,
            "component_id": self.component_id,
            "component_type": self.component_type,
            "priority": self.priority,
            "data": self.data
        }
```

---

## Best Practices

### 1. Widget Design

**DO**:
- ✅ Keep widget data concise (avoid large JSON blobs)
- ✅ Use high-quality images (CDN URLs)
- ✅ Provide clear CTAs
- ✅ Include pricing when relevant
- ✅ Use badges sparingly ("Best Value", "Popular")

**DON'T**:
- ❌ Return 100+ widgets (limit to 10-20 most relevant)
- ❌ Include PII in widget data (use widget_id as reference)
- ❌ Return stale pricing (ensure data freshness)
- ❌ Use inconsistent component grouping

### 2. Performance

**DO**:
- ✅ Index database columns used in WHERE clauses
- ✅ Limit query results (pagination)
- ✅ Use connection pooling
- ✅ Cache expensive computations

**DON'T**:
- ❌ Make N+1 queries (use JOINs)
- ❌ Fetch all user data (select only needed columns)
- ❌ Block on external API calls (use async)

### 3. Event Publishing

**DO**:
- ✅ Publish events asynchronously (don't block HTTP response)
- ✅ Include all relevant metadata in events
- ✅ Use structured event schemas
- ✅ Handle Kafka failures gracefully

**DON'T**:
- ❌ Retry infinitely on Kafka failure (exponential backoff)
- ❌ Publish events without invalidating cache first
- ❌ Include sensitive data in events

### 4. Error Handling

**DO**:
- ✅ Return meaningful error messages
- ✅ Log errors with stack traces
- ✅ Use appropriate HTTP status codes
- ✅ Degrade gracefully (return empty widgets vs 500 error)

**DON'T**:
- ❌ Expose internal errors to clients
- ❌ Crash on database connection loss
- ❌ Return HTML error pages (JSON only)

---

## Troubleshooting

### Problem: Widgets not showing on Home page

**Check**:
1. Is your service healthy? `curl http://localhost:8001/health`
2. Does widget endpoint return data? `curl http://localhost:8001/widget/car-insurance`
3. Are widgets in correct format? Validate JSON schema
4. Check Core Service logs: `docker-compose logs core-service`

**Common Causes**:
- User has active contract (widgets hidden by design)
- Database connection failed
- JSON schema validation failed
- Circuit breaker is OPEN (too many failures)

---

### Problem: Cache not invalidating after contract creation

**Check**:
1. Is HTTP POST `/cache/invalidate` being called?
2. Check HTTP response status (should be 200)
3. Is Kafka event published?
4. Check Kafka consumer logs: `docker-compose logs core-service | grep kafka`

**Common Causes**:
- Core Service URL incorrect in `.env`
- Kafka broker unreachable
- Event published to wrong topic
- Race condition (client refetches before invalidation)

---

### Problem: High response times

**Check**:
1. Database query performance: `EXPLAIN ANALYZE <query>`
2. Number of widgets returned (limit to 10-20)
3. External API calls blocking
4. Connection pool exhaustion

**Solutions**:
- Add database indexes
- Limit query results
- Use async HTTP clients
- Increase connection pool size

---

### Problem: Circuit breaker OPEN

**Check**:
1. Core Service logs: `docker-compose logs core-service | grep CircuitBreaker`
2. Your service error rate
3. Database availability

**Recovery**:
- Fix underlying issue (database, bug, etc.)
- Wait 10 seconds (circuit breaker will try HALF_OPEN)
- Manually reset: `curl -X POST http://localhost:8000/debug/reset-circuit-breaker`

---

## FAQ

### Q: How do I add a new widget type?

**A**: Just create new widget data in your database with a different `component_type`. Clients will render it based on the type.

```sql
INSERT INTO widgets VALUES (
  123, 'new_widget', 'InfoBox', 5,
  '{"header": "Did You Know?", "body": "..."}'::jsonb,
  'infobox_tips'
);
```

---

### Q: Can I change the JSON schema?

**A**: Minor additions (new optional fields) are OK. Breaking changes require versioning.

**Safe**:
```json
{
  "data": {
    "title": "...",
    "new_field": "..."  // ✅ Optional field added
  }
}
```

**Breaking**:
```json
{
  "data": {
    "heading": "..."  // ❌ Renamed "title" to "heading"
  }
}
```

For breaking changes, coordinate with Core team for API versioning strategy.

---

### Q: How do I handle user authentication?

**A**: In production, Core Service will pass user context (JWT token, user_id) in request headers. For now, hardcode user_id = 123 for testing.

**Future**:
```python
@app.get("/widget/car-insurance")
def get_widgets(
    user_id: int = Header(...),  # From Core Service
    db: Session = Depends(get_db)
):
    # Fetch widgets for this user
```

---

### Q: Can I show widgets even if user has a contract?

**A**: Yes! The "hide widgets if contract exists" is just the reference implementation. You control the logic.

**Example**:
```python
# Show upsell widgets to existing customers
if has_contract:
    return get_upsell_widgets(user_id)
else:
    return get_acquisition_widgets(user_id)
```

---

### Q: How do I test cache invalidation locally?

**A**:
```bash
# 1. Create contract
curl -X POST http://localhost:8001/widget/car-insurance/contract \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "widget_id": "test"}'

# 2. Check Core Service received invalidation
docker-compose logs core-service | grep "invalidate"

# 3. Verify widgets hidden
curl http://localhost:8000/home | jq '.services.car_insurance.components'
```

---

### Q: What if my service is temporarily down?

**A**: Core Service has circuit breakers. After 5 failures, it will:
1. Return fallback widgets (generic error message)
2. Stop calling your service for 10 seconds
3. Try again (HALF_OPEN state)

Your downtime does NOT crash the Home page.

---

### Q: How do I deploy updates without downtime?

**A**: Use blue-green deployment:
1. Deploy new version to separate containers
2. Health check passes
3. Update load balancer to route traffic to new version
4. Keep old version running for 5 minutes (in-flight requests)
5. Shut down old version

Core Service will continue serving cached data during deployment.

---

**Next Steps**:
1. Clone reference implementation
2. Set up local environment
3. Implement widget endpoint
4. Test integration with Core Service
5. Deploy to staging
6. Request production access

Good luck! 🚀

