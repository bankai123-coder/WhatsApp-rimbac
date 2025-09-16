import { DatabaseManager } from "../src/database/DatabaseManager.js"
import fs from "fs-extra"

async function setupDatabase() {
  console.log("🗄️ إعداد قاعدة البيانات...")

  try {
    // Ensure data directory exists
    await fs.ensureDir("./data")

    // Initialize database
    const db = new DatabaseManager()
    await db.initialize()

    // Insert sample data
    await insertSampleData(db)

    console.log("✅ تم إعداد قاعدة البيانات بنجاح!")

    await db.close()
  } catch (error) {
    console.error("❌ خطأ في إعداد قاعدة البيانات:", error)
    process.exit(1)
  }
}

async function insertSampleData(db) {
  console.log("📊 إدراج البيانات النموذجية...")

  // Insert admin settings
  const adminSettings = [
    { key: "bot_version", value: "1.0.0" },
    { key: "maintenance_mode", value: "false" },
    { key: "max_users_per_group", value: "500" },
    { key: "daily_tip_enabled", value: "true" },
    { key: "weekly_summary_enabled", value: "true" },
    { key: "quiz_timeout_minutes", value: "30" },
    { key: "max_quiz_attempts_per_day", value: "10" },
  ]

  for (const setting of adminSettings) {
    await db.db.run("INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)", [setting.key, setting.value])
  }

  // Insert sample users for testing
  const sampleUsers = [
    {
      phone_number: "22212345678",
      name: "أحمد محمد",
      grade_level: "1",
      points: 50,
    },
    {
      phone_number: "22298765432",
      name: "فاطمة علي",
      grade_level: "7",
      points: 120,
    },
    {
      phone_number: "22211111111",
      name: "محمد سالم",
      grade_level: "sciences",
      points: 200,
    },
  ]

  for (const user of sampleUsers) {
    await db.db.run("INSERT OR IGNORE INTO users (phone_number, name, grade_level, points) VALUES (?, ?, ?, ?)", [
      user.phone_number,
      user.name,
      user.grade_level,
      user.points,
    ])
  }

  // Insert sample quiz results
  const sampleQuizResults = [
    {
      user_phone: "22212345678",
      quiz_type: "subject_quiz",
      grade_level: "1",
      subject: "رياضيات",
      score: 8,
      total_questions: 10,
      completion_time: 300,
    },
    {
      user_phone: "22298765432",
      quiz_type: "subject_quiz",
      grade_level: "7",
      subject: "عربية",
      score: 9,
      total_questions: 10,
      completion_time: 250,
    },
  ]

  for (const result of sampleQuizResults) {
    await db.db.run(
      "INSERT INTO quiz_results (user_phone, quiz_type, grade_level, subject, score, total_questions, completion_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        result.user_phone,
        result.quiz_type,
        result.grade_level,
        result.subject,
        result.score,
        result.total_questions,
        result.completion_time,
      ],
    )
  }

  console.log("✅ تم إدراج البيانات النموذجية")
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
}

export { setupDatabase }
