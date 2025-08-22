sudo docker compose -f docker-compose.db.yml down

sudo docker volume rm avatar-mgmt-db_db_data

sudo docker volume prune -f

sudo docker volume ls


sudo docker compose -f docker-compose.db.yml up -d

sudo docker compose -f docker-compose.db.yml logs directus

# 1) 先建目录（若已存在可跳过）

echo 显示 directus 用户和组, 如果不是1000，下面也需要改

sudo docker compose -f docker-compose.db.yml exec directus id

# 2) 
echo 让容器用户接管：1000:1000

sudo chown -R 1000:1000 directus

# 3) 
echo 目录权限建议：共享开发最省心的“组可写 + 继承”
sudo find directus -type d -exec chmod 2775 {} \;
sudo find directus -type f -exec chmod 664 {} \;

# 4) 
echo 给当前的登录账户一个共享组权限

sudo groupadd -f directusgrp

sudo usermod -aG directusgrp $USER

sudo chgrp -R directusgrp directus

echo 让新建文件默认继承该组
sudo find directus -type d -exec chmod g+s {} \;

# 5)
echo 若系统有 ACL）设置默认 ACL，保证新文件自动 664、新目录 775
sudo apt update
sudo apt install acl

sudo setfacl -R -m d:g:directusgrp:rwx,g:directusgrp:rwx directus


echo 检查
sudo docker compose -f docker-compose.db.yml exec directus sh -lc 'id && whoami'

sudo docker compose -f docker-compose.db.yml exec directus sh -lc 'touch /directus/uploads/.perm_ok && ls -al /directus/uploads | head'

sudo docker compose -f docker-compose.db.yml exec directus sh -lc 'npx directus schema snapshot /directus/schemas/snapshot.yml && ls -al /directus/schemas | head'
