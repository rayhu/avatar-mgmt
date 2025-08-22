#!/usr/bin/env bash
set -euo pipefail

# 1) 目录
mkdir -p directus/{uploads,extensions,schemas}

# 2) 归属：容器内用户 1000:1000
sudo chown -R 1000:1000 directus

# 3) 权限：目录 2775、文件 664（组写 + 继承）
sudo find directus -type d -exec chmod 2775 {} \;
sudo find directus -type f -exec chmod 664 {} \;

# 4) 共享组（可选）
sudo groupadd -f directusgrp || true
sudo usermod -aG directusgrp "$USER"
sudo chgrp -R directusgrp directus
sudo find directus -type d -exec chmod g+s {} \;

# 5) ACL（可选）
if command -v setfacl >/dev/null 2>&1; then
  sudo setfacl -R -m d:g:directusgrp:rwx,g:directusgrp:rwx directus
fi

echo "Done. Now start containers and run post-start checks."
