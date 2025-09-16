import fs from "fs-extra"
import path from "path"
import moment from "moment"

export class Logger {
  constructor() {
    this.logDir = "./logs"
    this.maxLogSize = 10 * 1024 * 1024 // 10MB
    this.maxLogFiles = 5
  }

  async initialize() {
    await fs.ensureDir(this.logDir)
    console.log("✅ تم تهيئة نظام السجلات")
  }

  async log(level, message, data = null) {
    const timestamp = moment().format("YYYY-MM-DD HH:mm:ss")
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data,
      pid: process.pid,
    }

    const logLine = JSON.stringify(logEntry) + "\n"

    // Write to console
    const colorCode = this.getColorCode(level)
    console.log(`${colorCode}[${timestamp}] ${level.toUpperCase()}: ${message}\x1b[0m`)

    // Write to file
    await this.writeToFile(level, logLine)
  }

  async info(message, data = null) {
    await this.log("info", message, data)
  }

  async warn(message, data = null) {
    await this.log("warn", message, data)
  }

  async error(message, data = null) {
    await this.log("error", message, data)
  }

  async debug(message, data = null) {
    await this.log("debug", message, data)
  }

  getColorCode(level) {
    const colors = {
      info: "\x1b[36m", // Cyan
      warn: "\x1b[33m", // Yellow
      error: "\x1b[31m", // Red
      debug: "\x1b[35m", // Magenta
    }
    return colors[level] || "\x1b[0m"
  }

  async writeToFile(level, logLine) {
    try {
      const logFile = path.join(this.logDir, `${level}.log`)

      // Check file size and rotate if necessary
      await this.rotateLogIfNeeded(logFile)

      await fs.appendFile(logFile, logLine)
    } catch (error) {
      console.error("خطأ في كتابة السجل:", error)
    }
  }

  async rotateLogIfNeeded(logFile) {
    try {
      const stats = await fs.stat(logFile).catch(() => null)

      if (stats && stats.size > this.maxLogSize) {
        const timestamp = moment().format("YYYY-MM-DD_HH-mm-ss")
        const rotatedFile = logFile.replace(".log", `_${timestamp}.log`)

        await fs.move(logFile, rotatedFile)

        // Clean old log files
        await this.cleanOldLogs(path.dirname(logFile), path.basename(logFile, ".log"))
      }
    } catch (error) {
      console.error("خطأ في تدوير السجل:", error)
    }
  }

  async cleanOldLogs(logDir, logName) {
    try {
      const files = await fs.readdir(logDir)
      const logFiles = files
        .filter((file) => file.startsWith(logName) && file.includes("_"))
        .sort()
        .reverse()

      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles)

        for (const file of filesToDelete) {
          await fs.remove(path.join(logDir, file))
        }
      }
    } catch (error) {
      console.error("خطأ في تنظيف السجلات القديمة:", error)
    }
  }

  async getLogStats() {
    try {
      const files = await fs.readdir(this.logDir)
      const stats = {}

      for (const file of files) {
        const filePath = path.join(this.logDir, file)
        const fileStats = await fs.stat(filePath)

        stats[file] = {
          size: fileStats.size,
          sizeFormatted: this.formatFileSize(fileStats.size),
          modified: fileStats.mtime,
          lines: await this.countLines(filePath),
        }
      }

      return stats
    } catch (error) {
      console.error("خطأ في جلب إحصائيات السجلات:", error)
      return {}
    }
  }

  async countLines(filePath) {
    try {
      const content = await fs.readFile(filePath, "utf8")
      return content.split("\n").length - 1
    } catch (error) {
      return 0
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}
