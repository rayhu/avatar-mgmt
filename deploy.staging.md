/opt/deploy-avatar$ cp /opt/avatar-mgmt/docker-compose.\*.yml .

sudo docker compose -f docker-compose.jc21.yml up -d

sudo docker compose -f docker-compose.db.yml up -d

sudo docker compose -f docker-compose.ghcr.yml up -d

In /opt/deploy-avatar, apply the schema

sudo docker compose -f docker-compose.db.yml exec directus npx directus schema
apply /directus/schemas/snapshot.yml --yes
