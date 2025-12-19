# CHECK24 Home Widgets - Developer Integration Guide

## Welcome, Product Teams! 👋

This guide helps you integrate your product with the CHECK24 Home Widgets platform. You'll learn how to create, deploy, and manage widgets that appear on the centralized Home page across Web, iOS, and Android.

**Target Audience**: Developers in decentralized product teams (Car Insurance, Health Insurance, House Insurance, Banking, etc.)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Widget JSON Contract](#widget-json-contract)
3. [API Integration](#api-integration)
4. [Component Types](#component-types)
5. [Personalization Guidelines](#personalization-guidelines)
6. [Testing Your Integration](#testing-your-integration)
7. [Deployment Checklist](#deployment-checklist)
8. [Performance Best Practices](#performance-best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Quick Start

### Prerequisites

✅ **What You Need**:
- Python 3.11+ environment
- PostgreSQL database (for widget storage)
- Kafka access (for event publishing)
- Docker (for local testing)

✅ **What You DON'T Need**:
- Access to Core Service codebase
- Coordination with other product teams
- Special permissions (you own your service)

### 5-Minute Setup

**Step 1**: Clone the product service template
```bash
git clone https://github.com/check24/product-service-template.git my-product-service
cd my-product-service
```

**Step 2**: Configure your service
```bash
cp .env.example .env
# Edit .env with your database credentials
```

**Step 3**: Initialize database
```bash
docker-compose up -d postgres
python scripts/init_db.py
```

**Step 4**: Run your service
```bash
uvicorn app.main:app --reload --port 8001
```

**Step 5**: Test widget retrieval
```bash
curl http://localhost:8001/widget/my-product
```

**Expected Response**:
```json
{
  "widgets": [
    {
      "widget_id": "sample_widget_1",
      "component_type": "Card",
      "priority": 1,
      "data": {
        "title": "Sample Product Offer",
        "content": "Special deal for you!",
        "pricing": {
          "price": 99.00,
          "currency": "€"
        }
      }
    }
  ]
}
```

🎉 **Success!** You've created your first widget.

---

## Widget JSON Contract

### The Golden Rule

**All platforms (Web, iOS, Android) consume the SAME JSON structure.**

This means:
- ✅ Change JSON → All platforms update
- ❌ No separate APIs for Web vs. App
- ✅ A/B testing via JSON variations

### Base Widget Structure

Every widget must follow this schema:

```json
{
  "widget_id": "unique_identifier_123",
  "component_type": "Card",
  "priority": 1,
  "data": {
    // Component-specific fields
  }
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `widget_id` | string | ✅ Yes | Unique identifier (use product prefix, e.g., `car_offer_123`) |
| `component_type` | string | ✅ Yes | UI component type (see [Component Types](#component-types)) |
| `priority` | integer | ⚠️ Optional | Lower = higher priority (default: 0) |
| `data` | object | ✅ Yes | Component-specific data fields |

### Data Field Guidelines

**Common Fields** (supported by most components):

```json
{
  "data": {
    "title": "Main heading text",
    "subtitle": "Secondary heading",
    "content": "Descriptive text content",
    "image_url": "assets/images/companies/logo.svg",
    "cta_link": "/product/compare",
    "pricing": {
      "price": 89.00,
      "currency": "€",
      "frequency": "Monat"
    },
    "rating": {
      "score": 4.8,
      "label": "Sehr gut"
    }
  }
}
```

**⚠️ Important Rules**:
- All prices must be `number` type (not strings)
- Image URLs must be relative paths starting with `assets/`
- Text fields should be pre-formatted (clients don't do text processing)
- No PII (email, phone, address) in widget data

---

## API Integration

### Required Endpoints

Your product service must implement these 4 endpoints:

#### 1. GET `/widget/{your-product-key}`

**Purpose**: Core Service fetches widgets for a user

**Request**:
```http
GET /widget/car-insurance HTTP/1.1
Host: car-insurance-service:8000
```

**Response** (200 OK):
```json
{
  "widgets": [
    {
      "widget_id": "car_offer_devk_123",
      "component_type": "Card",
      "priority": 1,
      "data": {
        "title": "Kfz-Versicherung DEVK",
        "subtitle": "Top-Angebot für VW Golf",
        "content": "Vollkasko. 500€ Selbstbeteiligung. Bis zu 30% sparen.",
        "image_url": "assets/images/companies/devk.svg",
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
  ]
}
```

**Logic Examples**:
```python
# Example 1: User has no contract → show offers
if not user_has_contract(user_id):
    return {"widgets": get_top_offers(user_id)}

# Example 2: User has contract → hide offers
if user_has_contract(user_id):
    return {"widgets": []}

# Example 3: User searched recently → personalize
if user_searched_recently(user_id):
    return {"widgets": get_recommended_offers(user_id, search_params)}
```

**Performance Requirements**:
- **Response Time**: <5 seconds (hard timeout)
- **Payload Size**: <100KB (recommended)
- **Widget Count**: 3-6 widgets (more = slower Home load)

#### 2. POST `/widget/{your-product-key}/contract`

**Purpose**: User purchases/activates your product

**Request**:
```http
POST /widget/car-insurance/contract HTTP/1.1
Content-Type: application/json

{
  "user_id": 123,
  "widget_id": "car_offer_devk_123"
}
```

**Response** (200 OK):
```json
{
  "contract_id": 789,
  "user_id": 123,
  "widget_id": "car_offer_devk_123",
  "message": "Contract created successfully"
}
```

**Required Side Effects**:
1. ✅ Save contract to your database
2. ✅ Publish Kafka event: `user.{product}.purchased`
3. ✅ Call Core Service: `POST /cache/invalidate`

**Example Implementation**:
```python
@app.post("/widget/car-insurance/contract")
async def create_contract(request: ContractRequest):
    # 1. Save to database
    contract = save_contract(request.user_id, request.widget_id)
    
    # 2. Invalidate Core Service cache (sync)
    await invalidate_core_cache()
    
    # 3. Publish Kafka event (async)
    await publish_event(
        topic="user.car.insurance.purchased",
        event={
            "event_type": "contract_created",
            "user_id": request.user_id,
            "widget_id": request.widget_id,
            "contract_id": contract.id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )
    
    return {"contract_id": contract.id, "message": "Success"}
```

#### 3. GET `/widget/{your-product-key}/contract/{user_id}`

**Purpose**: Retrieve user's active contract data

**Request**:
```http
GET /widget/car-insurance/contract/123 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "widget_id": "car_offer_devk_123",
  "data": {
    "title": "Ihre DEVK Kfz-Versicherung",
    "subtitle": "VW Golf 7 - Vollkasko",
    "image_url": "assets/images/companies/devk.svg",
    "pricing": {
      "price": 89.00,
      "currency": "€",
      "frequency": "Monat"
    }
  }
}
```

**Response** (404 Not Found):
```json
{
  "detail": "No contracts found."
}
```

#### 4. DELETE `/widget/{your-product-key}/contract/{user_id}/{widget_id}`

**Purpose**: User cancels/deletes contract

**Request**:
```http
DELETE /widget/car-insurance/contract/123/car_offer_devk_123 HTTP/1.1
```

**Response** (200 OK):
```json
{
  "contract_id": 789,
  "message": "Contract deleted successfully"
}
```

**Required Side Effects**:
1. ✅ Delete contract from your database
2. ✅ Publish Kafka event: `user.{product}.purchased` (event_type: "contract_deleted")
3. ✅ Call Core Service: `POST /cache/invalidate`

---

## Component Types

### 1. Card (Product Offer)

**Best For**: Product recommendations, comparison offers

**Example**:
```json
{
  "component_type": "Card",
  "data": {
    "title": "Kfz-Versicherung vergleichen",
    "subtitle": "Top-Angebot für Sie",
    "content": "Vollkasko ab 89€/Monat. 500€ SB. Bis zu 30% sparen.",
    "image_url": "assets/images/cars/vw-golf-7-used.png",
    "cta_link": "/versicherungen/kfz/vergleich",
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

**Visual Example**:
```
┌─────────────────────────────────┐
│  [Image: VW Golf]               │
│                                 │
│  Kfz-Versicherung vergleichen   │
│  Top-Angebot für Sie            │
│                                 │
│  89,00 €/Monat                  │
│  ★ 4.8                          │
│                                 │
│  Vollkasko ab 89€/Monat...      │
│                                 │
│  [ Add to Cart ]                │
└─────────────────────────────────┘
```

### 2. InfoBox (Informational Content)

**Best For**: Tips, warnings, alternative suggestions

**Example**:
```json
{
  "component_type": "InfoBox",
  "data": {
    "title": "Wussten Sie schon?",
    "subtitle": "Sparpotenzial bei Hausratversicherung",
    "content": "Viele Versicherte zahlen zu viel. Vergleichen Sie jetzt und sparen Sie bis zu 40%.",
    "footer": "Jetzt Vergleich starten →"
  }
}
```

**Visual Example**:
```
┌────────────────────────────────────┐
│ ℹ️  Wussten Sie schon?            │
│    Sparpotenzial bei Hausrat...   │
│                                    │
│ Viele Versicherte zahlen zu viel. │
│ Vergleichen Sie jetzt...           │
│                                    │
│ ──────────────────────────────────│
│ Jetzt Vergleich starten →         │
└────────────────────────────────────┘
```

### 3. ProductGrid (Multiple Products)

**Best For**: Showcasing 4-8 related products in a grid

**Example**:
```json
{
  "component_type": "ProductGrid",
  "data": {
    "title": "Beliebte Gebrauchtwagen",
    "products": [
      {
        "id": "vw_golf_1",
        "title": "VW Golf 7",
        "image_url": "assets/images/cars/vw-golf-7-used.png",
        "pricing": {
          "price": 15990.00,
          "currency": "€"
        },
        "rating": 4.7
      },
      {
        "id": "bmw_3series_1",
        "title": "BMW 3er",
        "image_url": "assets/images/cars/bmw-3series-used.png",
        "pricing": {
          "price": 22500.00,
          "currency": "€"
        },
        "rating": 4.9
      }
    ]
  }
}
```

**Visual Example**:
```
Beliebte Gebrauchtwagen
┌──────────┐  ┌──────────┐
│ VW Golf  │  │ BMW 3er  │
│ [Image]  │  │ [Image]  │
│ 15.990€  │  │ 22.500€  │
│ ★ 4.7    │  │ ★ 4.9    │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│ Audi A4  │  │ Toyota   │
│ ...      │  │ ...      │
└──────────┘  └──────────┘
```

### 4. SectionHeader (Category Title)

**Best For**: Introducing a group of widgets, collapsible sections

**Example**:
```json
{
  "component_type": "SectionHeader",
  "data": {
    "title": "Versicherungen",
    "subtitle": "Hide Recommendations",
    "description": "Ihre personalisierten Versicherungsangebote"
  }
}
```

**Visual Example**:
```
┌────────────────────────────────────┐
│ Versicherungen            [↕️]     │
│ Ihre personalisierten...           │
└────────────────────────────────────┘
```

---

## Personalization Guidelines

### User Context

**Available Data** (you can use for personalization):
- `user_id`: Unique user identifier
- User's past contracts (in your service)
- User's search history (in your service)
- User's browsing behavior (in your service)

**NOT Available** (centralized data):
- ❌ Cross-product behavior (e.g., user searched flights → show car insurance)
- ❌ Global user preferences (managed by Core)
- ❌ Other products' contract data (privacy)

### Personalization Strategies

**Strategy 1: Contract-Based**
```python
def get_widgets(user_id):
    if has_contract(user_id):
        return []  # Don't show offers if already customer
    else:
        return get_top_offers(user_id)
```

**Strategy 2: Search-Based**
```python
def get_widgets(user_id):
    recent_search = get_user_search(user_id, days=7)
    if recent_search:
        return get_offers_matching(recent_search)
    else:
        return get_default_offers()
```

**Strategy 3: Behavioral**
```python
def get_widgets(user_id):
    user_segment = classify_user(user_id)  # "bargain_hunter", "premium", etc.
    return get_offers_for_segment(user_segment)
```

**Strategy 4: Time-Based**
```python
def get_widgets(user_id):
    if is_weekend():
        return get_weekend_offers()
    elif is_holiday_season():
        return get_seasonal_offers()
    else:
        return get_default_offers()
```

### A/B Testing

**Example**: Test two pricing presentations

**Variant A** (control):
```json
{
  "widget_id": "car_offer_variant_a",
  "data": {
    "title": "Kfz-Versicherung",
    "pricing": {"price": 89.00, "currency": "€", "frequency": "Monat"}
  }
}
```

**Variant B** (yearly pricing):
```json
{
  "widget_id": "car_offer_variant_b",
  "data": {
    "title": "Kfz-Versicherung",
    "pricing": {"price": 1068.00, "currency": "€", "frequency": "Jahr"}
  }
}
```

**Implementation**:
```python
def get_widgets(user_id):
    variant = assign_variant(user_id)  # 50/50 split
    if variant == "A":
        return [get_monthly_pricing_widget()]
    else:
        return [get_yearly_pricing_widget()]
```

---

## Testing Your Integration

### Local Testing Setup

**Step 1**: Start Core Service + Your Service
```bash
# Terminal 1: Core Service
cd core-service
docker-compose up redis kafka zookeeper
uvicorn app.main:app --port 8000

# Terminal 2: Your Service
cd my-product-service
uvicorn app.main:app --port 8001
```

**Step 2**: Test Widget Retrieval
```bash
# Direct service test
curl http://localhost:8001/widget/my-product

# Core Service aggregation test
curl http://localhost:8000/home
```

**Step 3**: Test Contract Creation
```bash
curl -X POST http://localhost:8001/widget/my-product/contract \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123, "widget_id": "test_widget_1"}'
```

**Step 4**: Verify Cache Invalidation
```bash
# 1. Check Redis cache before
docker exec -it redis redis-cli GET "sdui:home_page:v1"

# 2. Create contract (triggers invalidation)
# (run curl command from Step 3)

# 3. Check Redis cache after (should be empty)
docker exec -it redis redis-cli GET "sdui:home_page:v1"
```

### Integration Tests

**Example Test Suite** (using pytest):

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_widget_retrieval():
    async with AsyncClient() as client:
        response = await client.get("http://localhost:8001/widget/my-product")
        assert response.status_code == 200
        data = response.json()
        assert "widgets" in data
        assert len(data["widgets"]) > 0

@pytest.mark.asyncio
async def test_contract_creation():
    async with AsyncClient() as client:
        response = await client.post(
            "http://localhost:8001/widget/my-product/contract",
            json={"user_id": 999, "widget_id": "test_widget"}
        )
        assert response.status_code == 200
        assert "contract_id" in response.json()

@pytest.mark.asyncio
async def test_contract_hides_widgets():
    async with AsyncClient() as client:
        # Before: User has no contract, widgets visible
        response = await client.get("http://localhost:8001/widget/my-product")
        assert len(response.json()["widgets"]) > 0
        
        # Create contract
        await client.post(
            "http://localhost:8001/widget/my-product/contract",
            json={"user_id": 999, "widget_id": "test_widget"}
        )
        
        # After: User has contract, widgets hidden
        response = await client.get("http://localhost:8001/widget/my-product")
        assert len(response.json()["widgets"]) == 0
```

### Platform Testing

**Web Client**:
```bash
cd web-client
npm install
npm run dev
# Open http://localhost:5173
```

**Android App**:
```bash
cd android-client
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

**iOS App**:
```bash
cd ios-client
pod install
open Check24.xcworkspace
# Build & Run in Xcode
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Database Migration**: Run schema updates
- [ ] **Environment Variables**: Configure production values
- [ ] **Secret Management**: Rotate API keys, DB passwords
- [ ] **Health Check**: Implement `/health` endpoint
- [ ] **Logging**: Ensure structured JSON logging
- [ ] **Monitoring**: Set up alerts for errors/latency

### Deployment Steps

1. **Build Docker Image**:
   ```bash
   docker build -t my-product-service:v1.0.0 .
   docker tag my-product-service:v1.0.0 registry.check24.de/my-product-service:v1.0.0
   docker push registry.check24.de/my-product-service:v1.0.0
   ```

2. **Update Kubernetes/ECS Config**:
   ```yaml
   # k8s deployment
   containers:
     - name: my-product-service
       image: registry.check24.de/my-product-service:v1.0.0
       env:
         - name: DB_HOST
           value: "production-db.check24.de"
   ```

3. **Rolling Update**:
   ```bash
   kubectl set image deployment/my-product-service \
     my-product-service=registry.check24.de/my-product-service:v1.0.0
   ```

4. **Verify Health**:
   ```bash
   curl https://my-product-service.check24.de/health
   ```

### Post-Deployment

- [ ] **Smoke Tests**: Test widget retrieval, contract creation
- [ ] **Monitor Logs**: Check for errors in first 30 minutes
- [ ] **Cache Metrics**: Verify cache hit rate in Core Service
- [ ] **Performance**: Check response times (should be <5s)

---

## Performance Best Practices

### Database Optimization

**1. Index Widget Queries**:
```sql
CREATE INDEX idx_widgets_user_id ON widgets(user_id);
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
```

**2. Use Connection Pooling**:
```python
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    pool_size=20,           # Max connections
    max_overflow=10,        # Extra connections under load
    pool_pre_ping=True      # Test connections before use
)
```

**3. Avoid N+1 Queries**:
```python
# ❌ Bad: N+1 queries
widgets = session.query(Widget).filter(Widget.user_id == 123).all()
for widget in widgets:
    contract = session.query(Contract).filter(Contract.widget_id == widget.id).first()

# ✅ Good: Single join query
widgets = (
    session.query(Widget)
    .outerjoin(Contract, Widget.widget_id == Contract.widget_id)
    .filter(Widget.user_id == 123)
    .all()
)
```

### API Response Optimization

**1. Limit Widget Count**:
```python
# Return max 6 widgets (too many = slow Home load)
widgets = get_top_widgets(user_id, limit=6)
```

**2. Compress Large Images**:
```bash
# Optimize SVG files
svgo assets/images/companies/logo.svg

# Convert PNG to WebP (smaller size)
cwebp assets/images/cars/vw-golf.png -o assets/images/cars/vw-golf.webp
```

**3. Minimize JSON Payload**:
```json
// ❌ Bad: Unnecessary fields
{
  "widget_id": "car_offer_123",
  "data": {
    "internal_id": 456789,          // Not needed by clients
    "created_at": "2025-01-01",     // Not displayed
    "debug_info": {...}             // Remove in production
  }
}

// ✅ Good: Only essential fields
{
  "widget_id": "car_offer_123",
  "data": {
    "title": "Kfz-Versicherung",
    "pricing": {"price": 89.00, "currency": "€"}
  }
}
```

### Kafka Event Publishing

**1. Async Publishing**:
```python
# ❌ Bad: Blocks request until Kafka confirms
await producer.send_and_wait(topic, event)

# ✅ Good: Fire-and-forget (non-blocking)
await producer.send(topic, event)
```

**2. Batch Events**:
```python
# If publishing many events, batch them
events = [event1, event2, event3]
await producer.send_batch(topic, events)
```

---

## Troubleshooting

### Issue 1: Widgets Not Showing on Home

**Symptoms**: Your widgets don't appear on the Home page

**Checklist**:
1. ✅ Service is running: `curl http://your-service:8001/health`
2. ✅ Widget endpoint returns data: `curl http://your-service:8001/widget/your-product`
3. ✅ Core Service can reach your service: Check network/firewall
4. ✅ Circuit breaker is closed: Check Core Service logs for "Circuit OPEN"
5. ✅ Response time <5s: Slow services get timed out

**Debug Steps**:
```bash
# Check Core Service logs
docker logs core-service | grep "your-product"

# Check circuit breaker state
curl http://core-service:8000/debug/circuit-breaker-status
```

### Issue 2: Cache Not Invalidating

**Symptoms**: Contract created but old widgets still shown

**Checklist**:
1. ✅ Kafka event published: Check Kafka UI for messages
2. ✅ Core Service consumer running: Check logs for "Kafka Consumer started"
3. ✅ Redis accessible: `docker exec redis redis-cli PING`
4. ✅ Cache invalidation called: Check logs for "Cache invalidated"

**Debug Steps**:
```bash
# Check Kafka messages
docker exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user.your-product.purchased \
  --from-beginning

# Check Redis cache manually
docker exec redis redis-cli GET "sdui:home_page:v1"

# Manually invalidate cache
curl -X POST http://core-service:8000/cache/invalidate
```

### Issue 3: Slow Widget Retrieval

**Symptoms**: Widget endpoint takes >5 seconds

**Checklist**:
1. ✅ Database query optimized: Use `EXPLAIN ANALYZE`
2. ✅ No external API calls: Timeout or cache externally
3. ✅ Connection pool not exhausted: Check pool size
4. ✅ No heavy computation: Profile with `cProfile`

**Debug Steps**:
```python
# Add timing logs
import time

start = time.time()
widgets = get_widgets(user_id)
elapsed = time.time() - start
logger.info(f"Widget retrieval took {elapsed:.2f}s")
```

### Issue 4: JSON Validation Errors

**Symptoms**: Clients reject your widget JSON

**Checklist**:
1. ✅ Valid JSON syntax: Use `jq` or JSON validator
2. ✅ All required fields present: `widget_id`, `component_type`, `data`
3. ✅ Correct data types: `price` is number, not string
4. ✅ No extra top-level fields: Only `widget_id`, `component_type`, `priority`, `data`

**Debug Steps**:
```bash
# Validate JSON response
curl http://your-service:8001/widget/your-product | jq .

# Check for required fields
curl http://your-service:8001/widget/your-product | \
  jq '.widgets[] | select(.widget_id == null or .component_type == null)'
```

---

## FAQ

### Q1: Can I use a different tech stack (Node.js, Go, Java)?

**A**: Yes! The API contract is language-agnostic. As long as you:
- Return valid JSON (`GET /widget/{product}`)
- Publish Kafka events
- Call Core Service cache invalidation
- Respond within 5 seconds

You can use any technology.

### Q2: How many widgets should I return?

**A**: **3-6 widgets** is optimal. More widgets = slower Home page load + worse UX.

### Q3: Can I show widgets to users who already have a contract?

**A**: Yes, but consider the use case:
- ✅ Upsell/cross-sell: "Upgrade to premium plan"
- ✅ Related products: "Add travel insurance to your car insurance"
- ❌ Same offer again: "Buy car insurance" (when they already have it)

### Q4: How do I test on staging environment?

**A**: Connect to staging Core Service:
```python
CORE_SERVICE_URL = "https://staging-core.check24.de"
```

Ensure your service is registered in Core Service config.

### Q5: What happens if my service is down?

**A**: Core Service circuit breaker opens → Fallback widget shown → Home page stays up.

### Q6: Can I change widget layout without Core Service deploy?

**A**: Yes! Change JSON structure:
```json
// Before (2 columns)
{"component_type": "Card", ...}

// After (full width)
{"component_type": "FullWidthCard", ...}
```

Clients will re-render automatically (no deploy needed).

### Q7: How do I track widget impressions/clicks?

**A**: Add tracking IDs to your widgets:
```json
{
  "widget_id": "car_offer_123",
  "data": {
    "tracking_id": "campaign_summer_2025",
    "cta_link": "/compare?utm_source=home&utm_campaign=summer_2025"
  }
}
```

Track clicks via your analytics system.

### Q8: Can I use custom fonts/styles?

**A**: No. Clients use platform-specific design systems:
- Web: CHECK24 CSS theme
- iOS: UIKit / SwiftUI styles
- Android: Material Design 3

Your JSON defines content, not presentation.

### Q9: How do I handle multi-language support?

**A**: Return localized text based on user preference:
```python
def get_widgets(user_id):
    locale = get_user_locale(user_id)  # "de_DE", "en_US"
    if locale == "de_DE":
        title = "Kfz-Versicherung"
    else:
        title = "Car Insurance"
    return [{"data": {"title": title, ...}}]
```

### Q10: What's the rollback process if my widget breaks?

**A**: Two options:
1. **Quick fix**: Deploy updated widget JSON (5 minutes)
2. **Emergency**: Ask Core team to disable your service endpoint (2 minutes)

---

## Support & Resources

### Documentation
- **API Reference**: https://docs.check24.de/widgets/api
- **Component Gallery**: https://docs.check24.de/widgets/components
- **Performance Guide**: https://docs.check24.de/widgets/performance

### Contact
- **Core Team**: core-engineering@check24.de
- **Slack Channel**: #home-widgets-support
- **Emergency Hotline**: +49 123 456 7890

### Office Hours
- **Weekly Sync**: Tuesdays 10:00 CET (optional)
- **Q&A Session**: Thursdays 14:00 CET (open to all)

---

## Changelog

**v1.0** (2025-12-19):
- Initial release
- Added Card, InfoBox, ProductGrid, SectionHeader components
- SWR caching with 1-hour TTL
- Kafka-based cache invalidation

---

*Last Updated: December 19, 2025*  
*Version: 1.0*  
*Maintained by: Core Engineering Team*
