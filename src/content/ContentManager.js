export class ContentManager {
  constructor() {
    this.content = {
      grades: {
        primary: {
          1: { name: "السنة الأولى ابتدائي", subjects: ["العربية", "الرياضيات", "التربية الإسلامية"] },
          2: { name: "السنة الثانية ابتدائي", subjects: ["العربية", "الرياضيات", "التربية الإسلامية", "الفرنسية"] },
          3: {
            name: "السنة الثالثة ابتدائي",
            subjects: ["العربية", "الرياضيات", "التربية الإسلامية", "الفرنسية", "التاريخ والجغرافيا"],
          },
          4: {
            name: "السنة الرابعة ابتدائي",
            subjects: ["العربية", "الرياضيات", "التربية الإسلامية", "الفرنسية", "التاريخ والجغرافيا", "العلوم"],
          },
          5: {
            name: "السنة الخامسة ابتدائي",
            subjects: ["العربية", "الرياضيات", "التربية الإسلامية", "الفرنسية", "التاريخ والجغرافيا", "العلوم"],
          },
          6: {
            name: "السنة السادسة ابتدائي",
            subjects: ["العربية", "الرياضيات", "التربية الإسلامية", "الفرنسية", "التاريخ والجغرافيا", "العلوم"],
          },
        },
        middle: {
          7: {
            name: "السنة الأولى إعدادي",
            subjects: [
              "العربية",
              "الرياضيات",
              "التربية الإسلامية",
              "الفرنسية",
              "الإنجليزية",
              "التاريخ والجغرافيا",
              "العلوم الطبيعية",
              "الفيزياء",
            ],
          },
          8: {
            name: "السنة الثانية إعدادي",
            subjects: [
              "العربية",
              "الرياضيات",
              "التربية الإسلامية",
              "الفرنسية",
              "الإنجليزية",
              "التاريخ والجغرافيا",
              "العلوم الطبيعية",
              "الفيزياء",
            ],
          },
          9: {
            name: "السنة الثالثة إعدادي",
            subjects: [
              "العربية",
              "الرياضيات",
              "التربية الإسلامية",
              "الفرنسية",
              "الإنجليزية",
              "التاريخ والجغرافيا",
              "العلوم الطبيعية",
              "الفيزياء",
            ],
          },
          10: {
            name: "السنة الرابعة إعدادي",
            subjects: [
              "العربية",
              "الرياضيات",
              "التربية الإسلامية",
              "الفرنسية",
              "الإنجليزية",
              "التاريخ والجغرافيا",
              "العلوم الطبيعية",
              "الفيزياء",
            ],
          },
        },
        secondary: {
          literature_classic: {
            name: "شعبة الآداب الأصلية",
            subjects: ["العربية", "التربية الإسلامية", "التاريخ والجغرافيا", "الفلسفة", "الفرنسية"],
          },
          literature_modern: {
            name: "شعبة الآداب العصرية",
            subjects: ["العربية", "الفرنسية", "الإنجليزية", "التاريخ والجغرافيا", "الفلسفة", "الرياضيات"],
          },
          sciences: {
            name: "شعبة العلوم الطبيعية",
            subjects: ["الرياضيات", "الفيزياء", "الكيمياء", "العلوم الطبيعية", "العربية", "الفرنسية"],
          },
          mathematics: {
            name: "شعبة الرياضيات",
            subjects: ["الرياضيات", "الفيزياء", "الكيمياء", "العربية", "الفرنسية", "الفلسفة"],
          },
        },
      },
      universities: [
        "جامعة نواكشوط العصرية",
        "جامعة شنقيط العصرية",
        "المعهد العالي للدراسات والبحوث الإسلامية",
        "المدرسة العليا للتعليم",
        "المعهد العالي للمحاسبة وإدارة المؤسسات",
        "كلية الطب",
        "المدرسة الوطنية للإدارة والصحافة والقضاء",
      ],
      scholarships: [
        "منح الحكومة الموريتانية",
        "منح الجامعة العربية",
        "منح تركيا",
        "منح المغرب",
        "منح مصر",
        "منح الصين",
        "منح فرنسا",
        "منح ألمانيا",
      ],
      competitions: [
        "مسابقة دخول الثانوية",
        "مسابقة البكالوريا",
        "مسابقات التوظيف",
        "المسابقات الثقافية",
        "مسابقات الرياضيات",
        "مسابقات العلوم",
      ],
    }

    this.quizzes = new Map()
    this.books = new Map()
  }

  async initialize() {
    await this.loadQuizzes()
    await this.loadBooks()
    console.log("✅ تم تحميل المحتوى التعليمي")
  }

  async loadQuizzes() {
    // Load quiz data for different subjects and grades
    const quizData = {
      رياضيات_1: [
        {
          question: "كم يساوي 2 + 3؟",
          options: ["4", "5", "6", "7"],
          correct: 1,
          explanation: "الجواب الصحيح هو 5 لأن 2 + 3 = 5",
        },
        {
          question: "ما هو الرقم الذي يأتي بعد 9؟",
          options: ["8", "10", "11", "12"],
          correct: 1,
          explanation: "الرقم الذي يأتي بعد 9 هو 10",
        },
      ],
      عربية_1: [
        {
          question: "كم عدد حروف الهجاء العربية؟",
          options: ["26", "27", "28", "29"],
          correct: 2,
          explanation: "عدد حروف الهجاء العربية 28 حرفاً",
        },
      ],
    }

    for (const [key, quiz] of Object.entries(quizData)) {
      this.quizzes.set(key, quiz)
    }
  }

  async loadBooks() {
    // Simulate book data based on RIMBAC content
    const bookData = {
      "1_رياضيات": {
        title: "كتاب الرياضيات - السنة الأولى ابتدائي",
        description: "كتاب الرياضيات للسنة الأولى من التعليم الابتدائي",
        downloadUrl: "https://rimbac.com/books/math_grade1.pdf",
        chapters: ["الأرقام من 1 إلى 10", "الجمع البسيط", "الطرح البسيط", "الأشكال الهندسية"],
      },
      "1_عربية": {
        title: "كتاب اللغة العربية - السنة الأولى ابتدائي",
        description: "كتاب اللغة العربية للسنة الأولى من التعليم الابتدائي",
        downloadUrl: "https://rimbac.com/books/arabic_grade1.pdf",
        chapters: ["الحروف الهجائية", "الكلمات البسيطة", "الجمل القصيرة", "القراءة الأولى"],
      },
    }

    for (const [key, book] of Object.entries(bookData)) {
      this.books.set(key, book)
    }
  }

  getGradeInfo(gradeLevel) {
    // Find grade in all categories
    for (const [category, grades] of Object.entries(this.content.grades)) {
      if (grades[gradeLevel]) {
        return { category, ...grades[gradeLevel] }
      }
    }
    return null
  }

  getSubjectsForGrade(gradeLevel) {
    const gradeInfo = this.getGradeInfo(gradeLevel)
    return gradeInfo ? gradeInfo.subjects : []
  }

  getQuiz(subject, gradeLevel) {
    const key = `${subject}_${gradeLevel}`
    return this.quizzes.get(key) || null
  }

  getBook(subject, gradeLevel) {
    const key = `${gradeLevel}_${subject}`
    return this.books.get(key) || null
  }

  searchContent(query) {
    const results = []
    const queryLower = query.toLowerCase()

    // Search in grades
    for (const [category, grades] of Object.entries(this.content.grades)) {
      for (const [level, info] of Object.entries(grades)) {
        if (info.name.toLowerCase().includes(queryLower)) {
          results.push({
            type: "grade",
            category,
            level,
            name: info.name,
            subjects: info.subjects,
          })
        }

        // Search in subjects
        for (const subject of info.subjects) {
          if (subject.toLowerCase().includes(queryLower)) {
            results.push({
              type: "subject",
              subject,
              grade: info.name,
              level,
            })
          }
        }
      }
    }

    // Search in universities
    for (const university of this.content.universities) {
      if (university.toLowerCase().includes(queryLower)) {
        results.push({
          type: "university",
          name: university,
        })
      }
    }

    // Search in scholarships
    for (const scholarship of this.content.scholarships) {
      if (scholarship.toLowerCase().includes(queryLower)) {
        results.push({
          type: "scholarship",
          name: scholarship,
        })
      }
    }

    return results
  }

  getRandomTip() {
    const tips = [
      "💡 نصيحة: راجع دروسك يومياً لمدة 30 دقيقة على الأقل",
      "📚 نصيحة: اقرأ الكتب خارج المنهج لتوسيع معرفتك",
      "✍️ نصيحة: اكتب ملخصات للدروس المهمة",
      "🤝 نصيحة: شارك في المجموعات الدراسية مع زملائك",
      "⏰ نصيحة: نظم وقتك واعمل جدولاً للمراجعة",
      "🎯 نصيحة: ضع أهدافاً واضحة لكل مادة",
      "💪 نصيحة: لا تستسلم عند مواجهة الصعوبات",
      "🔍 نصيحة: اطرح الأسئلة عندما لا تفهم شيئاً",
    ]

    return tips[Math.floor(Math.random() * tips.length)]
  }
}
