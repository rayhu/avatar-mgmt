#!/usr/bin/env python3

"""
jc21 Nginx Proxy Manager 自动化配置脚本 (Python 版本)
通过直接操作 SQLite 数据库来配置代理主机
"""

import sqlite3
import argparse
import sys
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import json

class Jc21ProxyConfigurator:
    def __init__(self, db_path: str = "./jc21/data/database.sqlite"):
        self.db_path = os.path.abspath(db_path)
        self.conn = None
        
    def connect(self) -> None:
        """连接数据库"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
            print("✅ 数据库连接成功")
        except sqlite3.Error as e:
            print(f"❌ 数据库连接失败: {e}")
            sys.exit(1)
    
    def close(self) -> None:
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print("✅ 数据库连接已关闭")
    
    def execute_query(self, sql: str, params: tuple = ()) -> List[sqlite3.Row]:
        """执行查询语句"""
        try:
            cursor = self.conn.cursor()
            cursor.execute(sql, params)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"❌ 查询执行失败: {e}")
            raise
    
    def execute_update(self, sql: str, params: tuple = ()) -> int:
        """执行更新语句"""
        try:
            cursor = self.conn.cursor()
            cursor.execute(sql, params)
            self.conn.commit()
            return cursor.rowcount
        except sqlite3.Error as e:
            print(f"❌ 更新执行失败: {e}")
            self.conn.rollback()
            raise
    
    def get_proxy_hosts(self) -> List[sqlite3.Row]:
        """获取所有代理主机"""
        sql = """
            SELECT 
                id,
                domain_names,
                forward_host,
                forward_port,
                forward_scheme,
                ssl_forced,
                websockets_support,
                block_exploits,
                created_on,
                modified_on
            FROM proxy_hosts 
            ORDER BY created_on DESC
        """
        return self.execute_query(sql)
    
    def create_proxy_host(self, config: Dict[str, Any]) -> int:
        """创建代理主机"""
        domain_names = config['domain_names']
        forward_host = config['forward_host']
        forward_port = config['forward_port']
        forward_scheme = config.get('forward_scheme', 'http')
        ssl_forced = config.get('ssl_forced', False)
        websockets_support = config.get('websockets_support', True)
        block_exploits = config.get('block_exploits', True)
        advanced_config = config.get('advanced_config', '')
        
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        sql = """
            INSERT INTO proxy_hosts (
                domain_names,
                forward_host,
                forward_port,
                forward_scheme,
                ssl_forced,
                websockets_support,
                block_exploits,
                advanced_config,
                created_on,
                modified_on
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            1 if ssl_forced else 0,
            1 if websockets_support else 0,
            1 if block_exploits else 0,
            advanced_config,
            now,
            now
        )
        
        cursor = self.conn.cursor()
        cursor.execute(sql, params)
        self.conn.commit()
        
        proxy_id = cursor.lastrowid
        print(f"✅ 代理主机创建成功，ID: {proxy_id}")
        
        # 创建位置配置（如果有）
        locations = config.get('locations', [])
        for location in locations:
            self.create_location(proxy_id, location)
        
        return proxy_id
    
    def create_location(self, proxy_host_id: int, location: Dict[str, Any]) -> None:
        """创建位置配置"""
        path = location['path']
        forward_host = location['forward_host']
        forward_port = location['forward_port']
        forward_scheme = location.get('forward_scheme', 'http')
        
        sql = """
            INSERT INTO proxy_host_locations (
                proxy_host_id,
                path,
                forward_host,
                forward_port,
                forward_scheme
            ) VALUES (?, ?, ?, ?, ?)
        """
        
        params = (proxy_host_id, path, forward_host, forward_port, forward_scheme)
        self.execute_update(sql, params)
        print(f"✅ 位置配置创建成功: {path}")
    
    def update_proxy_host(self, proxy_id: int, config: Dict[str, Any]) -> None:
        """更新代理主机"""
        domain_names = config['domain_names']
        forward_host = config['forward_host']
        forward_port = config['forward_port']
        forward_scheme = config.get('forward_scheme', 'http')
        ssl_forced = config.get('ssl_forced', False)
        websockets_support = config.get('websockets_support', True)
        block_exploits = config.get('block_exploits', True)
        advanced_config = config.get('advanced_config', '')
        
        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
        sql = """
            UPDATE proxy_hosts SET
                domain_names = ?,
                forward_host = ?,
                forward_port = ?,
                forward_scheme = ?,
                ssl_forced = ?,
                websockets_support = ?,
                block_exploits = ?,
                advanced_config = ?,
                modified_on = ?
            WHERE id = ?
        """
        
        params = (
            domain_names,
            forward_host,
            forward_port,
            forward_scheme,
            1 if ssl_forced else 0,
            1 if websockets_support else 0,
            1 if block_exploits else 0,
            advanced_config,
            now,
            proxy_id
        )
        
        rows_affected = self.execute_update(sql, params)
        print(f"✅ 代理主机更新成功，影响行数: {rows_affected}")
    
    def delete_proxy_host(self, proxy_id: int) -> None:
        """删除代理主机"""
        # 先删除相关的位置配置
        self.execute_update("DELETE FROM proxy_host_locations WHERE proxy_host_id = ?", (proxy_id,))
        
        # 删除代理主机
        rows_affected = self.execute_update("DELETE FROM proxy_hosts WHERE id = ?", (proxy_id,))
        print(f"✅ 代理主机删除成功，影响行数: {rows_affected}")
    
    def configure_ssl(self, proxy_id: int, ssl_config: Dict[str, Any]) -> None:
        """配置 SSL 证书"""
        ssl_forced = ssl_config.get('ssl_forced', True)
        http2_support = ssl_config.get('http2_support', True)
        hsts_enabled = ssl_config.get('hsts_enabled', True)
        hsts_subdomains = ssl_config.get('hsts_subdomains', True)
        certificate_id = ssl_config.get('certificate_id')
        
        sql = """
            UPDATE proxy_hosts SET
                ssl_forced = ?,
                http2_support = ?,
                hsts_enabled = ?,
                hsts_subdomains = ?,
                certificate_id = ?
            WHERE id = ?
        """
        
        params = (
            1 if ssl_forced else 0,
            1 if http2_support else 0,
            1 if hsts_enabled else 0,
            1 if hsts_subdomains else 0,
            certificate_id,
            proxy_id
        )
        
        rows_affected = self.execute_update(sql, params)
        print(f"✅ SSL 配置更新成功，影响行数: {rows_affected}")
    
    def list_proxy_hosts(self) -> None:
        """显示所有代理主机"""
        hosts = self.get_proxy_hosts()
        
        print("\n📋 当前代理主机配置:")
        print("=" * 80)
        
        if not hosts:
            print("暂无代理主机配置")
            return
        
        for i, host in enumerate(hosts, 1):
            print(f"{i}. ID: {host['id']}")
            print(f"   域名: {host['domain_names']}")
            print(f"   目标: {host['forward_scheme']}://{host['forward_host']}:{host['forward_port']}")
            print(f"   SSL强制: {'是' if host['ssl_forced'] else '否'}")
            print(f"   WebSocket: {'是' if host['websockets_support'] else '否'}")
            print(f"   防攻击: {'是' if host['block_exploits'] else '否'}")
            print(f"   创建时间: {host['created_on']}")
            print("   " + "-" * 60)
    
    def backup_database(self, backup_path: Optional[str] = None) -> str:
        """备份数据库"""
        if not backup_path:
            timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            backup_path = f"./jc21/data/database-backup-{timestamp}.sqlite"
        
        import shutil
        shutil.copy2(self.db_path, backup_path)
        print(f"✅ 数据库备份完成: {backup_path}")
        return backup_path
    
    def restore_database(self, backup_path: str) -> None:
        """恢复数据库"""
        if not os.path.exists(backup_path):
            print(f"❌ 备份文件不存在: {backup_path}")
            sys.exit(1)
        
        import shutil
        shutil.copy2(backup_path, self.db_path)
        print(f"✅ 数据库恢复完成: {backup_path}")

def get_default_configs() -> List[Dict[str, Any]]:
    """获取默认配置"""
    return [
        {
            'name': 'API 服务',
            'domain_names': 'api.daidai.amis.hk',
            'forward_host': 'api',
            'forward_port': 3000,
            'forward_scheme': 'http',
            'ssl_forced': True,
            'websockets_support': True,
            'block_exploits': True,
            'advanced_config': '''
# API 服务自定义配置
client_max_body_size 10M;
proxy_read_timeout 300s;
proxy_connect_timeout 75s;
proxy_send_timeout 300s;
            '''.strip()
        },
        {
            'name': 'Directus 管理界面',
            'domain_names': 'admin.daidai.amis.hk',
            'forward_host': 'directus',
            'forward_port': 8055,
            'forward_scheme': 'http',
            'ssl_forced': True,
            'websockets_support': True,
            'block_exploits': True
        },
        {
            'name': '前端应用',
            'domain_names': 'daidai.amis.hk',
            'forward_host': 'frontend',
            'forward_port': 80,
            'forward_scheme': 'http',
            'ssl_forced': True,
            'websockets_support': False,
            'block_exploits': True
        }
    ]

def get_local_configs() -> List[Dict[str, Any]]:
    """获取本地测试配置"""
    return [
        {
            'name': 'API 服务 (本地)',
            'domain_names': 'localhost',
            'forward_host': 'api',
            'forward_port': 3000,
            'forward_scheme': 'http',
            'ssl_forced': False,
            'websockets_support': True,
            'block_exploits': True
        },
        {
            'name': 'Directus 管理界面 (本地)',
            'domain_names': 'localhost',
            'forward_host': 'directus',
            'forward_port': 8055,
            'forward_scheme': 'http',
            'ssl_forced': False,
            'websockets_support': True,
            'block_exploits': True
        }
    ]

def main():
    parser = argparse.ArgumentParser(description='jc21 代理配置脚本 (Python 版本)')
    parser.add_argument('--db-path', default='./jc21/data/database.sqlite', help='数据库路径')
    parser.add_argument('--list', '-l', action='store_true', help='显示当前代理配置')
    parser.add_argument('--create', '-c', action='store_true', help='创建默认配置')
    parser.add_argument('--create-local', '-cl', action='store_true', help='创建本地测试配置')
    parser.add_argument('--delete', type=int, help='删除指定ID的代理主机')
    parser.add_argument('--update', nargs=4, metavar=('ID', 'DOMAIN', 'HOST', 'PORT'), help='更新代理主机配置')
    parser.add_argument('--ssl', nargs=2, metavar=('ID', 'FORCED'), help='配置 SSL 证书')
    parser.add_argument('--backup', help='备份数据库到指定路径')
    parser.add_argument('--restore', help='从备份文件恢复数据库')
    parser.add_argument('--config-file', help='从 JSON 配置文件创建代理主机')
    
    args = parser.parse_args()
    
    # 检查数据库文件是否存在
    if not os.path.exists(args.db_path):
        print(f"❌ 数据库文件不存在: {args.db_path}")
        print("请确保 jc21 服务已启动并初始化")
        sys.exit(1)
    
    configurator = Jc21ProxyConfigurator(args.db_path)
    
    try:
        configurator.connect()
        
        if args.list:
            configurator.list_proxy_hosts()
        
        elif args.create:
            print("🚀 创建默认配置...")
            configurator.backup_database()
            
            for config in get_default_configs():
                print(f"\n📝 配置 {config['name']}...")
                configurator.create_proxy_host(config)
            
            print("\n📋 更新后的配置:")
            configurator.list_proxy_hosts()
        
        elif args.create_local:
            print("🚀 创建本地测试配置...")
            configurator.backup_database()
            
            for config in get_local_configs():
                print(f"\n📝 配置 {config['name']}...")
                configurator.create_proxy_host(config)
            
            print("\n📋 更新后的配置:")
            configurator.list_proxy_hosts()
        
        elif args.delete:
            configurator.delete_proxy_host(args.delete)
            configurator.list_proxy_hosts()
        
        elif args.update:
            proxy_id, domain, host, port = args.update
            config = {
                'domain_names': domain,
                'forward_host': host,
                'forward_port': int(port),
                'forward_scheme': 'http',
                'ssl_forced': False,
                'websockets_support': True,
                'block_exploits': True
            }
            configurator.update_proxy_host(int(proxy_id), config)
            configurator.list_proxy_hosts()
        
        elif args.ssl:
            proxy_id, forced = args.ssl
            ssl_config = {
                'ssl_forced': forced.lower() == 'true',
                'http2_support': True,
                'hsts_enabled': True,
                'hsts_subdomains': True
            }
            configurator.configure_ssl(int(proxy_id), ssl_config)
        
        elif args.backup:
            configurator.backup_database(args.backup)
        
        elif args.restore:
            configurator.restore_database(args.restore)
        
        elif args.config_file:
            if not os.path.exists(args.config_file):
                print(f"❌ 配置文件不存在: {args.config_file}")
                sys.exit(1)
            
            with open(args.config_file, 'r', encoding='utf-8') as f:
                configs = json.load(f)
            
            print(f"🚀 从配置文件创建代理主机: {args.config_file}")
            configurator.backup_database()
            
            for config in configs:
                print(f"\n📝 配置 {config.get('name', '未命名')}...")
                configurator.create_proxy_host(config)
            
            print("\n📋 更新后的配置:")
            configurator.list_proxy_hosts()
        
        else:
            parser.print_help()
    
    except Exception as e:
        print(f"❌ 操作失败: {e}")
        sys.exit(1)
    
    finally:
        configurator.close()

if __name__ == '__main__':
    main() 
