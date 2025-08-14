// api-server/handlers/version.ts
import { Request, Response } from 'express'
import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

// ES 模块中获取 __dirname 的替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface VersionInfo {
  frontend: {
    version: string
    commitHash: string
    buildTime: string
    branch: string
    commitDate: string
  }
  backend: {
    version: string
    commitHash: string
    buildTime: string
    branch: string
    commitDate: string
  }
  system: {
    deployTime: string
    environment: string
    uptime: string
    lastCheck: string
  }
  generatedAt: string
}

// 获取 Git 信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    const commitDate = execSync('git log -1 --format=%cd --date=iso', { encoding: 'utf8' }).trim()
    
    return { commitHash, branch, commitDate }
  } catch (error) {
    console.warn('Failed to get Git info:', error)
    return { commitHash: 'unknown', branch: 'unknown', commitDate: 'unknown' }
  }
}

// 计算运行时间
function getUptime() {
  try {
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  } catch {
    return 'unknown'
  }
}

// 版本信息处理器
async function versionHandler(req: Request, res: Response) {
  try {
    let versionInfo: VersionInfo
    
    // 开发环境：实时生成版本信息
    if (process.env.NODE_ENV === 'development') {
      const gitInfo = getGitInfo()
      const now = new Date().toISOString()
      
      versionInfo = {
        frontend: {
          version: 'dev',
          commitHash: gitInfo.commitHash,
          buildTime: now,
          branch: gitInfo.branch,
          commitDate: gitInfo.commitDate
        },
        backend: {
          version: 'dev',
          commitHash: gitInfo.commitHash,
          buildTime: now,
          branch: gitInfo.branch,
          commitDate: gitInfo.commitDate
        },
        system: {
          deployTime: now,
          environment: 'development',
          uptime: getUptime(),
          lastCheck: now
        },
        generatedAt: now
      }
      
      console.log('🔧 Generated real-time version info for development')
    } else {
      // 生产环境：从文件读取，并更新动态信息
      try {
        const versionPath = join(__dirname, '..', 'version', 'version.json')
        const versionData = await fs.readFile(versionPath, 'utf8')
        versionInfo = JSON.parse(versionData)
        
        // 更新动态信息
        versionInfo.system.uptime = getUptime()
        versionInfo.system.lastCheck = new Date().toISOString()
        
        console.log('📁 Loaded version info from file and updated dynamic data')
      } catch (fileError) {
        console.warn('Failed to load version file, generating:', fileError)
        const gitInfo = getGitInfo()
        const now = new Date().toISOString()
        
        versionInfo = {
          frontend: {
            version: '1.0.0',
            commitHash: gitInfo.commitHash,
            buildTime: now,
            branch: gitInfo.branch,
            commitDate: gitInfo.commitDate
          },
          backend: {
            version: '1.0.0',
            commitHash: gitInfo.commitHash,
            buildTime: now,
            branch: gitInfo.branch,
            commitDate: gitInfo.commitDate
          },
          system: {
            deployTime: now,
            environment: 'production',
            uptime: getUptime(),
            lastCheck: now
          },
          generatedAt: now
        }
      }
    }
    
    res.json(versionInfo)
  } catch (error) {
    console.error('Version handler error:', error)
    res.status(500).json({ 
      error: 'Failed to get version info',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export default versionHandler
