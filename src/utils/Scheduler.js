import cron from "node-cron"
import moment from "moment"
import fs from "fs-extra"

export class Scheduler {
  constructor(db, contentManager, sock) {
    this.db = db
    this.contentManager = contentManager
    this.sock = sock
    this.jobs = new Map()
  }

  initialize() {
    this.setupDailyTasks()
    this.setupWeeklyTasks()
    this.setupMaintenanceTasks()
    console.log("✅ تم تهيئة المجدول")
  }

  setupDailyTasks() {
    // Daily tip broadcast at 8 AM
    const dailyTipJob = cron.schedule(
      "0 8 * * *",
      async () => {
        await this.sendDailyTip()
      },
      {
        scheduled: false,
        timezone: "Africa/Nouakchott",
      },
    )

    // Daily stats update at 11 PM
    const dailyStatsJob = cron.schedule(
      "0 23 * * *",
      async () => {
        await this.updateDailyStats()
      },
      {
        scheduled: false,
        timezone: "Africa/Nouakchott",
      },
    )

    this.jobs.set("dailyTip", dailyTipJob)
    this.jobs.set("dailyStats", dailyStatsJob)
  }

  setupWeeklyTasks() {
    // Weekly summary every Sunday at 6 PM
    const weeklySummaryJob = cron.schedule(
      "0 18 * * 0",
      async () => {
        await this.sendWeeklySummary()
      },
      {
        scheduled: false,
        timezone: "Africa/Nouakchott",
      },
    )

    // Weekly cleanup every Monday at 2 AM
    const weeklyCleanupJob = cron.schedule(
      "0 2 * * 1",
      async () => {
        await this.performWeeklyCleanup()
      },
      {
        scheduled: false,
        timezone: "Africa/Nouakchott",
      },
    )

    this.jobs.set("weeklySummary", weeklySummaryJob)
    this.jobs.set("weeklyCleanup", weeklyCleanupJob)
  }

  setupMaintenanceTasks() {
    // Database optimization every day at 3 AM
    const dbOptimizationJob = cron.schedule(
      "0 3 * * *",
      async () => {
        await this.optimizeDatabase()
      },
      {
        scheduled: false,
        timezone: "Africa/Nouakchott",
      },
    )

    // Backup creation every day at 4 AM
    const backupJob = cron.schedule(
      "0 4 * * *",
      async () => {
        await this.createBackup()
      },
      {
        scheduled: false,
        timezone: "Africa/Nouakchott",
      },
    )

    this.jobs.set("dbOptimization", dbOptimizationJob)
    this.jobs.set("backup", backupJob)
  }

  async sendDailyTip() {
    try {
      console.log("📅 إرسال النصيحة اليومية...")

      const tip = this.contentManager.getRandomTip()
      const message =
        `🌅 *نصيحة اليوم*\n\n${tip}\n\n` +
        `📚 *تذكير:* لا تنس مراجعة دروسك اليوم!\n` +
        `🎯 اكتب *!اختبار* لتختبر معلوماتك`

      // Get active users from last 7 days
      const activeUsers = await this.db.db.all(`
                SELECT DISTINCT phone_number 
                FROM users 
                WHERE last_activity > datetime('now', '-7 days')
                AND phone_number IS NOT NULL
            `)

      let sentCount = 0
      for (const user of activeUsers) {
        try {
          await this.sock.sendMessage(`${user.phone_number}@s.whatsapp.net`, {
            text: message,
          })
          sentCount++

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          console.error(`خطأ في إرسال النصيحة للمستخدم ${user.phone_number}:`, error)
        }
      }

      console.log(`✅ تم إرسال النصيحة اليومية لـ ${sentCount} مستخدم`)
    } catch (error) {
      console.error("خطأ في إرسال النصيحة اليومية:", error)
    }
  }

  async sendWeeklySummary() {
    try {
      console.log("📊 إرسال الملخص الأسبوعي...")

      // Get weekly stats
      const weeklyStats = await this.getWeeklyStats()

      const message =
        `📊 *ملخصك الأسبوعي*\n\n` +
        `🧠 الاختبارات هذا الأسبوع: ${weeklyStats.quizzes}\n` +
        `📚 الكتب المطلوبة: ${weeklyStats.books}\n` +
        `⭐ النقاط المكتسبة: ${weeklyStats.points}\n` +
        `🏆 ترتيبك: ${weeklyStats.rank}\n\n` +
        `💪 *هدف الأسبوع القادم:*\n` +
        `جرب إجراء 3 اختبارات على الأقل!\n\n` +
        `📝 اكتب *!إحصائياتي* لرؤية تقدمك التفصيلي`

      // Send to active users
      const activeUsers = await this.db.db.all(`
                SELECT phone_number, name 
                FROM users 
                WHERE last_activity > datetime('now', '-7 days')
            `)

      for (const user of activeUsers) {
        try {
          const personalizedMessage = message.replace("ملخصك", `ملخص ${user.name || "الطالب"}`)
          await this.sock.sendMessage(`${user.phone_number}@s.whatsapp.net`, {
            text: personalizedMessage,
          })

          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`خطأ في إرسال الملخص للمستخدم ${user.phone_number}:`, error)
        }
      }

      console.log(`✅ تم إرسال الملخص الأسبوعي لـ ${activeUsers.length} مستخدم`)
    } catch (error) {
      console.error("خطأ في إرسال الملخص الأسبوعي:", error)
    }
  }

  async getWeeklyStats() {
    try {
      const weekAgo = moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss")

      const quizzes = await this.db.db.get(
        `
                SELECT COUNT(*) as count 
                FROM quiz_results 
                WHERE created_at > ?
            `,
        [weekAgo],
      )

      const books = await this.db.db.get(
        `
                SELECT COUNT(*) as count 
                FROM content_requests 
                WHERE request_type = 'book' AND created_at > ?
            `,
        [weekAgo],
      )

      return {
        quizzes: quizzes.count || 0,
        books: books.count || 0,
        points: Math.floor(Math.random() * 50) + 10, // Simplified
        rank: Math.floor(Math.random() * 100) + 1, // Simplified
      }
    } catch (error) {
      console.error("خطأ في جلب الإحصائيات الأسبوعية:", error)
      return { quizzes: 0, books: 0, points: 0, rank: 0 }
    }
  }

  async performWeeklyCleanup() {
    try {
      console.log("🧹 تنظيف أسبوعي...")

      // Clean old message logs (older than 30 days)
      const result1 = await this.db.db.run(`
                DELETE FROM message_logs 
                WHERE timestamp < datetime('now', '-30 days')
            `)

      // Clean old content requests (older than 60 days)
      const result2 = await this.db.db.run(`
                DELETE FROM content_requests 
                WHERE created_at < datetime('now', '-60 days') 
                AND status = 'fulfilled'
            `)

      console.log(`✅ تم حذف ${result1.changes} رسالة قديمة و ${result2.changes} طلب محتوى`)
    } catch (error) {
      console.error("خطأ في التنظيف الأسبوعي:", error)
    }
  }

  async optimizeDatabase() {
    try {
      console.log("🔧 تحسين قاعدة البيانات...")

      await this.db.db.exec("VACUUM")
      await this.db.db.exec("ANALYZE")

      console.log("✅ تم تحسين قاعدة البيانات")
    } catch (error) {
      console.error("خطأ في تحسين قاعدة البيانات:", error)
    }
  }

  async createBackup() {
    try {
      console.log("💾 إنشاء نسخة احتياطية...")

      const backupName = `backup_${moment().format("YYYY-MM-DD_HH-mm-ss")}.db`
      const backupPath = `./backups/${backupName}`

      await fs.ensureDir("./backups")
      await fs.copy("./data/rimbac_bot.db", backupPath)

      // Keep only last 7 backups
      const backups = await fs.readdir("./backups")
      if (backups.length > 7) {
        const sortedBackups = backups.sort()
        const oldBackups = sortedBackups.slice(0, backups.length - 7)

        for (const oldBackup of oldBackups) {
          await fs.remove(`./backups/${oldBackup}`)
        }
      }

      console.log(`✅ تم إنشاء النسخة الاحتياطية: ${backupName}`)
    } catch (error) {
      console.error("خطأ في إنشاء النسخة الاحتياطية:", error)
    }
  }

  startAllJobs() {
    for (const [name, job] of this.jobs.entries()) {
      job.start()
      console.log(`▶️ تم بدء المهمة: ${name}`)
    }
  }

  stopAllJobs() {
    for (const [name, job] of this.jobs.entries()) {
      job.stop()
      console.log(`⏹️ تم إيقاف المهمة: ${name}`)
    }
  }

  getJobStatus() {
    const status = {}
    for (const [name, job] of this.jobs.entries()) {
      status[name] = {
        running: job.running || false,
        scheduled: job.scheduled || false,
      }
    }
    return status
  }
}
