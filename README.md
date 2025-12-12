# Docker Environment:
docker compose down
docker volume rm check24-widget-platform_product_db_data
docker compose up --build -d

# Access product db:
Access the Database Visually

    Open your web browser and navigate to http://localhost:8081.

    On the Adminer login screen, enter the connection details for your product-db:

Field	Value
System	PostgreSQL
Server	product-db
Username	product_user
Password	product_password
Database	product_data

# Access Frontend:
cd web-client
npm i
npm run dev  

# start server core-service
cd core-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug --reload

# check if redis cache has data:
docker run -it --network host redis:7-alpine redis-cli -h 127.0.0.1 -p 6379
SCAN 0 MATCH *:is_refreshing
GET "sdui:home_page:v1"

# check if server failed with data load from api
docker-compose logs --tail 100 core-service

# Reset kafka:
docker exec kafka kafka-topics --delete \
  --topic user.car.insurance.purchased \
  --bootstrap-server localhost:9092

# Reset Redis:
docker exec -it redis redis-cli FLUSHDB   