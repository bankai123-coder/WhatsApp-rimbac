import { DatabaseManager } from "../src/database/DatabaseManager.js"

const MIGRATIONS = [
  {
    version: 1,
    name: "add_user_preferences",
    up: async (db) => {
      await db.exec(`
                ALTER TABLE users ADD COLUMN subject_preferences TEXT;
                ALTER TABLE users ADD COLUMN notification_enabled BOOLEAN DEFAULT TRUE;
                ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'ar';
            `)
    },
  },
  {
    version: 2,
    name: "add_content_ratings",
    up: async (db) => {
      await db.exec(`
                CREATE TABLE IF NOT EXISTS content_ratings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_phone TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    content_id TEXT NOT NULL,
                    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
                    review TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_phone, content_type, content_id)
                )
            `)
    },
  },
  {
    version: 3,
    name: "add_study_groups",
    up: async (db) => {
      await db.exec(`
                CREATE TABLE IF NOT EXISTS study_groups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id TEXT UNIQUE NOT NULL,
                    group_name TEXT NOT NULL,
                    grade_level TEXT,
                    subject TEXT,
                    admin_phone TEXT NOT NULL,
                    member_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS study_group_members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_id TEXT NOT NULL,
                    user_phone TEXT NOT NULL,
                    role TEXT DEFAULT 'member',
                    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(group_id, user_phone),
                    FOREIGN KEY (group_id) REFERENCES study_groups(group_id)
                )
            `)
    },
  },
  {
    version: 4,
    name: "add_achievements",
    up: async (db) => {
      await db.exec(`
                CREATE TABLE IF NOT EXISTS achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT NOT NULL,
                    icon TEXT,
                    points_required INTEGER DEFAULT 0,
                    condition_type TEXT NOT NULL,
                    condition_value TEXT,
                    is_active BOOLEAN DEFAULT TRUE
                );
                
                CREATE TABLE IF NOT EXISTS user_achievements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_phone TEXT NOT NULL,
                    achievement_id INTEGER NOT NULL,
                    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_phone, achievement_id),
                    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
                )
            `)
    },
  },
  {
    version: 5,
    name: "add_content_cache",
    up: async (db) => {
      await db.exec(`
                CREATE TABLE IF NOT EXISTS content_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cache_key TEXT UNIQUE NOT NULL,
                    content_type TEXT NOT NULL,
                    data TEXT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX idx_content_cache_key ON content_cache(cache_key);
                CREATE INDEX idx_content_cache_expires ON content_cache(expires_at);
            `)
    },
  },
]

async function runMigrations() {
  console.log("🔄 تشغيل ترقيات قاعدة البيانات...")

  try {
    const db = new DatabaseManager()
    await db.initialize()

    // Create migrations table if it doesn't exist
    await db.db.exec(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER UNIQUE NOT NULL,
                name TEXT NOT NULL,
                executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `)

    // Get current migration version
    const currentVersion = await db.db.get("SELECT MAX(version) as version FROM migrations")
    const startVersion = currentVersion?.version || 0

    console.log(`📊 الإصدار الحالي: ${startVersion}`)

    // Run pending migrations
    const pendingMigrations = MIGRATIONS.filter((m) => m.version > startVersion)

    if (pendingMigrations.length === 0) {
      console.log("✅ لا توجد ترقيات معلقة")
      await db.close()
      return
    }

    console.log(`🔄 تشغيل ${pendingMigrations.length} ترقية...`)

    for (const migration of pendingMigrations) {
      console.log(`⚡ تشغيل الترقية ${migration.version}: ${migration.name}`)

      try {
        await migration.up(db.db)

        // Record migration
        await db.db.run("INSERT INTO migrations (version, name) VALUES (?, ?)", [migration.version, migration.name])

        console.log(`✅ تمت الترقية ${migration.version} بنجاح`)
      } catch (error) {
        console.error(`❌ فشلت الترقية ${migration.version}:`, error)
        throw error
      }
    }

    console.log("✅ تمت جميع الترقيات بنجاح!")
    await db.close()
  } catch (error) {
    console.error("❌ خطأ في تشغيل الترقيات:", error)
    process.exit(1)
  }
}

// Insert default achievements
async function insertDefaultAchievements() {
  console.log("🏆 إدراج الإنجازات الافتراضية...")

  const db = new DatabaseManager()
  await db.initialize()

  const achievements = [
    {
      name: "المبتدئ",
      description: "أول اختبار لك!",
      icon: "🌟",
      points_required: 0,
      condition_type: "quiz_count",
      condition_value: "1",
    },
    {
      name: "المثابر",
      description: "أجريت 10 اختبارات",
      icon: "💪",
      points_required: 0,
      condition_type: "quiz_count",
      condition_value: "10",
    },
    {
      name: "الخبير",
      description: "حصلت على 100 نقطة",
      icon: "🎓",
      points_required: 100,
      condition_type: "points",
      condition_value: "100",
    },
    {
      name: "الأستاذ",
      description: "حصلت على 500 نقطة",
      icon: "👨‍🏫",
      points_required: 500,
      condition_type: "points",
      condition_value: "500",
    },
    {
      name: "العبقري",
      description: "حصلت على 1000 نقطة",
      icon: "🧠",
      points_required: 1000,
      condition_type: "points",
      condition_value: "1000",
    },
    {
      name: "المتفوق",
      description: "معدل 90% أو أكثر في 5 اختبارات",
      icon: "🏆",
      points_required: 0,
      condition_type: "high_score_streak",
      condition_value: "5",
    },
    {
      name: "المنتظم",
      description: "استخدمت البوت لمدة 7 أيام متتالية",
      icon: "📅",
      points_required: 0,
      condition_type: "daily_streak",
      condition_value: "7",
    },
    {
      name: "الباحث",
      description: "استخدمت البحث 20 مرة",
      icon: "🔍",
      points_required: 0,
      condition_type: "search_count",
      condition_value: "20",
    },
  ]

  for (const achievement of achievements) {
    await db.db.run(
      `
            INSERT OR IGNORE INTO achievements 
            (name, description, icon, points_required, condition_type, condition_value) 
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        achievement.name,
        achievement.description,
        achievement.icon,
        achievement.points_required,
        achievement.condition_type,
        achievement.condition_value,
      ],
    )
  }

  console.log("✅ تم إدراج الإنجازات الافتراضية")
  await db.close()
}

// Run migrations if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then(() => {
    return insertDefaultAchievements()
  })
}

export { runMigrations, insertDefaultAchievements }
