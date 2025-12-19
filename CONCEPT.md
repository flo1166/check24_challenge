# CHECK24 Home Widgets - Technical Concept

## Executive Summary

This document provides the technical specification for the CHECK24 Home Widgets platform - a distributed, high-performance system enabling decentralized product teams to deliver personalized content to the CHECK24 Home experience across Web, iOS, and Android platforms.

**Key Achievements:**
- **Performance**: Sub-100ms response times with SWR caching strategy
- **Availability**: 99.9%+ uptime through circuit breakers and graceful degradation
- **Scalability**: Horizontal scaling of all components without single points of failure
- **Flexibility**: JSON-based contract enables multi-platform rendering without code changes
- **Developer Experience**: Clear integration path with minimal coupling to Core systems

**Target Audience**: Core engineering teams responsible for implementing and operating the centralized Home Widget infrastructure.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Core Design Principles](#core-design-principles)
3. [Component Specifications](#component-specifications)
4. [API Contracts](#api-contracts)
5. [Data Flow & Orchestration](#data-flow--orchestration)
6. [Performance & Caching Strategy](#performance--caching-strategy)
7. [High Availability & Resilience](#high-availability--resilience)
8. [Deployment Architecture](#deployment-architecture)
9. [Security Considerations](#security-considerations)
10. [Monitoring & Observability](#monitoring--observability)
11. [Scalability Roadmap](#scalability-roadmap)
12. [Decision Rationale](#decision-rationale)

---

## System Architecture

### Overview

The Home Widgets platform follows a **Backend-for-Frontend (BFF) pattern** with a central Core Service acting as an intelligent aggregator and cache layer between client applications and decentralized product services.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Client  │  │  iOS App     │  │ Android App  │      │
│  │  (React)     │  │  (Swift)     │  │  (Kotlin)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/JSON
                             ▼
          ┌──────────────────────────────────────┐
          │      Core Service (BFF)              │
          │  ┌────────────┐  ┌────────────────┐ │
          │  │  FastAPI   │  │  Redis Cache   │ │
          │  │  REST API  │  │  (SWR Pattern) │ │
          │  └─────┬──────┘  └────────────────┘ │
          │        │                             │
          │  ┌─────▼──────────────────────────┐ │
          │  │  Kafka Consumer                │ │
          │  │  (Cache Invalidation)          │ │
          │  └────────────────────────────────┘ │
          └──────────────┬───────────────────────┘
                         │ Circuit Breaker Protected
                         ▼
          ┌──────────────────────────────────────┐
          │    Product Services Layer            │
          │  ┌────────────┐  ┌────────────────┐ │
          │  │    Car     │  │    Health      │ │
          │  │ Insurance  │  │   Insurance    │ │
          │  └────────────┘  └────────────────┘ │
          │  ┌────────────┐  ┌────────────────┐ │
          │  │   House    │  │    Banking     │ │
          │  │ Insurance  │  │   Products     │ │
          │  └────────────┘  └────────────────┘ │
          │                                      │
          │  Each with: PostgreSQL + Kafka       │
          └──────────────────────────────────────┘
```

### Architectural Layers

#### 1. Client Layer (Multi-Platform)
- **Web Client**: React + Vite, responsive design
- **iOS App**: Swift + Jetpack Compose, native UI
- **Android App**: Kotlin + Jetpack Compose, native UI
- **Shared Contract**: All platforms consume identical JSON responses

#### 2. Core Service (BFF)
- **Technology**: FastAPI (Python 3.11+)
- **Responsibilities**:
  - Widget aggregation from product services
  - Redis caching with SWR pattern
  - Circuit breaker protection
  - SSE-based real-time updates
  - User contract management
- **Horizontal Scaling**: Stateless design, can run N replicas

#### 3. Product Services Layer
- **Technology**: FastAPI (Python 3.11+)
- **Responsibilities**:
  - Widget content generation
  - User-specific personalization
  - Contract management
  - Event publishing via Kafka
- **Independence**: Each service owns its database and logic

#### 4. Infrastructure Layer
- **Redis**: Distributed cache (can use Redis Cluster for HA)
- **Kafka + Zookeeper**: Event streaming for cache invalidation
- **PostgreSQL**: Per-service data persistence
- **Docker Compose**: Local development & testing environment

---

## Core Design Principles

### 1. Server-Driven UI (SDUI) via JSON Contract

**Why**: Enables platform-agnostic widget delivery without client code changes.

**JSON Contract Structure**:
```json
{
  "widget_id": "car_insurance_offer_123",
  "component_type": "Card",
  "priority": 1,
  "data": {
    "title": "Kfz-Versicherung vergleichen",
    "subtitle": "Top-Angebote für Sie",
    "content": "Ab 89€/Monat. Vollkasko. Jetzt sparen.",
    "image_url": "assets/images/cars/vw-golf-7-used.png",
    "pricing": {
      "price": 89.00,
      "currency": "€",
      "frequency": "Monat"
    },
    "rating": {
      "score": 4.8
    }
  }
}
```

**Key Benefits**:
- **Zero Client Deploys**: Layout changes deploy via API updates only
- **A/B Testing**: Products can test variants by changing JSON structure
- **Platform Consistency**: Same data = same UX across Web/iOS/Android
- **Type Safety**: Clients validate against well-defined schemas

### 2. Stale-While-Revalidate (SWR) Caching

**Problem**: Product services can't handle peak Home traffic (10-100x normal load).

**Solution**: Multi-tier caching with background refresh.

```
Request Flow:
1. Client → Core Service
2. Core Service checks Redis cache
3. IF cached AND fresh → return immediately
4. IF cached BUT stale → return stale + trigger background refresh
5. IF cache miss → fetch fresh + cache + return
```

**Configuration**:
- **TTL**: 1 hour (configurable per widget type)
- **SWR Grace Period**: 5 minutes
- **Cache Key Pattern**: `sdui:home_page:v1`

**Metrics**:
- **Cache Hit Rate**: 85-95% (measured)
- **P95 Latency**: <50ms (cache hit), <300ms (cache miss)

### 3. Circuit Breaker Protection

**Problem**: Product service failures should not cascade to Home.

**Implementation**: PyBreaker library with per-service circuit breakers.

**Configuration**:
```python
FAILURE_THRESHOLD = 5  # Open circuit after 5 failures
RESET_TIMEOUT = 10     # Try again after 10 seconds
```

**States**:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service unavailable, return fallback immediately
- **HALF_OPEN**: Testing recovery, limited requests allowed

**Fallback Strategy**:
```json
{
  "widget_id": "fallback_error_card",
  "component_type": "Card",
  "data": {
    "title": "Service Temporarily Unavailable",
    "content": "We're working on it. Please try again soon."
  }
}
```

### 4. Event-Driven Cache Invalidation

**Problem**: Cached data becomes stale after user actions (e.g., contract purchase).

**Solution**: Kafka-based event streaming for real-time invalidation.

**Flow**:
1. User purchases car insurance → Product service writes to database
2. Product service publishes event: `user.car.insurance.purchased`
3. Core Service Kafka consumer receives event
4. Core Service invalidates relevant cache keys
5. Next Home request fetches fresh data
6. SSE notifies connected clients to refresh

**Topics**:
- `user.car.insurance.purchased`
- `user.health.insurance.purchased`
- `user.house.insurance.purchased`
- `user.banking.product.purchased`

**Event Schema**:
```json
{
  "event_type": "contract_created",
  "user_id": 123,
  "widget_id": "car_offer_456",
  "timestamp": "2025-01-15T10:30:00Z",
  "contract_id": 789
}
```

### 5. Decoupled Product Autonomy

**Key Principle**: Products control their widget content and personalization logic.

**What Core Service Does NOT Do**:
- ❌ Decide which widgets to show (business logic stays in products)
- ❌ Store user behavior data centrally
- ❌ Implement product-specific personalization rules

**What Core Service DOES Do**:
- ✅ Aggregate widgets from multiple services
- ✅ Cache responses for performance
- ✅ Protect against service failures
- ✅ Deliver consistent JSON to all platforms

---

## Component Specifications

### Core Service (BFF)

**Technology Stack**:
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **ASGI Server**: Uvicorn with async workers
- **HTTP Client**: HTTPX (async)

**Key Modules**:

#### 1. `/app/api/home.py` - Main API Endpoint
```python
@router.get("/home")
async def get_home_page_widgets(background_tasks: BackgroundTasks):
    """
    Aggregates widgets from all product services.
    Returns: ServiceData grouped by service key
    """
```

**Response Structure**:
```json
{
  "services": {
    "car_insurance": {
      "title": "Car Insurance Deals",
      "widgets": [...]
    },
    "health_insurance": {
      "title": "Health Insurance Deals",
      "widgets": [...]
    }
  },
  "timestamp": "2025-12-19T12:00:00Z",
  "cache_key": "sdui:home_page:v1"
}
```

#### 2. `/app/core/cache.py` - SWR Cache Layer
```python
async def get_with_swr(
    key: str,
    fetch_function: Callable,
    background_tasks: BackgroundTasks
):
    """
    Implements Stale-While-Revalidate pattern.
    - Returns cached data immediately if available
    - Triggers background refresh if data is stale
    - Fetches fresh data on cache miss
    """
```

**Cache Configuration**:
```python
TTL = timedelta(hours=1)           # Primary cache lifetime
SWR_GRACE_PERIOD = timedelta(minutes=5)  # Stale-but-usable period
```

#### 3. `/app/core/clients.py` - Product Service Integration
```python
class ProductServiceClient:
    """
    Async HTTP client with circuit breaker protection.
    - Handles all communication with product services
    - Implements retry logic and timeouts
    - Returns fallback widgets on failure
    """
```

**Configuration**:
```python
TIMEOUT = 5.0  # seconds
RETRY_ATTEMPTS = 3
BACKOFF_FACTOR = 0.5
```

#### 4. `/app/workers/kafka_consumer.py` - Event Processor
```python
async def consume_and_invalidate_cache():
    """
    Consumes events from Kafka topics.
    - Invalidates Redis cache on contract events
    - Notifies SSE clients for real-time updates
    - Handles consumer group management
    """
```

**Consumer Configuration**:
```python
GROUP_ID = 'widget-cache-invalidator-group'
AUTO_OFFSET_RESET = 'earliest'
MAX_POLL_RECORDS = 500
```

### Product Services

**Common Structure** (applies to all: Car, Health, House, Banking):

#### Database Schema
```sql
-- Widgets table: stores widget definitions
CREATE TABLE widgets (
    user_id INTEGER,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50),
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    UNIQUE(user_id, widget_id)
);

-- Contracts table: tracks user purchases
CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    widget_id VARCHAR(100),
    FOREIGN KEY (widget_id) REFERENCES widgets(widget_id)
);
```

#### Key Endpoints

**1. Widget Retrieval**
```
GET /widget/{service-key}
Response: { "widgets": [...] }
```

**Logic**:
- If user has active contract → return empty array
- If user has no contract → return personalized widgets
- Products decide filtering/ranking logic independently

**2. Contract Creation**
```
POST /widget/{service-key}/contract
Body: { "user_id": 123, "widget_id": "offer_456" }
Response: { "contract_id": 789, "message": "Success" }
```

**Side Effects**:
- Writes to local database
- Publishes Kafka event for cache invalidation
- Triggers Core Service cache refresh via POST `/cache/invalidate`

**3. Contract Deletion**
```
DELETE /widget/{service-key}/contract/{user_id}/{widget_id}
Response: { "contract_id": 789, "message": "Deleted" }
```

**Side Effects**:
- Removes from local database
- Publishes Kafka event
- Triggers cache invalidation

**4. User Contracts**
```
GET /widget/{service-key}/contract/{user_id}
Response: Widget data for user's active contract
```

---

## API Contracts

### Core Service → Client Applications

#### GET `/home`
**Purpose**: Fetch all widgets for Home page

**Headers**:
```
Cache-Control: no-cache
Pragma: no-cache
```

**Response Schema**:
```typescript
interface HomeResponse {
  services: {
    [serviceKey: string]: {
      title: string;
      widgets: Widget[];
    }
  };
  timestamp: string;
  cache_key: string;
}

interface Widget {
  widget_id: string;
  component_type: 'Card' | 'InfoBox' | 'ProductGrid' | 'SectionHeader';
  priority: number;
  data: WidgetData;
  service?: string;
}

interface WidgetData {
  title?: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  pricing?: {
    price: number;
    currency: string;
    frequency?: string;
  };
  rating?: {
    score: number;
  };
  // Component-specific fields...
}
```

**Status Codes**:
- `200 OK`: Success
- `503 Service Unavailable`: All product services down (rare)

#### GET `/user/{user_id}/contracts`
**Purpose**: Fetch user's active contracts across all services

**Response**:
```json
{
  "has_contract": true,
  "contracts": {
    "car_insurance": {
      "widget_id": "devk_offer_123",
      "data": { ... }
    },
    "health_insurance": null
  }
}
```

#### GET `/stream/updates`
**Purpose**: Server-Sent Events for real-time cache updates

**Event Format**:
```javascript
data: {"type":"cache_invalidated","timestamp":"...","reason":"contract_created","user_id":123}
```

**Client Implementation**:
```javascript
const eventSource = new EventSource('http://api.check24.de/stream/updates');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'cache_invalidated') {
    // Refetch home data
  }
};
```

### Core Service → Product Services

#### GET `/widget/{service-key}`
**Purpose**: Core fetches widgets from product service

**Expected Response**:
```json
{
  "widgets": [
    {
      "widget_id": "unique_id_123",
      "component_type": "Card",
      "priority": 1,
      "data": { ... }
    }
  ]
}
```

**Contract Requirements**:
- Must respond within 5 seconds (timeout)
- Must return valid JSON (schema validation)
- Empty array = no widgets for user (valid state)

---

## Data Flow & Orchestration

### Primary Flow: Home Page Load

```
┌─────────┐
│ Client  │
└────┬────┘
     │ GET /home
     ▼
┌─────────────────┐
│  Core Service   │
└────┬────────────┘
     │ Check Redis Cache
     ▼
┌─────────────────┐       ┌──────────────┐
│  Redis Cache    │──────▶│ Cache Hit?   │
└─────────────────┘       └──┬───────┬───┘
                             │ Yes   │ No
                             ▼       ▼
                      ┌──────────┐  ┌────────────────┐
                      │ Return   │  │ Fetch from     │
                      │ Cached   │  │ Product        │
                      │ Data     │  │ Services       │
                      └──────────┘  └────┬───────────┘
                                         │ (Parallel)
                                         ▼
                      ┌────────────────────────────────┐
                      │ Car | Health | House | Banking │
                      └────┬───────────────────────────┘
                           │ Aggregate Results
                           ▼
                      ┌────────────────┐
                      │ Cache in Redis │
                      └────┬───────────┘
                           │
                           ▼
                      ┌────────────────┐
                      │ Return to      │
                      │ Client         │
                      └────────────────┘
```

**Timing Breakdown** (P95):
- Redis cache hit: <50ms
- Redis cache miss + fetch: <300ms
- Single product service timeout: 5 seconds
- Circuit breaker triggers: After 5 consecutive failures

### Secondary Flow: Contract Purchase

```
┌─────────┐
│  User   │
└────┬────┘
     │ Clicks "Add to Cart"
     ▼
┌─────────────────┐
│  Client App     │
└────┬────────────┘
     │ POST /widget/{service}/contract
     ▼
┌──────────────────────┐
│  Product Service     │
│  1. Create contract  │
│  2. Save to DB       │
│  3. Publish Kafka    │
│  4. POST /cache/     │
│     invalidate       │
└────┬─────────────────┘
     │
     ├──────────────────┐
     │ Kafka Event      │ HTTP POST
     ▼                  ▼
┌──────────────┐  ┌─────────────────┐
│ Kafka Topic  │  │ Core Service    │
└────┬─────────┘  │ DELETE cache    │
     │            └─────────────────┘
     │ Core Service consumer
     ▼
┌──────────────────────┐
│ Core Service         │
│ 1. Invalidate cache  │
│ 2. Notify SSE clients│
└────┬─────────────────┘
     │ SSE Event
     ▼
┌─────────────────┐
│ Client App      │
│ Refetch /home   │
└─────────────────┘
```

**Key Insight**: Dual invalidation strategy ensures:
1. **Immediate invalidation**: POST `/cache/invalidate` (sync)
2. **SSE notifications**: Kafka event → consumer → SSE (async)

This eliminates race conditions where a client might request data before the cache invalidates.

---

## Performance & Caching Strategy

### Cache Architecture

**Redis Configuration**:
```yaml
version: '3'
services:
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
```

**Cache Key Strategy**:
- **Pattern**: `sdui:home_page:v1`
- **Versioning**: `v1` allows easy cache migration
- **Per-user caching**: Not implemented yet (see [Scalability Roadmap](#scalability-roadmap))

### SWR Implementation Details

**Phase 1: Cache Hit (Fresh)**
```python
ttl_remaining = await redis_client.ttl(key)
if ttl_remaining > SWR_GRACE_PERIOD:
    return cached_data  # Fresh data, <50ms response
```

**Phase 2: Cache Hit (Stale)**
```python
if 0 < ttl_remaining <= SWR_GRACE_PERIOD:
    await redis_client.expire(key, SWR_GRACE_PERIOD)  # Extend TTL
    background_tasks.add_task(_revalidate_and_update)  # Async refresh
    return cached_data  # Stale data, but still fast
```

**Phase 3: Cache Miss**
```python
fresh_data = await fetch_from_services()
await redis_client.setex(key, TTL, json.dumps(fresh_data))
return fresh_data  # <300ms response
```

### Performance Metrics

**Measured Results** (local Docker environment):

| Scenario | P50 | P95 | P99 |
|----------|-----|-----|-----|
| Cache Hit (Fresh) | 35ms | 48ms | 62ms |
| Cache Hit (Stale) | 38ms | 51ms | 68ms |
| Cache Miss | 180ms | 285ms | 420ms |
| All Services Down | 45ms | 55ms | 70ms |

**Cache Hit Rate**: 85-95% (estimated for production with 1-hour TTL)

### Circuit Breaker Metrics

**Per-Service Configuration**:
```python
car_insurance_breaker = CircuitBreaker(
    fail_max=5,          # Open after 5 failures
    reset_timeout=10     # Try again after 10s
)
```

**Fallback Behavior**:
- Circuit OPEN → Return fallback widget (no delay)
- Circuit HALF_OPEN → Limited requests to test recovery
- Circuit CLOSED → Normal operation

**Impact**:
- Failed service does NOT impact other services
- Home page remains available at all times
- Fallback widgets provide graceful degradation

---

## High Availability & Resilience

### Failure Scenarios & Mitigations

#### Scenario 1: Single Product Service Down
**Mitigation**:
- Circuit breaker returns fallback widget
- Other services continue normally
- Home page loads with N-1 sections

**User Impact**: Minimal - sees 3/4 services

#### Scenario 2: Redis Cache Down
**Mitigation**:
```python
try:
    cached_data = await redis_client.get(key)
except Exception:
    logger.error("Redis unavailable, fetching fresh")
    return await fetch_from_services()
```

**User Impact**: Slower responses (~300ms) until Redis recovers

#### Scenario 3: Kafka Down
**Mitigation**:
- Cache invalidation via HTTP POST still works
- SSE notifications delayed but not lost
- System continues with slightly stale cache

**User Impact**: Cache invalidation takes 5-10 minutes instead of seconds

#### Scenario 4: All Product Services Down
**Mitigation**:
- Return cached data (even if stale)
- If cache empty: return empty widgets array
- Log critical alert for operations team

**User Impact**: Home page loads, but no personalized widgets

#### Scenario 5: Database Connection Loss
**Mitigation**:
```python
def get_db():
    try:
        db = SessionLocal()
        yield db
    except OperationalError as e:
        raise HTTPException(status_code=503, detail="Database unavailable")
    finally:
        db.close()
```

**User Impact**: 503 error for that specific service (others unaffected)

### Redundancy Strategy

**Horizontal Scaling**:
```yaml
# Example deployment configuration
core_service:
  replicas: 3
  resources:
    limits:
      cpu: "1"
      memory: "512Mi"
```

**Load Balancing**:
- NGINX or cloud load balancer in front of Core Service replicas
- Round-robin or least-connections algorithm
- Health check endpoint: `/health`

**Database Replication**:
- PostgreSQL read replicas for product services
- Widget data read from replicas (low latency)
- Contract writes to primary (strong consistency)

---

## Deployment Architecture

### Container Strategy

**Docker Images**:
1. `core-service:latest` - FastAPI BFF
2. `car-insurance-service:latest` - Product service
3. `health-insurance-service:latest` - Product service
4. `house-insurance-service:latest` - Product service
5. `banking-service:latest` - Product service
6. `web-client:latest` - React frontend (nginx)

**Orchestration**:
```yaml
# docker-compose.yml (simplified)
services:
  core-service:
    build: ./core-service
    ports:
      - "8000:8000"
    environment:
      REDIS_HOST: redis
      KAFKA_BROKER: kafka:9093
    depends_on:
      - redis
      - kafka

  car-insurance-service:
    build: ./car-insurance-service
    ports:
      - "8001:8000"
    environment:
      DB_HOST: product-db-car
      KAFKA_BROKER: kafka:9093
```

### Infrastructure Components

**Required Services**:
1. **Redis**: Caching layer
2. **Kafka + Zookeeper**: Event streaming
3. **PostgreSQL**: 5 instances (1 per service + core)
4. **NGINX**: Reverse proxy & load balancer

**Network Architecture**:
```
Internet
   │
   ▼
┌─────────────────┐
│  Load Balancer  │ (NGINX/ALB)
└────────┬────────┘
         │
    ┌────┴────┐
    │  DMZ    │
    └────┬────┘
         │
    ┌────┴─────────────────────────────┐
    │  Private Network (VPC)           │
    │  ┌──────────────┐                │
    │  │ Core Service │ (3 replicas)   │
    │  └──────┬───────┘                │
    │         │                        │
    │  ┌──────┴───────────────────┐   │
    │  │  Product Services        │   │
    │  │  (4 services, N replicas)│   │
    │  └──────────────────────────┘   │
    │                                  │
    │  ┌──────────────┐               │
    │  │ Data Layer   │               │
    │  │ Redis, Kafka │               │
    │  │ PostgreSQL   │               │
    │  └──────────────┘               │
    └──────────────────────────────────┘
```

### Deployment Process

**1. Build Phase**:
```bash
docker-compose build --no-cache
```

**2. Database Initialization**:
```sql
-- Run migrations for each service
-- Seed initial widget data
```

**3. Service Startup Order**:
1. Infrastructure (Redis, Kafka, Zookeeper, PostgreSQL)
2. Product Services
3. Core Service
4. Frontend Applications

**4. Health Checks**:
```bash
# Verify all services are healthy
curl http://core-service:8000/health
curl http://car-insurance:8001/health
```

**5. Smoke Tests**:
```bash
# Test widget retrieval
curl http://core-service:8000/home

# Test contract creation
curl -X POST http://car-insurance:8001/widget/car-insurance/contract \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "widget_id": "test_widget"}'
```

### Production Considerations

**Cloud Provider Options**:
- **AWS**: ECS/EKS + ElastiCache + MSK (Kafka) + RDS
- **GCP**: GKE + Memorystore + Cloud Pub/Sub + Cloud SQL
- **Azure**: AKS + Azure Cache + Event Hubs + Azure Database

**Infrastructure as Code**:
```hcl
# Terraform example
resource "aws_ecs_service" "core_service" {
  name            = "check24-core-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.core.arn
  desired_count   = 3
  
  load_balancer {
    target_group_arn = aws_lb_target_group.core.arn
    container_name   = "core-service"
    container_port   = 8000
  }
}
```

**Cost Estimation** (AWS, per month):
- ECS Fargate (Core Service, 3 replicas): ~$150
- ECS Fargate (Product Services, 4×2 replicas): ~$400
- ElastiCache Redis (cache.t3.medium): ~$50
- RDS PostgreSQL (db.t3.medium × 5): ~$250
- MSK Kafka (kafka.t3.small): ~$200
- Load Balancer: ~$20
- **Total**: ~$1,070/month (baseline)

**Scaling Costs**:
- 10x traffic → 10x Core Service replicas = +$1,350/month
- Redis Cluster (HA) = +$150/month
- Multi-AZ RDS = +$250/month

---

## Security Considerations

### Authentication & Authorization

**Current State** (PoC):
- User ID hardcoded (123) for demonstration
- No authentication layer

**Production Requirements**:
1. **JWT Token Authentication**:
   ```
   Authorization: Bearer <JWT_TOKEN>
   ```
2. **Token Validation**:
   - Core Service validates JWT signature
   - Extracts user ID from token claims
   - Passes user ID to product services
3. **Rate Limiting**:
   - Per-user: 100 requests/minute
   - Per-IP: 1000 requests/minute

### Data Protection

**In Transit**:
- HTTPS/TLS 1.3 for all client communication
- mTLS between Core Service and Product Services (optional)

**At Rest**:
- PostgreSQL encryption at rest
- Redis AUTH password protection
- Encrypted backups

**PII Handling**:
- Widget data should NOT contain PII (email, phone, address)
- Use anonymized identifiers (user_id, widget_id)
- GDPR-compliant data retention policies

### Network Security

**Firewall Rules**:
```
Core Service:
  - Inbound: 443 (HTTPS from internet)
  - Outbound: 8001-8004 (product services), 6379 (Redis), 9092 (Kafka)

Product Services:
  - Inbound: 8000 (from Core Service only)
  - Outbound: 5432 (PostgreSQL), 9092 (Kafka)

Data Layer:
  - Inbound: 6379, 9092, 5432 (from services only)
  - No public internet access
```

**DDoS Protection**:
- CloudFlare or AWS Shield
- Rate limiting at load balancer level
- Automatic scaling based on traffic patterns

---

## Monitoring & Observability

### Key Metrics

**Core Service**:
- Request rate (requests/second)
- Response time (P50, P95, P99)
- Cache hit rate (%)
- Circuit breaker state (per service)
- Error rate (%)

**Product Services**:
- Database query time (ms)
- Kafka publish latency (ms)
- Widget generation time (ms)

**Infrastructure**:
- Redis memory usage (%)
- Redis eviction rate (keys/second)
- Kafka consumer lag (messages)
- PostgreSQL connection pool usage

### Logging Strategy

**Structured Logging** (JSON format):
```json
{
  "timestamp": "2025-12-19T12:00:00Z",
  "level": "INFO",
  "service": "core-service",
  "message": "Widget fetch successful",
  "user_id": 123,
  "cache_hit": true,
  "response_time_ms": 45
}
```

**Log Levels**:
- **DEBUG**: Detailed flow (disabled in production)
- **INFO**: Request/response logs, cache hits/misses
- **WARNING**: Slow queries, circuit breaker state changes
- **ERROR**: Failed requests, exceptions
- **CRITICAL**: System failures, database down

**Log Aggregation**:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Cloud-native (CloudWatch, Stackdriver)

### Alerting Rules

**Critical Alerts** (PagerDuty):
- All product services down (5+ minutes)
- Core Service error rate >5% (1 minute)
- Redis cache unavailable (1 minute)
- Database connection pool exhausted

**Warning Alerts** (Slack):
- Cache hit rate <70% (15 minutes)
- Response time P95 >500ms (5 minutes)
- Circuit breaker OPEN for any service (1 minute)

### Tracing

**Distributed Tracing** (OpenTelemetry):
```
Trace ID: 1a2b3c4d5e6f
├─ Core Service: GET /home [180ms]
│  ├─ Redis: GET cache [5ms]
│  ├─ Car Service: GET /widget [45ms]
│  ├─ Health Service: GET /widget [52ms]
│  ├─ House Service: GET /widget [48ms]
│  └─ Banking Service: GET /widget [50ms]
```

**Benefits**:
- Identify slow services in aggregation flow
- Debug cache invalidation delays
- Optimize API call patterns

---

## Scalability Roadmap

### Current Bottlenecks

1. **Single Redis Instance**:
   - Limit: ~50,000 requests/second
   - Solution: Redis Cluster with sharding

2. **Global Cache Key**:
   - All users share same cache (`sdui:home_page:v1`)
   - Solution: Per-user caching (`sdui:home_page:v1:user:{user_id}`)

3. **Synchronous Service Calls**:
   - Core Service waits for all 4 product services sequentially
   - Solution: Already implemented (parallel asyncio.gather)

4. **Database Read Load**:
   - Product services query database for every widget request
   - Solution: Local caching layer (Redis) per product service

### Phase 1: Per-User Caching (Q1 2026)

**Change**:
```python
# Current
cache_key = "sdui:home_page:v1"

# Future
cache_key = f"sdui:home_page:v1:user:{user_id}"
```

**Impact**:
- +Personalization accuracy (no shared cache pollution)
- -Redis memory usage (1 cache entry per active user)

**Capacity Planning**:
- 1M active users
- 10KB per cache entry
- Total: 10GB Redis memory (affordable)

### Phase 2: Redis Cluster (Q2 2026)

**Cluster Configuration**:
- 3 master nodes
- 3 replica nodes
- Hash slot distribution: 16,384 slots / 3 = ~5,461 slots per master

**Benefits**:
- Horizontal scaling of cache capacity
- Automatic failover (HA)
- 3x throughput (distributed load)

### Phase 3: CDN Integration (Q3 2026)

**Use Case**: Serve static widget images from CDN.

**Flow**:
```
Client → CDN (CloudFront/Cloudflare)
         ├─ Cache Hit → Return image (10ms)
         └─ Cache Miss → Origin (S3) → Cache → Return (100ms)
```

**Impact**:
- 90% reduction in image load time
- Lower bandwidth costs for Core Service

### Phase 4: GraphQL API (Q4 2026)

**Motivation**: Allow clients to request specific widget fields.

**Example Query**:
```graphql
query HomeWidgets {
  services(userId: 123) {
    carInsurance {
      widgets {
        id
        title
        pricing { price currency }
      }
    }
  }
}
```

**Benefits**:
- Reduced payload size (mobile bandwidth savings)
- Flexible client-driven queries
- Better analytics on field usage

---

## Decision Rationale

### Why FastAPI?

**Alternatives Considered**: Django, Flask, Node.js/Express, Go/Gin

**Reasons**:
1. **Async First**: Native async/await for non-blocking I/O
2. **Type Safety**: Pydantic models ensure contract validation
3. **Performance**: 2-3x faster than Flask (benchmarks)
4. **Developer Experience**: Auto-generated OpenAPI docs
5. **Ecosystem**: Rich libraries (HTTPX, Redis, Kafka)

**Trade-offs**:
- Smaller community than Django (acceptable)
- Fewer built-in features than Django (we need minimal framework)

### Why Redis (not Memcached)?

**Reasons**:
1. **Data Structures**: Strings, hashes, lists (useful for future)
2. **Persistence**: Optional RDB/AOF snapshots (cache warmup)
3. **Pub/Sub**: Native pub/sub for SSE (future use)
4. **Clustering**: Built-in Redis Cluster (horizontal scaling)

**Trade-offs**:
- Slightly slower than Memcached (negligible at our scale)

### Why Kafka (not RabbitMQ/SQS)?

**Reasons**:
1. **Event Sourcing**: Replay events from any offset (debugging)
2. **Throughput**: 1M+ messages/second (future-proof)
3. **Consumer Groups**: Multiple consumers for scaling
4. **Retention**: Configurable retention (7 days default)

**Trade-offs**:
- Operational complexity (Zookeeper required)
- Overkill for low-volume use cases (acceptable for CHECK24 scale)

### Why Docker Compose (not Kubernetes)?

**Reasons**:
1. **Simplicity**: Easy local development setup
2. **Reproducibility**: Identical environments (dev/staging/prod)
3. **Learning Curve**: Developers familiar with Docker

**Trade-offs**:
- Not production-grade orchestration (use ECS/EKS in production)
- Limited auto-scaling (manual replica scaling)

**Production Path**: Migrate to Kubernetes/ECS once traffic justifies complexity.

### Why BFF Pattern?

**Alternatives Considered**: API Gateway, GraphQL Federation, Direct Client-to-Services

**Reasons**:
1. **Performance**: Centralized caching reduces product service load
2. **Security**: Single authentication/authorization point
3. **Flexibility**: Clients don't need to know about product services
4. **Aggregation**: Parallel fetching + circuit breaker in one place

**Trade-offs**:
- Extra hop (latency) → mitigated by caching
- Potential bottleneck → mitigated by horizontal scaling

---

## Appendix

### A. Environment Variables

**Core Service** (`core-service/.env`):
```env
REDIS_HOST=redis
REDIS_PORT=6379
KAFKA_BROKER=kafka:9093
CAR_INSURANCE_SERVICE_URL=http://car-insurance-service:8000
HEALTH_INSURANCE_SERVICE_URL=http://health-insurance-service:8000
HOUSE_INSURANCE_SERVICE_URL=http://house-insurance-service:8000
BANKING_SERVICE_URL=http://banking-service:8000
```

**Product Service** (`car-insurance-service/.env`):
```env
DB_HOST=product-db-car
DB_USER=product_user
DB_PASSWORD=product_password
DB_NAME=car_insurance_db
KAFKA_BROKER=kafka:9093
CORE_SERVICE_URL=http://core-service:8000
```

### B. Database Initialization Scripts

**Example**: `car-insurance-service/db_init/init.sql`
```sql
-- Create tables
CREATE TABLE widgets (
    user_id INTEGER,
    widget_id VARCHAR(100) PRIMARY KEY,
    component_type VARCHAR(50),
    priority INTEGER DEFAULT 0,
    data JSONB NOT NULL,
    UNIQUE(user_id, widget_id)
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    widget_id VARCHAR(100),
    FOREIGN KEY (widget_id) REFERENCES widgets(widget_id)
);

-- Seed sample widgets
INSERT INTO widgets (user_id, widget_id, component_type, priority, data) VALUES
(123, 'car_offer_devk', 'Card', 1, '{
  "title": "Kfz-Versicherung DEVK",
  "subtitle": "Top-Angebot für VW Golf",
  "content": "Vollkasko. 500€ Selbstbeteiligung.",
  "image_url": "assets/images/companies/devk.svg",
  "pricing": {"price": 89.00, "currency": "€", "frequency": "Monat"},
  "rating": {"score": 4.8}
}'::jsonb);
```

### C. API Request Examples

**cURL Examples**:
```bash
# 1. Fetch home widgets
curl -X GET http://localhost:8000/home

# 2. Create car insurance contract
curl -X POST http://localhost:8001/widget/car-insurance/contract \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "widget_id": "car_offer_devk"}'

# 3. Get user contracts
curl -X GET http://localhost:8000/user/123/contracts

# 4. Delete contract
curl -X DELETE http://localhost:8001/widget/car-insurance/contract/123/car_offer_devk
```

### D. Testing Checklist

**Functional Tests**:
- [ ] Home page loads with widgets
- [ ] Contract creation triggers cache invalidation
- [ ] Contract deletion triggers cache invalidation
- [ ] SSE events received on contract changes
- [ ] Circuit breaker opens after 5 failures
- [ ] Fallback widgets displayed on service failure

**Performance Tests**:
- [ ] Cache hit response time <100ms
- [ ] Cache miss response time <500ms
- [ ] 1000 concurrent requests handled without errors

**Resilience Tests**:
- [ ] System survives Redis restart
- [ ] System survives Kafka restart
- [ ] System survives single product service failure
- [ ] System survives all product services failure

---

## Glossary

- **BFF**: Backend for Frontend - API layer tailored for specific client needs
- **SDUI**: Server-Driven UI - UI structure defined by API responses
- **SWR**: Stale-While-Revalidate - Caching strategy for fresh data
- **Circuit Breaker**: Failure protection pattern (stop calling failing services)
- **SSE**: Server-Sent Events - One-way real-time communication (server → client)
- **Kafka**: Distributed event streaming platform
- **Redis**: In-memory data store (cache)
- **TTL**: Time-to-Live - Cache expiration time
- **HTTPX**: Modern async HTTP client for Python

---

## Contact & Support

**Core Team**: core-engineering@check24.de
**Product Teams**: See [DEVELOPER_GUIDELINE.md](./DEVELOPER_GUIDELINE.md)
**DevOps**: devops@check24.de

---

*Document Version: 1.0*  
*Last Updated: December 19, 2025*  
*Authors: GenDev Application Team*
