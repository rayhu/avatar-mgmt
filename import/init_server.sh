sudo docker compose -f docker-compose.db.yml down

sudo docker volume rm avatar-mgmt-db_db_data

sudo docker volume prune -f

sudo docker compose -f docker-compose.db.yml logs directus