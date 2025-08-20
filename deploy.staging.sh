
/opt/deploy-avatar$ cp /opt/avatar-mgmt/docker-compose.*.yml .

sudo docker compose -f docker-compose.jc21.yml up -d

sudo docker compose -f docker-compose.db.yml up -d

sudo docker compose -f docker-compose.ghcr.yml up -d
