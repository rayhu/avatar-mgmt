#!/usr/bin/env node

/**
 * jc21 Nginx Proxy Manager 自动化配置脚本
 * 通过直接操作 SQLite 数据库来配置代理主机
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

class Jc21ProxyConfigurator {
  constructor(dbPath = './jc21/data/database.sqlite') {
    this.dbPath = path.resolve(dbPath);
    this.db = null;
  }

  // 连接数据库
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ 数据库连接失败:', err.message);
          reject(err);
        } else {
          console.log('✅ 数据库连接成功');
          resolve();
        }
      });
    });
  }

  // 关闭数据库连接
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('❌ 数据库关闭失败:', err.message);
          } else {
            console.log('✅ 数据库连接已关闭');
          }
          resolve();
        });
      });
    }
  }

  // 执行 SQL 查询
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 执行 SQL 语句
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // 获取现有代理主机
  async getProxyHosts() {
    const sql = `
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
    `;
    
    return await this.query(sql);
  }

  // 创建代理主机
  async createProxyHost(config) {
    const {
      domain_names,
      forward_host,
      forward_port,
      forward_scheme = 'http',
      ssl_forced = false,
      websockets_support = true,
      block_exploits = true,
      advanced_config = '',
      locations = []
    } = config;

    const now = new Date().toISOString();

    const sql = `
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
    `;

    const params = [
      domain_names,
      forward_host,
      forward_port,
      forward_scheme,
      ssl_forced ? 1 : 0,
      websockets_support ? 1 : 0,
      block_exploits ? 1 : 0,
      advanced_config,
      now,
      now
    ];

    const result = await this.run(sql, params);
    console.log(`✅ 代理主机创建成功，ID: ${result.id}`);

    // 创建位置配置（如果有）
    if (locations.length > 0) {
      for (const location of locations) {
        await this.createLocation(result.id, location);
      }
    }

    return result.id;
  }

  // 创建位置配置
  async createLocation(proxyHostId, location) {
    const {
      path,
      forward_host,
      forward_port,
      forward_scheme = 'http'
    } = location;

    const sql = `
      INSERT INTO proxy_host_locations (
        proxy_host_id,
        path,
        forward_host,
        forward_port,
        forward_scheme
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [proxyHostId, path, forward_host, forward_port, forward_scheme];
    await this.run(sql, params);
    console.log(`✅ 位置配置创建成功: ${path}`);
  }

  // 更新代理主机
  async updateProxyHost(id, config) {
    const {
      domain_names,
      forward_host,
      forward_port,
      forward_scheme,
      ssl_forced,
      websockets_support,
      block_exploits,
      advanced_config
    } = config;

    const now = new Date().toISOString();

    const sql = `
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
    `;

    const params = [
      domain_names,
      forward_host,
      forward_port,
      forward_scheme,
      ssl_forced ? 1 : 0,
      websockets_support ? 1 : 0,
      block_exploits ? 1 : 0,
      advanced_config,
      now,
      id
    ];

    const result = await this.run(sql, params);
    console.log(`✅ 代理主机更新成功，影响行数: ${result.changes}`);
    return result;
  }

  // 删除代理主机
  async deleteProxyHost(id) {
    // 先删除相关的位置配置
    await this.run('DELETE FROM proxy_host_locations WHERE proxy_host_id = ?', [id]);
    
    // 删除代理主机
    const result = await this.run('DELETE FROM proxy_hosts WHERE id = ?', [id]);
    console.log(`✅ 代理主机删除成功，影响行数: ${result.changes}`);
    return result;
  }

  // 配置 SSL 证书
  async configureSSL(proxyHostId, sslConfig) {
    const {
      ssl_forced = true,
      http2_support = true,
      hsts_enabled = true,
      hsts_subdomains = true,
      certificate_id = null
    } = sslConfig;

    const sql = `
      UPDATE proxy_hosts SET
        ssl_forced = ?,
        http2_support = ?,
        hsts_enabled = ?,
        hsts_subdomains = ?,
        certificate_id = ?
      WHERE id = ?
    `;

    const params = [
      ssl_forced ? 1 : 0,
      http2_support ? 1 : 0,
      hsts_enabled ? 1 : 0,
      hsts_subdomains ? 1 : 0,
      certificate_id,
      proxyHostId
    ];

    const result = await this.run(sql, params);
    console.log(`✅ SSL 配置更新成功`);
    return result;
  }

  // 显示所有代理主机
  async listProxyHosts() {
    const hosts = await this.getProxyHosts();
    
    console.log('\n📋 当前代理主机配置:');
    console.log('='.repeat(80));
    
    if (hosts.length === 0) {
      console.log('暂无代理主机配置');
      return;
    }

    hosts.forEach((host, index) => {
      console.log(`${index + 1}. ID: ${host.id}`);
      console.log(`   域名: ${host.domain_names}`);
      console.log(`   目标: ${host.forward_scheme}://${host.forward_host}:${host.forward_port}`);
      console.log(`   SSL强制: ${host.ssl_forced ? '是' : '否'}`);
      console.log(`   WebSocket: ${host.websockets_support ? '是' : '否'}`);
      console.log(`   防攻击: ${host.block_exploits ? '是' : '否'}`);
      console.log(`   创建时间: ${host.created_on}`);
      console.log('   ' + '-'.repeat(60));
    });
  }
}

// 配置示例
const defaultConfigs = [
  {
    name: 'API 服务',
    domain_names: 'api.daidai.amis.hk',
    forward_host: 'api',
    forward_port: 3000,
    forward_scheme: 'http',
    ssl_forced: true,
    websockets_support: true,
    block_exploits: true,
    advanced_config: `
# 自定义配置
client_max_body_size 10M;
proxy_read_timeout 300s;
proxy_connect_timeout 75s;
    `.trim()
  },
  {
    name: 'Directus 管理界面',
    domain_names: 'admin.daidai.amis.hk',
    forward_host: 'directus',
    forward_port: 8055,
    forward_scheme: 'http',
    ssl_forced: true,
    websockets_support: true,
    block_exploits: true
  },
  {
    name: '前端应用',
    domain_names: 'daidai.amis.hk',
    forward_host: 'frontend',
    forward_port: 80,
    forward_scheme: 'http',
    ssl_forced: true,
    websockets_support: false,
    block_exploits: true
  }
];

// 主函数
async function main() {
  const configurator = new Jc21ProxyConfigurator();
  
  try {
    await configurator.connect();
    
    // 显示当前配置
    await configurator.listProxyHosts();
    
    // 创建默认配置
    console.log('\n🚀 开始创建默认代理配置...');
    
    for (const config of defaultConfigs) {
      console.log(`\n📝 配置 ${config.name}...`);
      const id = await configurator.createProxyHost(config);
      console.log(`✅ ${config.name} 配置完成，ID: ${id}`);
    }
    
    // 显示更新后的配置
    console.log('\n📋 更新后的代理主机配置:');
    await configurator.listProxyHosts();
    
  } catch (error) {
    console.error('❌ 配置失败:', error.message);
    process.exit(1);
  } finally {
    await configurator.close();
  }
}

// 命令行参数处理
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
jc21 代理配置脚本

用法:
  node configure-jc21-proxy.js [选项]

选项:
  --list, -l          显示当前代理配置
  --create, -c        创建默认配置
  --delete <id>       删除指定ID的代理主机
  --help, -h          显示帮助信息

示例:
  node configure-jc21-proxy.js --list
  node configure-jc21-proxy.js --create
  node configure-jc21-proxy.js --delete 1
    `);
    process.exit(0);
  }
  
  main();
}

module.exports = Jc21ProxyConfigurator; 
