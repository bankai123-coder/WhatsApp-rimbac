import fs from "fs-extra"
import path from "path"
import moment from "moment"
import { DatabaseManager } from "../src/database/DatabaseManager.js"

async function createBackup(options = {}) {
  const { backupDir = "./backups", includeTimestamp = true, compress = false } = options

  console.log("💾 إنشاء نسخة احتياطية من قاعدة البيانات...")

  try {
    // Ensure backup directory exists
    await fs.ensureDir(backupDir)

    const timestamp = moment().format("YYYY-MM-DD_HH-mm-ss")
    const backupName = includeTimestamp ? `rimbac_backup_${timestamp}.db` : "rimbac_backup.db"

    const sourcePath = "./data/rimbac_bot.db"
    const backupPath = path.join(backupDir, backupName)

    // Check if source database exists
    if (!(await fs.pathExists(sourcePath))) {
      throw new Error("قاعدة البيانات الأصلية غير موجودة")
    }

    // Copy database file
    await fs.copy(sourcePath, backupPath)

    // Get file size
    const stats = await fs.stat(backupPath)
    const sizeFormatted = formatFileSize(stats.size)

    console.log(`✅ تم إنشاء النسخة الاحتياطية: ${backupName}`)
    console.log(`📊 حجم الملف: ${sizeFormatted}`)

    // Create metadata file
    const metadataPath = path.join(backupDir, `${backupName}.meta.json`)
    const metadata = {
      filename: backupName,
      created_at: moment().toISOString(),
      size_bytes: stats.size,
      size_formatted: sizeFormatted,
      source_path: sourcePath,
      backup_version: "1.0",
    }

    await fs.writeJson(metadataPath, metadata, { spaces: 2 })

    // Clean old backups if needed
    await cleanOldBackups(backupDir, 7) // Keep last 7 backups

    return {
      success: true,
      backupPath,
      metadata,
    }
  } catch (error) {
    console.error("❌ خطأ في إنشاء النسخة الاحتياطية:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function restoreBackup(backupPath, options = {}) {
  const { targetPath = "./data/rimbac_bot.db", createBackupBeforeRestore = true } = options

  console.log(`🔄 استعادة النسخة الاحتياطية من: ${backupPath}`)

  try {
    // Check if backup file exists
    if (!(await fs.pathExists(backupPath))) {
      throw new Error("ملف النسخة الاحتياطية غير موجود")
    }

    // Create backup of current database before restore
    if (createBackupBeforeRestore && (await fs.pathExists(targetPath))) {
      const preRestoreBackup = `${targetPath}.pre-restore-${moment().format("YYYY-MM-DD_HH-mm-ss")}`
      await fs.copy(targetPath, preRestoreBackup)
      console.log(`💾 تم إنشاء نسخة احتياطية قبل الاستعادة: ${preRestoreBackup}`)
    }

    // Ensure target directory exists
    await fs.ensureDir(path.dirname(targetPath))

    // Copy backup to target location
    await fs.copy(backupPath, targetPath)

    // Verify the restored database
    const db = new DatabaseManager()
    await db.initialize()

    // Test database integrity
    const result = await db.db.get("PRAGMA integrity_check")
    if (result.integrity_check !== "ok") {
      throw new Error("فشل في التحقق من سلامة قاعدة البيانات المستعادة")
    }

    await db.close()

    console.log("✅ تمت استعادة النسخة الاحتياطية بنجاح")

    return {
      success: true,
      restoredPath: targetPath,
    }
  } catch (error) {
    console.error("❌ خطأ في استعادة النسخة الاحتياطية:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function listBackups(backupDir = "./backups") {
  try {
    if (!(await fs.pathExists(backupDir))) {
      return []
    }

    const files = await fs.readdir(backupDir)
    const backups = []

    for (const file of files) {
      if (file.endsWith(".db")) {
        const filePath = path.join(backupDir, file)
        const stats = await fs.stat(filePath)
        const metadataPath = `${filePath}.meta.json`

        let metadata = null
        if (await fs.pathExists(metadataPath)) {
          metadata = await fs.readJson(metadataPath)
        }

        backups.push({
          filename: file,
          path: filePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          created: stats.birthtime,
          modified: stats.mtime,
          metadata,
        })
      }
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created - a.created)

    return backups
  } catch (error) {
    console.error("خطأ في جلب قائمة النسخ الاحتياطية:", error)
    return []
  }
}

async function cleanOldBackups(backupDir, keepCount = 7) {
  try {
    const backups = await listBackups(backupDir)

    if (backups.length <= keepCount) {
      return
    }

    const backupsToDelete = backups.slice(keepCount)
    let deletedCount = 0

    for (const backup of backupsToDelete) {
      await fs.remove(backup.path)

      // Remove metadata file if exists
      const metadataPath = `${backup.path}.meta.json`
      if (await fs.pathExists(metadataPath)) {
        await fs.remove(metadataPath)
      }

      deletedCount++
    }

    if (deletedCount > 0) {
      console.log(`🧹 تم حذف ${deletedCount} نسخة احتياطية قديمة`)
    }
  } catch (error) {
    console.error("خطأ في تنظيف النسخ الاحتياطية القديمة:", error)
  }
}

async function verifyBackup(backupPath) {
  console.log(`🔍 التحقق من سلامة النسخة الاحتياطية: ${backupPath}`)

  try {
    if (!(await fs.pathExists(backupPath))) {
      throw new Error("ملف النسخة الاحتياطية غير موجود")
    }

    // Create temporary database connection to verify
    const sqlite3 = await import("sqlite3")
    const { open } = await import("sqlite")

    const db = await open({
      filename: backupPath,
      driver: sqlite3.Database,
    })

    // Check database integrity
    const integrityResult = await db.get("PRAGMA integrity_check")
    if (integrityResult.integrity_check !== "ok") {
      throw new Error("فشل في التحقق من سلامة قاعدة البيانات")
    }

    // Check if main tables exist
    const tables = await db.all(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `)

    const expectedTables = ["users", "message_logs", "quiz_results", "content_requests", "admin_settings"]
    const existingTables = tables.map((t) => t.name)

    for (const expectedTable of expectedTables) {
      if (!existingTables.includes(expectedTable)) {
        throw new Error(`الجدول المطلوب غير موجود: ${expectedTable}`)
      }
    }

    // Get basic statistics
    const userCount = await db.get("SELECT COUNT(*) as count FROM users")
    const quizCount = await db.get("SELECT COUNT(*) as count FROM quiz_results")

    await db.close()

    console.log("✅ النسخة الاحتياطية سليمة")
    console.log(`📊 عدد المستخدمين: ${userCount.count}`)
    console.log(`🧠 عدد الاختبارات: ${quizCount.count}`)

    return {
      valid: true,
      statistics: {
        users: userCount.count,
        quizzes: quizCount.count,
        tables: existingTables.length,
      },
    }
  } catch (error) {
    console.error("❌ النسخة الاحتياطية غير سليمة:", error)
    return {
      valid: false,
      error: error.message,
    }
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]

  switch (command) {
    case "create":
      createBackup()
      break

    case "restore":
      const backupPath = process.argv[3]
      if (!backupPath) {
        console.error("يرجى تحديد مسار النسخة الاحتياطية")
        process.exit(1)
      }
      restoreBackup(backupPath)
      break

    case "list":
      listBackups().then((backups) => {
        console.log("\n📋 النسخ الاحتياطية المتاحة:")
        backups.forEach((backup, index) => {
          console.log(
            `${index + 1}. ${backup.filename} (${backup.sizeFormatted}) - ${moment(backup.created).format("DD/MM/YYYY HH:mm")}`,
          )
        })
      })
      break

    case "verify":
      const verifyPath = process.argv[3]
      if (!verifyPath) {
        console.error("يرجى تحديد مسار النسخة الاحتياطية للتحقق منها")
        process.exit(1)
      }
      verifyBackup(verifyPath)
      break

    case "clean":
      const keepCount = Number.parseInt(process.argv[3]) || 7
      cleanOldBackups("./backups", keepCount)
      break

    default:
      console.log(`
الاستخدام: node backup-database.js [command] [options]

الأوامر المتاحة:
  create              إنشاء نسخة احتياطية جديدة
  restore <path>      استعادة نسخة احتياطية
  list                عرض جميع النسخ الاحتياطية
  verify <path>       التحقق من سلامة نسخة احتياطية
  clean [count]       حذف النسخ القديمة (الافتراضي: الاحتفاظ بـ 7)

أمثلة:
  node backup-database.js create
  node backup-database.js restore ./backups/rimbac_backup_2024-01-01_12-00-00.db
  node backup-database.js list
  node backup-database.js verify ./backups/rimbac_backup_2024-01-01_12-00-00.db
  node backup-database.js clean 5
            `)
  }
}

export { createBackup, restoreBackup, listBackups, cleanOldBackups, verifyBackup }
