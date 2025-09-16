import { setupDatabase } from "./scripts/setup-database.js"
import { runMigrations, insertDefaultAchievements } from "./scripts/migrate-database.js"
import { seedContent } from "./scripts/seed-content.js"
import { FileManager } from "./src/utils/FileManager.js"
import { Logger } from "./src/utils/Logger.js"

async function startBot() {
  console.log("🚀 بدء تشغيل بوت RIMBAC للواتساب...")

  try {
    // Initialize logger
    const logger = new Logger()
    await logger.initialize()

    // Setup database
    console.log("🗄️ إعداد قاعدة البيانات...")
    await setupDatabase()

    // Run migrations
    console.log("🔄 تشغيل ترقيات قاعدة البيانات...")
    await runMigrations()
    await insertDefaultAchievements()

    // Seed content
    console.log("🌱 زراعة المحتوى التعليمي...")
    await seedContent()

    // Initialize file manager
    const fileManager = new FileManager()
    await fileManager.initialize()

    // Setup scheduler (will be initialized in main bot)
    console.log("⏰ إعداد المجدول...")

    console.log("✅ تم إعداد جميع المكونات بنجاح!")
    console.log("🤖 البوت جاهز للعمل!")

    // The bot will start automatically from index.js
  } catch (error) {
    console.error("❌ خطأ في بدء تشغيل البوت:", error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 إيقاف البوت...")

  // Cleanup tasks here
  console.log("🧹 تنظيف الموارد...")

  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("\n🛑 إيقاف البوت (SIGTERM)...")
  process.exit(0)
})

// Start the bot
startBot()
