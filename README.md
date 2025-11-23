# Docker Environment:
docker compose down
docker volume rm check24-widget-platform_product_db_data
docker compose up --build -d

# Access product db:
Access the Database Visually

    Open your web browser and navigate to http://localhost:8080.

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