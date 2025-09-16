import sqlite3 from "sqlite3"
import { open } from "sqlite"
import fs from "fs-extra"

export class DatabaseManager {
  constructor() {
    this.db = null
    this.dbPath = "./data/rimbac_bot.db"
  }

  async initialize() {
    // Ensure data directory exists
    await fs.ensureDir("./data")

    // Open database connection
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    })

    // Create tables
    await this.createTables()
    console.log("✅ تم تهيئة قاعدة البيانات")
  }

  async createTables() {
    // Users table
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT UNIQUE NOT NULL,
                name TEXT,
                grade_level TEXT,
                subject_preferences TEXT,
                registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_premium BOOLEAN DEFAULT FALSE,
                points INTEGER DEFAULT 0
            )
        `)

    // Messages log
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS message_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                message_type TEXT NOT NULL,
                command TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                response_time INTEGER
            )
        `)

    // Content requests
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS content_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                request_type TEXT NOT NULL,
                grade_level TEXT,
                subject TEXT,
                specific_request TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                fulfilled_at DATETIME
            )
        `)

    // Quiz results
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS quiz_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                quiz_type TEXT NOT NULL,
                grade_level TEXT,
                subject TEXT,
                score INTEGER,
                total_questions INTEGER,
                completion_time INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Subscriptions
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT NOT NULL,
                subscription_type TEXT NOT NULL,
                grade_level TEXT,
                subjects TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Admin settings
    await this.db.exec(`
            CREATE TABLE IF NOT EXISTS admin_settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)
  }

  // User management
  async createUser(phoneNumber, name = null, gradeLevel = null) {
    try {
      const result = await this.db.run(
        "INSERT OR IGNORE INTO users (phone_number, name, grade_level) VALUES (?, ?, ?)",
        [phoneNumber, name, gradeLevel],
      )
      return result.lastID
    } catch (error) {
      console.error("خطأ في إنشاء المستخدم:", error)
      throw error
    }
  }

  async getUser(phoneNumber) {
    try {
      return await this.db.get("SELECT * FROM users WHERE phone_number = ?", [phoneNumber])
    } catch (error) {
      console.error("خطأ في جلب المستخدم:", error)
      return null
    }
  }

  async updateUserActivity(phoneNumber) {
    try {
      await this.db.run("UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE phone_number = ?", [phoneNumber])
    } catch (error) {
      console.error("خطأ في تحديث نشاط المستخدم:", error)
    }
  }

  async updateUserPoints(phoneNumber, points) {
    try {
      await this.db.run("UPDATE users SET points = points + ? WHERE phone_number = ?", [points, phoneNumber])
    } catch (error) {
      console.error("خطأ في تحديث نقاط المستخدم:", error)
    }
  }

  // Message logging
  async logMessage(userPhone, messageType, command = null, responseTime = null) {
    try {
      await this.db.run(
        "INSERT INTO message_logs (user_phone, message_type, command, response_time) VALUES (?, ?, ?, ?)",
        [userPhone, messageType, command, responseTime],
      )
    } catch (error) {
      console.error("خطأ في تسجيل الرسالة:", error)
    }
  }

  // Content requests
  async createContentRequest(userPhone, requestType, gradeLevel, subject, specificRequest) {
    try {
      const result = await this.db.run(
        "INSERT INTO content_requests (user_phone, request_type, grade_level, subject, specific_request) VALUES (?, ?, ?, ?, ?)",
        [userPhone, requestType, gradeLevel, subject, specificRequest],
      )
      return result.lastID
    } catch (error) {
      console.error("خطأ في إنشاء طلب المحتوى:", error)
      throw error
    }
  }

  // Quiz results
  async saveQuizResult(userPhone, quizType, gradeLevel, subject, score, totalQuestions, completionTime) {
    try {
      const result = await this.db.run(
        "INSERT INTO quiz_results (user_phone, quiz_type, grade_level, subject, score, total_questions, completion_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userPhone, quizType, gradeLevel, subject, score, totalQuestions, completionTime],
      )

      // Award points based on performance
      const percentage = (score / totalQuestions) * 100
      let points = 0
      if (percentage >= 90) points = 10
      else if (percentage >= 80) points = 8
      else if (percentage >= 70) points = 5
      else if (percentage >= 60) points = 3

      if (points > 0) {
        await this.updateUserPoints(userPhone, points)
      }

      return result.lastID
    } catch (error) {
      console.error("خطأ في حفظ نتيجة الاختبار:", error)
      throw error
    }
  }

  // Statistics
  async getUserStats(phoneNumber) {
    try {
      const user = await this.getUser(phoneNumber)
      if (!user) return null

      const quizCount = await this.db.get("SELECT COUNT(*) as count FROM quiz_results WHERE user_phone = ?", [
        phoneNumber,
      ])

      const avgScore = await this.db.get(
        "SELECT AVG(CAST(score AS FLOAT) / total_questions * 100) as avg_score FROM quiz_results WHERE user_phone = ?",
        [phoneNumber],
      )

      const requestCount = await this.db.get("SELECT COUNT(*) as count FROM content_requests WHERE user_phone = ?", [
        phoneNumber,
      ])

      return {
        user,
        quizCount: quizCount.count,
        averageScore: Math.round(avgScore.avg_score || 0),
        requestCount: requestCount.count,
      }
    } catch (error) {
      console.error("خطأ في جلب إحصائيات المستخدم:", error)
      return null
    }
  }

  async close() {
    if (this.db) {
      await this.db.close()
    }
  }
}
