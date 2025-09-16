import { ContentManager } from "../src/content/ContentManager.js"
import { DatabaseManager } from "../src/database/DatabaseManager.js"

async function seedContent() {
  console.log("🌱 زراعة المحتوى التعليمي...")

  try {
    const db = new DatabaseManager()
    await db.initialize()

    const contentManager = new ContentManager()
    await contentManager.initialize()

    // Seed quiz content
    await seedQuizzes(db, contentManager)

    // Seed book content
    await seedBooks(db)

    // Seed educational tips
    await seedTips(db)

    console.log("✅ تم زراعة المحتوى التعليمي بنجاح!")

    await db.close()
  } catch (error) {
    console.error("❌ خطأ في زراعة المحتوى:", error)
    process.exit(1)
  }
}

async function seedQuizzes(db, contentManager) {
  console.log("🧠 إضافة اختبارات تفاعلية...")

  const quizzes = {
    رياضيات_2: [
      {
        question: "كم يساوي 5 + 7؟",
        options: ["10", "11", "12", "13"],
        correct: 2,
        explanation: "الجواب الصحيح هو 12 لأن 5 + 7 = 12",
      },
      {
        question: "ما هو ناتج 3 × 4؟",
        options: ["10", "11", "12", "13"],
        correct: 2,
        explanation: "الجواب الصحيح هو 12 لأن 3 × 4 = 12",
      },
      {
        question: "كم يساوي 20 ÷ 4؟",
        options: ["4", "5", "6", "7"],
        correct: 1,
        explanation: "الجواب الصحيح هو 5 لأن 20 ÷ 4 = 5",
      },
    ],
    عربية_2: [
      {
        question: 'كم عدد أحرف كلمة "مدرسة"؟',
        options: ["4", "5", "6", "7"],
        correct: 1,
        explanation: 'كلمة "مدرسة" تحتوي على 5 أحرف: م-د-ر-س-ة',
      },
      {
        question: 'ما هو جمع كلمة "كتاب"؟',
        options: ["كتابات", "كتب", "كتابين", "كتاب"],
        correct: 1,
        explanation: 'جمع كلمة "كتاب" هو "كتب"',
      },
    ],
    رياضيات_7: [
      {
        question: "ما هو ناتج 2² + 3²؟",
        options: ["13", "12", "11", "10"],
        correct: 0,
        explanation: "2² = 4 و 3² = 9، إذن 4 + 9 = 13",
      },
      {
        question: "إذا كان x = 5، فما قيمة 2x + 3؟",
        options: ["13", "12", "11", "10"],
        correct: 0,
        explanation: "2x + 3 = 2(5) + 3 = 10 + 3 = 13",
      },
    ],
    فيزياء_sciences: [
      {
        question: "ما هي وحدة قياس القوة؟",
        options: ["جول", "نيوتن", "واط", "أمبير"],
        correct: 1,
        explanation: "وحدة قياس القوة هي النيوتن (N)",
      },
      {
        question: "ما هي سرعة الضوء في الفراغ؟",
        options: ["300,000 كم/ث", "3,000,000 كم/ث", "30,000 كم/ث", "300 كم/ث"],
        correct: 0,
        explanation: "سرعة الضوء في الفراغ هي تقريباً 300,000 كيلومتر في الثانية",
      },
    ],
  }

  // Store quizzes in content manager
  for (const [key, quiz] of Object.entries(quizzes)) {
    contentManager.quizzes.set(key, quiz)
  }

  console.log(`✅ تم إضافة ${Object.keys(quizzes).length} اختبار تفاعلي`)
}

async function seedBooks(db) {
  console.log("📚 إضافة الكتب المدرسية...")

  const books = [
    {
      grade: "1",
      subject: "رياضيات",
      title: "كتاب الرياضيات - السنة الأولى ابتدائي",
      description: "كتاب الرياضيات للسنة الأولى من التعليم الابتدائي - المنهج الموريتاني",
      chapters: ["الأرقام من 1 إلى 10", "الجمع البسيط", "الطرح البسيط", "الأشكال الهندسية", "القياس"],
      downloadUrl: "https://rimbac.com/books/math_grade1.pdf",
      fileSize: "2.5 MB",
      pages: 120,
    },
    {
      grade: "1",
      subject: "عربية",
      title: "كتاب اللغة العربية - السنة الأولى ابتدائي",
      description: "كتاب اللغة العربية للسنة الأولى من التعليم الابتدائي",
      chapters: ["الحروف الهجائية", "الكلمات البسيطة", "الجمل القصيرة", "القراءة الأولى", "الكتابة"],
      downloadUrl: "https://rimbac.com/books/arabic_grade1.pdf",
      fileSize: "3.1 MB",
      pages: 150,
    },
    {
      grade: "7",
      subject: "رياضيات",
      title: "كتاب الرياضيات - السنة الأولى إعدادي",
      description: "كتاب الرياضيات للسنة الأولى من التعليم الإعدادي",
      chapters: ["الأعداد الطبيعية", "الكسور", "الهندسة المستوية", "الإحصاء", "المعادلات"],
      downloadUrl: "https://rimbac.com/books/math_grade7.pdf",
      fileSize: "4.2 MB",
      pages: 200,
    },
    {
      grade: "sciences",
      subject: "فيزياء",
      title: "كتاب الفيزياء - شعبة العلوم الطبيعية",
      description: "كتاب الفيزياء لشعبة العلوم الطبيعية - المرحلة الثانوية",
      chapters: ["الميكانيك", "الكهرباء", "البصريات", "الديناميكا الحرارية", "الفيزياء الحديثة"],
      downloadUrl: "https://rimbac.com/books/physics_sciences.pdf",
      fileSize: "6.8 MB",
      pages: 350,
    },
  ]

  // Create books table if not exists
  await db.db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grade_level TEXT NOT NULL,
            subject TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            chapters TEXT,
            download_url TEXT,
            file_size TEXT,
            pages INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(grade_level, subject)
        )
    `)

  for (const book of books) {
    await db.db.run(
      `
            INSERT OR REPLACE INTO books 
            (grade_level, subject, title, description, chapters, download_url, file_size, pages)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        book.grade,
        book.subject,
        book.title,
        book.description,
        JSON.stringify(book.chapters),
        book.downloadUrl,
        book.fileSize,
        book.pages,
      ],
    )
  }

  console.log(`✅ تم إضافة ${books.length} كتاب مدرسي`)
}

async function seedTips(db) {
  console.log("💡 إضافة النصائح التعليمية...")

  const tips = [
    {
      category: "study",
      content: "راجع دروسك يومياً لمدة 30 دقيقة على الأقل لتحسين الذاكرة والفهم",
      target_grade: "all",
    },
    {
      category: "reading",
      content: "اقرأ الكتب خارج المنهج لتوسيع معرفتك وتحسين مهاراتك اللغوية",
      target_grade: "all",
    },
    {
      category: "writing",
      content: "اكتب ملخصات للدروس المهمة بأسلوبك الخاص لتسهيل المراجعة",
      target_grade: "middle,secondary",
    },
    {
      category: "collaboration",
      content: "شارك في المجموعات الدراسية مع زملائك لتبادل المعرفة والخبرات",
      target_grade: "all",
    },
    {
      category: "time_management",
      content: "نظم وقتك واعمل جدولاً للمراجعة يتضمن فترات راحة منتظمة",
      target_grade: "all",
    },
    {
      category: "goals",
      content: "ضع أهدافاً واضحة وقابلة للتحقيق لكل مادة دراسية",
      target_grade: "all",
    },
    {
      category: "motivation",
      content: "لا تستسلم عند مواجهة الصعوبات، فكل خطأ هو فرصة للتعلم",
      target_grade: "all",
    },
    {
      category: "questions",
      content: "اطرح الأسئلة عندما لا تفهم شيئاً، فلا يوجد سؤال غبي",
      target_grade: "all",
    },
    {
      category: "health",
      content: "احرص على النوم الكافي والتغذية الصحية لتحسين التركيز والذاكرة",
      target_grade: "all",
    },
    {
      category: "technology",
      content: "استخدم التكنولوجيا بذكاء في التعلم، مثل التطبيقات التعليمية والمصادر الرقمية",
      target_grade: "middle,secondary",
    },
    {
      category: "exam_prep",
      content: "ابدأ التحضير للامتحانات مبكراً ولا تترك كل شيء للحظة الأخيرة",
      target_grade: "all",
    },
    {
      category: "practice",
      content: "مارس حل التمارين والمسائل بانتظام لتقوية مهاراتك",
      target_grade: "all",
    },
  ]

  // Create tips table if not exists
  await db.db.exec(`
        CREATE TABLE IF NOT EXISTS educational_tips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            target_grade TEXT DEFAULT 'all',
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)

  for (const tip of tips) {
    await db.db.run(
      `
            INSERT OR IGNORE INTO educational_tips (category, content, target_grade)
            VALUES (?, ?, ?)
        `,
      [tip.category, tip.content, tip.target_grade],
    )
  }

  console.log(`✅ تم إضافة ${tips.length} نصيحة تعليمية`)
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedContent()
}

export { seedContent }
