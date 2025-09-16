import moment from "moment"

export class CommandHandler {
  constructor(db, contentManager, geminiManager) {
    this.db = db
    this.contentManager = contentManager
    this.geminiManager = geminiManager
    this.commands = new Map()
    this.ownerNumber = "22232157828"
    this.initializeCommands()
  }

  initializeCommands() {
    // Basic commands
    this.commands.set("المساعدة", this.helpCommand.bind(this))
    this.commands.set("help", this.helpCommand.bind(this))
    this.commands.set("البداية", this.startCommand.bind(this))
    this.commands.set("start", this.startCommand.bind(this))

    // Educational content commands
    this.commands.set("الكتب", this.booksCommand.bind(this))
    this.commands.set("books", this.booksCommand.bind(this))
    this.commands.set("المراحل", this.gradesCommand.bind(this))
    this.commands.set("grades", this.gradesCommand.bind(this))
    this.commands.set("المواد", this.subjectsCommand.bind(this))
    this.commands.set("subjects", this.subjectsCommand.bind(this))

    // Quiz commands
    this.commands.set("اختبار", this.quizCommand.bind(this))
    this.commands.set("quiz", this.quizCommand.bind(this))
    this.commands.set("اختباري", this.myQuizzesCommand.bind(this))
    this.commands.set("myquizzes", this.myQuizzesCommand.bind(this))

    // University and scholarship commands
    this.commands.set("الجامعات", this.universitiesCommand.bind(this))
    this.commands.set("universities", this.universitiesCommand.bind(this))
    this.commands.set("المنح", this.scholarshipsCommand.bind(this))
    this.commands.set("scholarships", this.scholarshipsCommand.bind(this))

    // Competition commands
    this.commands.set("المسابقات", this.competitionsCommand.bind(this))
    this.commands.set("competitions", this.competitionsCommand.bind(this))

    // User profile commands
    this.commands.set("ملفي", this.profileCommand.bind(this))
    this.commands.set("profile", this.profileCommand.bind(this))
    this.commands.set("إحصائياتي", this.statsCommand.bind(this))
    this.commands.set("stats", this.statsCommand.bind(this))

    // Search and utility commands
    this.commands.set("بحث", this.searchCommand.bind(this))
    this.commands.set("search", this.searchCommand.bind(this))
    this.commands.set("نصيحة", this.tipCommand.bind(this))
    this.commands.set("tip", this.tipCommand.bind(this))

    // AI-powered commands with Gemini integration
    this.commands.set("اسأل", this.askAICommand.bind(this))
    this.commands.set("ask", this.askAICommand.bind(this))
    this.commands.set("اشرح", this.explainCommand.bind(this))
    this.commands.set("explain", this.explainCommand.bind(this))
    this.commands.set("لخص", this.summarizeCommand.bind(this))
    this.commands.set("summarize", this.summarizeCommand.bind(this))
    this.commands.set("اختبار_ذكي", this.smartQuizCommand.bind(this))
    this.commands.set("smart_quiz", this.smartQuizCommand.bind(this))
    this.commands.set("مساعد", this.tutorCommand.bind(this))
    this.commands.set("tutor", this.tutorCommand.bind(this))
    this.commands.set("حل", this.solveCommand.bind(this))
    this.commands.set("solve", this.solveCommand.bind(this))

    // Admin commands
    this.commands.set("إحصائيات_عامة", this.adminStatsCommand.bind(this))
    this.commands.set("admin_stats", this.adminStatsCommand.bind(this))
    this.commands.set("بث", this.broadcastCommand.bind(this))
    this.commands.set("broadcast", this.broadcastCommand.bind(this))

    // Registration commands
    this.commands.set("تسجيل", this.registerCommand.bind(this))
    this.commands.set("register", this.registerCommand.bind(this))

    // Owner-specific commands
    this.commands.set("حالة_البوت", this.botStatusCommand.bind(this))
    this.commands.set("bot_status", this.botStatusCommand.bind(this))
    this.commands.set("إعادة_تشغيل", this.restartCommand.bind(this))
    this.commands.set("restart", this.restartCommand.bind(this))
  }

  async handleCommand(command, args, userPhone, sock, messageInfo) {
    const startTime = Date.now()

    try {
      // Ensure user exists in database
      await this.db.createUser(userPhone)
      await this.db.updateUserActivity(userPhone)

      // Get command handler
      const handler = this.commands.get(command.toLowerCase())

      if (handler) {
        const response = await handler(args, userPhone, messageInfo)
        const responseTime = Date.now() - startTime

        // Log command usage
        await this.db.logMessage(userPhone, "command", command, responseTime)

        return response
      } else {
        return await this.handleUnknownCommandWithAI(command, args, userPhone)
      }
    } catch (error) {
      console.error(`خطأ في معالجة الأمر ${command}:`, error)
      return {
        text: "❌ حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async handleUnknownCommandWithAI(command, args, userPhone) {
    try {
      const fullQuery = `${command} ${args.join(" ")}`
      const context =
        "المستخدم يحاول استخدام أمر غير معروف في بوت تعليمي موريتاني. ساعده في فهم ما يريد وقدم له الأوامر المناسبة."

      const aiResponse = await this.geminiManager.generateResponse(fullQuery, userPhone, context)

      return {
        text: `🤖 *مساعد ذكي*\n\n${aiResponse}\n\n📝 اكتب *!المساعدة* لرؤية جميع الأوامر المتاحة`,
      }
    } catch (error) {
      return this.unknownCommand(command, userPhone)
    }
  }

  async askAICommand(args, userPhone) {
    if (args.length === 0) {
      return {
        text:
          `🤖 *اسأل الذكاء الاصطناعي*\n\n` +
          `الاستخدام: *!اسأل* [سؤالك]\n\n` +
          `أمثلة:\n` +
          `• !اسأل ما هي قوانين نيوتن؟\n` +
          `• !اسأل كيف أحسب مساحة المثلث؟\n` +
          `• !اسأل ما هي عاصمة فرنسا؟\n\n` +
          `💡 يمكنني مساعدتك في جميع المواد الدراسية!`,
      }
    }

    const question = args.join(" ")
    const user = await this.db.getUser(userPhone)
    const context = user ? `الطالب في ${this.getGradeName(user.grade_level)}` : null

    try {
      const response = await this.geminiManager.generateResponse(question, userPhone, context)

      return {
        text: `🤖 *الذكاء الاصطناعي يجيب*\n\n${response}\n\n💡 اكتب *!اسأل* [سؤال جديد] لطرح سؤال آخر`,
      }
    } catch (error) {
      return {
        text: "❌ عذراً، لم أتمكن من الإجابة على سؤالك الآن. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async explainCommand(args, userPhone) {
    if (args.length === 0) {
      return {
        text:
          `📚 *شرح المفاهيم*\n\n` +
          `الاستخدام: *!اشرح* [المفهوم]\n\n` +
          `أمثلة:\n` +
          `• !اشرح الجاذبية\n` +
          `• !اشرح النحو العربي\n` +
          `• !اشرح المعادلات التربيعية\n\n` +
          `🎯 سأشرح لك أي مفهوم بطريقة بسيطة ومفهومة!`,
      }
    }

    const concept = args.join(" ")
    const user = await this.db.getUser(userPhone)
    const level = user ? this.getGradeName(user.grade_level) : "ثانوي"

    try {
      const explanation = await this.geminiManager.explainConcept(concept, level)

      return {
        text: `📚 *شرح: ${concept}*\n\n${explanation}\n\n🎯 اكتب *!اشرح* [مفهوم آخر] لشرح مفهوم جديد`,
      }
    } catch (error) {
      return {
        text: "❌ عذراً، لم أتمكن من شرح هذا المفهوم الآن. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async smartQuizCommand(args, userPhone) {
    if (args.length === 0) {
      return {
        text:
          `🧠 *الاختبار الذكي*\n\n` +
          `الاستخدام: *!اختبار_ذكي* [الموضوع] [المستوى]\n\n` +
          `أمثلة:\n` +
          `• !اختبار_ذكي الرياضيات سهل\n` +
          `• !اختبار_ذكي التاريخ متوسط\n` +
          `• !اختبار_ذكي الفيزياء صعب\n\n` +
          `🎯 سأنشئ لك اختباراً مخصصاً بالذكاء الاصطناعي!`,
      }
    }

    const topic = args.slice(0, -1).join(" ") || args.join(" ")
    const difficulty = args[args.length - 1] || "متوسط"

    try {
      const quiz = await this.geminiManager.generateQuiz(topic, difficulty, 5)

      return {
        text: `🧠 *اختبار ذكي: ${topic}*\n\n${quiz}\n\n📝 أرسل إجاباتك وسأقوم بتصحيحها لك!`,
      }
    } catch (error) {
      return {
        text: "❌ عذراً، لم أتمكن من إنشاء الاختبار الآن. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async tutorCommand(args, userPhone) {
    if (args.length === 0) {
      return {
        text:
          `👨‍🏫 *المدرس الشخصي*\n\n` +
          `الاستخدام: *!مساعد* [المادة أو الموضوع]\n\n` +
          `أمثلة:\n` +
          `• !مساعد رياضيات\n` +
          `• !مساعد اللغة العربية\n` +
          `• !مساعد الفيزياء\n\n` +
          `🎯 سأكون مدرسك الشخصي في أي مادة!`,
      }
    }

    const subject = args.join(" ")
    const user = await this.db.getUser(userPhone)
    const context = `أنت مدرس شخصي للطالب في مادة ${subject}. ${user ? `الطالب في ${this.getGradeName(user.grade_level)}` : ""}`

    try {
      const tutorResponse = await this.geminiManager.generateResponse(
        `أريد مساعدة في مادة ${subject}. ما هي أهم النقاط التي يجب أن أركز عليها؟`,
        userPhone,
        context,
      )

      return {
        text: `👨‍🏫 *مدرسك في ${subject}*\n\n${tutorResponse}\n\n💬 يمكنك طرح أي سؤال عن هذه المادة!`,
      }
    } catch (error) {
      return {
        text: "❌ عذراً، لم أتمكن من مساعدتك الآن. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async solveCommand(args, userPhone) {
    if (args.length === 0) {
      return {
        text:
          `🔧 *حل المسائل*\n\n` +
          `الاستخدام: *!حل* [المسألة أو التمرين]\n\n` +
          `أمثلة:\n` +
          `• !حل 2x + 5 = 15\n` +
          `• !حل مساحة مثلث قاعدته 10 وارتفاعه 8\n` +
          `• !حل تحليل الجملة: الطالب يدرس\n\n` +
          `🎯 سأحل لك أي مسألة خطوة بخطوة!`,
      }
    }

    const problem = args.join(" ")
    const user = await this.db.getUser(userPhone)
    const context = `حل هذه المسألة خطوة بخطوة مع الشرح التفصيلي. ${user ? `الطالب في ${this.getGradeName(user.grade_level)}` : ""}`

    try {
      const solution = await this.geminiManager.generateResponse(problem, userPhone, context)

      return {
        text: `🔧 *حل المسألة*\n\n**المسألة:** ${problem}\n\n**الحل:**\n${solution}\n\n💡 اكتب *!حل* [مسألة جديدة] لحل مسألة أخرى`,
      }
    } catch (error) {
      return {
        text: "❌ عذراً، لم أتمكن من حل هذه المسألة الآن. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async botStatusCommand(args, userPhone) {
    if (!this.isOwner(userPhone)) {
      return { text: "❌ هذا الأمر مخصص للمالك فقط" }
    }

    try {
      const totalUsers = await this.db.db.get("SELECT COUNT(*) as count FROM users")
      const totalQuizzes = await this.db.db.get("SELECT COUNT(*) as count FROM quiz_results")
      const totalMessages = await this.db.db.get("SELECT COUNT(*) as count FROM message_logs")
      const aiSessions = this.geminiManager.getChatSessionsCount()

      let response = `👑 *حالة البوت - المالك*\n\n`
      response += `🤖 *معلومات النظام:*\n`
      response += `• الحالة: ✅ يعمل بشكل طبيعي\n`
      response += `• وقت التشغيل: ${process.uptime().toFixed(0)} ثانية\n`
      response += `• استخدام الذاكرة: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`

      response += `📊 *إحصائيات الاستخدام:*\n`
      response += `• إجمالي المستخدمين: ${totalUsers.count}\n`
      response += `• إجمالي الاختبارات: ${totalQuizzes.count}\n`
      response += `• إجمالي الرسائل: ${totalMessages.count}\n`
      response += `• جلسات الذكاء الاصطناعي النشطة: ${aiSessions}\n\n`

      response += `🧠 *حالة الذكاء الاصطناعي:*\n`
      response += `• Gemini AI: ✅ متصل\n`
      response += `• المحادثات النشطة: ${aiSessions}\n\n`

      response += `📅 تاريخ التقرير: ${moment().format("DD/MM/YYYY HH:mm")}`

      return { text: response }
    } catch (error) {
      return { text: "❌ خطأ في جلب حالة البوت" }
    }
  }

  async restartCommand(args, userPhone) {
    if (!this.isOwner(userPhone)) {
      return { text: "❌ هذا الأمر مخصص للمالك فقط" }
    }

    return {
      text:
        `🔄 *إعادة تشغيل البوت*\n\n` +
        `⚠️ سيتم إعادة تشغيل البوت خلال 5 ثوانٍ...\n` +
        `📱 ستحتاج لإعادة المصادقة إذا لزم الأمر\n\n` +
        `👑 تم الطلب من المالك: ${userPhone}`,
    }
  }

  isOwner(phoneNumber) {
    return phoneNumber.replace(/\D/g, "") === this.ownerNumber
  }

  async helpCommand(args, userPhone) {
    const helpText =
      `🤖 *مرحباً بك في بوت RIMBAC للواتساب*\n\n` +
      `📚 *الأوامر التعليمية:*\n` +
      `• *!الكتب* - عرض الكتب المدرسية\n` +
      `• *!المراحل* - عرض المراحل التعليمية\n` +
      `• *!المواد* [المرحلة] - عرض مواد مرحلة معينة\n` +
      `• *!اختبار* [المادة] [المرحلة] - بدء اختبار\n` +
      `• *!بحث* [كلمة البحث] - البحث في المحتوى\n\n` +
      `🤖 *الذكاء الاصطناعي:*\n` +
      `• *!اسأل* [سؤالك] - اسأل الذكاء الاصطناعي\n` +
      `• *!اشرح* [المفهوم] - شرح أي مفهوم\n` +
      `• *!حل* [المسألة] - حل المسائل خطوة بخطوة\n` +
      `• *!اختبار_ذكي* [الموضوع] - اختبار مخصص بالذكاء الاصطناعي\n` +
      `• *!مساعد* [المادة] - مدرس شخصي ذكي\n\n` +
      `🎓 *الجامعات والمنح:*\n` +
      `• *!الجامعات* - الجامعات الموريتانية\n` +
      `• *!المنح* - المنح الدراسية المتاحة\n` +
      `• *!المسابقات* - المسابقات التعليمية\n\n` +
      `👤 *الملف الشخصي:*\n` +
      `• *!تسجيل* [الاسم] [المرحلة] - تسجيل بياناتك\n` +
      `• *!ملفي* - عرض ملفك الشخصي\n` +
      `• *!إحصائياتي* - عرض إحصائياتك\n` +
      `• *!اختباري* - عرض نتائج اختباراتك\n\n` +
      `💡 *أوامر أخرى:*\n` +
      `• *!نصيحة* - نصيحة تعليمية يومية\n` +
      `• *!المساعدة* - عرض هذه القائمة\n\n` +
      `📱 *طريقة الاستخدام:*\n` +
      `اكتب الأمر متبوعاً بعلامة التعجب (!)\n` +
      `مثال: !الكتب أو !اسأل ما هي الجاذبية؟\n\n` +
      `🌟 *مميزات جديدة:*\n` +
      `• الذكاء الاصطناعي Gemini مدمج بالكامل\n` +
      `• إجابات ذكية على جميع الأسئلة\n` +
      `• شرح المفاهيم بطريقة مبسطة\n` +
      `• حل المسائل خطوة بخطوة\n\n` +
      `📞 *للدعم:* تواصل مع إدارة الموقع`

    return { text: helpText }
  }

  async startCommand(args, userPhone) {
    const user = await this.db.getUser(userPhone)
    const isNewUser = !user || !user.name

    let welcomeText =
      `🎓 *أهلاً وسهلاً بك في بوت RIMBAC*\n\n` +
      `📚 *موقع الطالب الموريتاني*\n` +
      `البوت الذكي لخدمة التعليم في موريتانيا\n\n`

    if (isNewUser) {
      welcomeText +=
        `🆕 *مرحباً بك لأول مرة!*\n` +
        `لتحصل على تجربة مخصصة، يرجى تسجيل بياناتك:\n` +
        `*!تسجيل* [اسمك] [مرحلتك التعليمية]\n\n` +
        `مثال: !تسجيل أحمد محمد 1\n` +
        `(للسنة الأولى ابتدائي)\n\n`
    } else {
      welcomeText +=
        `👋 *أهلاً بك مرة أخرى ${user.name}!*\n` +
        `مرحلتك: ${this.getGradeName(user.grade_level)}\n` +
        `نقاطك: ${user.points} نقطة\n\n`
    }

    welcomeText +=
      `🚀 *ما يمكنني مساعدتك فيه:*\n` +
      `• الكتب المدرسية لجميع المراحل\n` +
      `• الاختبارات التفاعلية\n` +
      `• معلومات الجامعات والمنح\n` +
      `• المسابقات التعليمية\n` +
      `• النصائح الدراسية\n\n` +
      `📝 اكتب *!المساعدة* لرؤية جميع الأوامر`

    return { text: welcomeText }
  }

  async registerCommand(args, userPhone) {
    if (args.length < 2) {
      return {
        text:
          `📝 *تسجيل البيانات*\n\n` +
          `الاستخدام الصحيح:\n` +
          `*!تسجيل* [الاسم] [المرحلة]\n\n` +
          `أمثلة:\n` +
          `• !تسجيل أحمد محمد 1 (للسنة الأولى ابتدائي)\n` +
          `• !تسجيل فاطمة علي 7 (للسنة الأولى إعدادي)\n` +
          `• !تسجيل محمد سالم literature_classic (للآداب الأصلية)\n\n` +
          `📚 *المراحل المتاحة:*\n` +
          `• 1-6: المرحلة الابتدائية\n` +
          `• 7-10: المرحلة الإعدادية\n` +
          `• literature_classic: الآداب الأصلية\n` +
          `• literature_modern: الآداب العصرية\n` +
          `• sciences: العلوم الطبيعية\n` +
          `• mathematics: الرياضيات`,
      }
    }

    const name = args.slice(0, -1).join(" ")
    const gradeLevel = args[args.length - 1]

    // Validate grade level
    const gradeInfo = this.contentManager.getGradeInfo(gradeLevel)
    if (!gradeInfo) {
      return {
        text:
          `❌ المرحلة التعليمية غير صحيحة: ${gradeLevel}\n\n` +
          `المراحل المتاحة:\n` +
          `• 1-6 للمرحلة الابتدائية\n` +
          `• 7-10 للمرحلة الإعدادية\n` +
          `• literature_classic, literature_modern, sciences, mathematics للثانوية`,
      }
    }

    try {
      // Update user information
      await this.db.db.run(
        "INSERT OR REPLACE INTO users (phone_number, name, grade_level, registration_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [userPhone, name, gradeLevel],
      )

      return {
        text:
          `✅ *تم تسجيل بياناتك بنجاح!*\n\n` +
          `👤 الاسم: ${name}\n` +
          `📚 المرحلة: ${gradeInfo.name}\n` +
          `📖 المواد المتاحة: ${gradeInfo.subjects.join(", ")}\n\n` +
          `🎯 يمكنك الآن:\n` +
          `• الحصول على الكتب المدرسية\n` +
          `• إجراء الاختبارات التفاعلية\n` +
          `• تتبع تقدمك الدراسي\n\n` +
          `📝 اكتب *!المساعدة* لرؤية جميع الأوامر`,
      }
    } catch (error) {
      console.error("خطأ في تسجيل المستخدم:", error)
      return {
        text: "❌ حدث خطأ أثناء تسجيل بياناتك. يرجى المحاولة مرة أخرى.",
      }
    }
  }

  async booksCommand(args, userPhone) {
    const user = await this.db.getUser(userPhone)

    if (args.length === 0) {
      // Show available grades for books
      let response = `📚 *الكتب المدرسية*\n\n`

      if (user && user.grade_level) {
        const gradeInfo = this.contentManager.getGradeInfo(user.grade_level)
        if (gradeInfo) {
          response += `📖 *كتب مرحلتك (${gradeInfo.name}):*\n`
          for (const subject of gradeInfo.subjects) {
            response += `• ${subject}\n`
          }
          response += `\n💡 اكتب: *!الكتب* [اسم المادة] لتحميل الكتاب\n\n`
        }
      }

      response +=
        `📋 *جميع المراحل المتاحة:*\n\n` +
        `🎒 *المرحلة الابتدائية:*\n` +
        `• السنة 1-6 ابتدائي\n\n` +
        `🎓 *المرحلة الإعدادية:*\n` +
        `• السنة 1-4 إعدادي\n\n` +
        `🏛️ *المرحلة الثانوية:*\n` +
        `• شعبة الآداب الأصلية\n` +
        `• شعبة الآداب العصرية\n` +
        `• شعبة العلوم الطبيعية\n` +
        `• شعبة الرياضيات\n\n` +
        `📝 *الاستخدام:*\n` +
        `!الكتب [المادة] [المرحلة]\n` +
        `مثال: !الكتب رياضيات 1`

      return { text: response }
    }

    // Handle specific book request
    const subject = args[0]
    const grade = args[1] || (user ? user.grade_level : null)

    if (!grade) {
      return {
        text:
          `❌ يرجى تحديد المرحلة التعليمية\n\n` + `الاستخدام: *!الكتب* [المادة] [المرحلة]\n` + `مثال: !الكتب رياضيات 1`,
      }
    }

    const book = this.contentManager.getBook(subject, grade)

    if (book) {
      return {
        text:
          `📖 *${book.title}*\n\n` +
          `📝 الوصف: ${book.description}\n\n` +
          `📑 الفصول:\n${book.chapters.map((ch) => `• ${ch}`).join("\n")}\n\n` +
          `⬇️ رابط التحميل: ${book.downloadUrl}\n\n` +
          `💡 نصيحة: احفظ الرابط في مفضلتك للوصول السريع`,
      }
    } else {
      return {
        text:
          `❌ لم يتم العثور على كتاب ${subject} للمرحلة ${grade}\n\n` +
          `تأكد من:\n` +
          `• كتابة اسم المادة بشكل صحيح\n` +
          `• تحديد المرحلة الصحيحة\n\n` +
          `📝 اكتب *!المواد* ${grade} لرؤية المواد المتاحة`,
      }
    }
  }

  async gradesCommand(args, userPhone) {
    let response = `🎓 *المراحل التعليمية في موريتانيا*\n\n`

    response += `🎒 *المرحلة الابتدائية (6 سنوات):*\n`
    for (let i = 1; i <= 6; i++) {
      const gradeInfo = this.contentManager.getGradeInfo(i.toString())
      response += `• ${gradeInfo.name}\n`
    }

    response += `\n🎓 *المرحلة الإعدادية (4 سنوات):*\n`
    for (let i = 7; i <= 10; i++) {
      const gradeInfo = this.contentManager.getGradeInfo(i.toString())
      response += `• ${gradeInfo.name}\n`
    }

    response += `\n🏛️ *المرحلة الثانوية (3 سنوات):*\n`
    const secondaryGrades = ["literature_classic", "literature_modern", "sciences", "mathematics"]
    for (const grade of secondaryGrades) {
      const gradeInfo = this.contentManager.getGradeInfo(grade)
      response += `• ${gradeInfo.name}\n`
    }

    response +=
      `\n📝 *للحصول على مواد مرحلة معينة:*\n` +
      `اكتب: *!المواد* [رقم المرحلة]\n` +
      `مثال: !المواد 1 أو !المواد literature_classic`

    return { text: response }
  }

  async subjectsCommand(args, userPhone) {
    const user = await this.db.getUser(userPhone)
    const gradeLevel = args[0] || (user ? user.grade_level : null)

    if (!gradeLevel) {
      return {
        text:
          `📚 *عرض مواد مرحلة تعليمية*\n\n` +
          `الاستخدام: *!المواد* [المرحلة]\n\n` +
          `أمثلة:\n` +
          `• !المواد 1 (للسنة الأولى ابتدائي)\n` +
          `• !المواد 7 (للسنة الأولى إعدادي)\n` +
          `• !المواد sciences (لشعبة العلوم)\n\n` +
          `📝 اكتب *!المراحل* لرؤية جميع المراحل المتاحة`,
      }
    }

    const gradeInfo = this.contentManager.getGradeInfo(gradeLevel)

    if (!gradeInfo) {
      return {
        text: `❌ المرحلة التعليمية غير موجودة: ${gradeLevel}\n\n` + `📝 اكتب *!المراحل* لرؤية جميع المراحل المتاحة`,
      }
    }

    let response = `📚 *مواد ${gradeInfo.name}*\n\n`

    response += `📖 *المواد المتاحة:*\n`
    gradeInfo.subjects.forEach((subject, index) => {
      response += `${index + 1}. ${subject}\n`
    })

    response +=
      `\n🎯 *ما يمكنك فعله:*\n` +
      `• *!الكتب* [المادة] - تحميل كتاب المادة\n` +
      `• *!اختبار* [المادة] - إجراء اختبار في المادة\n` +
      `• *!بحث* [المادة] - البحث عن محتوى المادة\n\n` +
      `💡 *أمثلة:*\n` +
      `• !الكتب ${gradeInfo.subjects[0]}\n` +
      `• !اختبار ${gradeInfo.subjects[0]}`

    return { text: response }
  }

  async quizCommand(args, userPhone) {
    const user = await this.db.getUser(userPhone)

    if (args.length === 0) {
      let response = `🧠 *الاختبارات التفاعلية*\n\n`

      if (user && user.grade_level) {
        const gradeInfo = this.contentManager.getGradeInfo(user.grade_level)
        if (gradeInfo) {
          response += `📝 *اختبارات مرحلتك (${gradeInfo.name}):*\n`
          gradeInfo.subjects.forEach((subject) => {
            response += `• !اختبار ${subject}\n`
          })
          response += `\n`
        }
      }

      response +=
        `📋 *كيفية إجراء الاختبار:*\n` +
        `*!اختبار* [المادة] [المرحلة]\n\n` +
        `🎯 *أمثلة:*\n` +
        `• !اختبار رياضيات 1\n` +
        `• !اختبار عربية 7\n` +
        `• !اختبار فيزياء sciences\n\n` +
        `🏆 *نظام النقاط:*\n` +
        `• 90%+ = 10 نقاط\n` +
        `• 80-89% = 8 نقاط\n` +
        `• 70-79% = 5 نقاط\n` +
        `• 60-69% = 3 نقاط\n\n` +
        `📊 اكتب *!اختباري* لرؤية نتائجك السابقة`

      return { text: response }
    }

    const subject = args[0]
    const grade = args[1] || (user ? user.grade_level : null)

    if (!grade) {
      return {
        text:
          `❌ يرجى تحديد المرحلة التعليمية\n\n` +
          `الاستخدام: *!اختبار* [المادة] [المرحلة]\n` +
          `مثال: !اختبار رياضيات 1`,
      }
    }

    const quiz = this.contentManager.getQuiz(subject, grade)

    if (!quiz || quiz.length === 0) {
      return {
        text:
          `❌ لا توجد اختبارات متاحة لمادة ${subject} في المرحلة ${grade}\n\n` +
          `💡 الاختبارات المتاحة حالياً:\n` +
          `• رياضيات - المرحلة 1\n` +
          `• عربية - المرحلة 1\n\n` +
          `🔄 سيتم إضافة المزيد من الاختبارات قريباً`,
      }
    }

    // Start quiz session
    const quizSession = {
      subject,
      grade,
      questions: quiz,
      currentQuestion: 0,
      score: 0,
      startTime: Date.now(),
      userAnswers: [],
    }

    // Store quiz session (in a real app, you'd use a proper session store)
    global.quizSessions = global.quizSessions || new Map()
    global.quizSessions.set(userPhone, quizSession)

    return this.sendQuizQuestion(userPhone, quizSession)
  }

  sendQuizQuestion(userPhone, session) {
    const question = session.questions[session.currentQuestion]
    const questionNumber = session.currentQuestion + 1
    const totalQuestions = session.questions.length

    let response = `🧠 *اختبار ${session.subject} - المرحلة ${session.grade}*\n\n`
    response += `❓ *السؤال ${questionNumber}/${totalQuestions}:*\n`
    response += `${question.question}\n\n`

    response += `📝 *الخيارات:*\n`
    question.options.forEach((option, index) => {
      response += `${String.fromCharCode(65 + index)}. ${option}\n`
    })

    response += `\n💡 أرسل حرف الإجابة (A, B, C, أو D)`

    return { text: response }
  }

  async handleQuizAnswer(answer, userPhone) {
    const session = global.quizSessions?.get(userPhone)
    if (!session) {
      return {
        text: `❌ لا يوجد اختبار نشط\n\nاكتب *!اختبار* [المادة] [المرحلة] لبدء اختبار جديد`,
      }
    }

    const question = session.questions[session.currentQuestion]
    const answerIndex = answer.toUpperCase().charCodeAt(0) - 65

    if (answerIndex < 0 || answerIndex >= question.options.length) {
      return {
        text: `❌ إجابة غير صحيحة\n\nيرجى إرسال A, B, C, أو D`,
      }
    }

    // Record answer
    const isCorrect = answerIndex === question.correct
    session.userAnswers.push({
      questionIndex: session.currentQuestion,
      userAnswer: answerIndex,
      isCorrect,
    })

    if (isCorrect) {
      session.score++
    }

    session.currentQuestion++

    // Check if quiz is complete
    if (session.currentQuestion >= session.questions.length) {
      return await this.completeQuiz(userPhone, session)
    } else {
      // Send next question
      let response = isCorrect ? `✅ إجابة صحيحة!\n\n` : `❌ إجابة خاطئة\n💡 ${question.explanation}\n\n`
      const nextQuestion = this.sendQuizQuestion(userPhone, session)
      response += nextQuestion.text
      return { text: response }
    }
  }

  async completeQuiz(userPhone, session) {
    const completionTime = Math.round((Date.now() - session.startTime) / 1000)
    const percentage = Math.round((session.score / session.questions.length) * 100)

    // Save quiz result to database
    await this.db.saveQuizResult(
      userPhone,
      "subject_quiz",
      session.grade,
      session.subject,
      session.score,
      session.questions.length,
      completionTime,
    )

    // Clear session
    global.quizSessions?.delete(userPhone)

    let response = `🎉 *تم إنهاء الاختبار!*\n\n`
    response += `📊 *النتائج:*\n`
    response += `• النتيجة: ${session.score}/${session.questions.length}\n`
    response += `• النسبة المئوية: ${percentage}%\n`
    response += `• الوقت المستغرق: ${Math.floor(completionTime / 60)}:${(completionTime % 60).toString().padStart(2, "0")}\n\n`

    // Performance feedback
    if (percentage >= 90) {
      response += `🏆 *ممتاز!* أداء رائع جداً!\n`
      response += `🎁 حصلت على 10 نقاط`
    } else if (percentage >= 80) {
      response += `🥈 *جيد جداً!* أداء مميز!\n`
      response += `🎁 حصلت على 8 نقاط`
    } else if (percentage >= 70) {
      response += `🥉 *جيد!* يمكنك تحسين أدائك\n`
      response += `🎁 حصلت على 5 نقاط`
    } else if (percentage >= 60) {
      response += `📚 *مقبول* - راجع المادة وحاول مرة أخرى\n`
      response += `🎁 حصلت على 3 نقاط`
    } else {
      response += `📖 *يحتاج تحسين* - راجع المادة جيداً\n`
      response += `💪 لا تستسلم، حاول مرة أخرى!`
    }

    response += `\n\n📝 اكتب *!إحصائياتي* لرؤية تقدمك العام`

    return { text: response }
  }

  async universitiesCommand(args, userPhone) {
    let response = `🏛️ *الجامعات والمعاهد الموريتانية*\n\n`

    response += `🎓 *الجامعات الحكومية:*\n`
    this.contentManager.content.universities.forEach((university, index) => {
      response += `${index + 1}. ${university}\n`
    })

    response += `\n📋 *معلومات مهمة:*\n`
    response += `• شروط القبول تختلف حسب التخصص\n`
    response += `• يتم القبول عبر مسابقة البكالوريا\n`
    response += `• بعض التخصصات تتطلب اختبارات إضافية\n\n`

    response += `🔗 *روابط مفيدة:*\n`
    response += `• موقع وزارة التعليم العالي\n`
    response += `• دليل الطالب الجامعي\n`
    response += `• نظام التسجيل الإلكتروني\n\n`

    response += `💡 اكتب *!المنح* لرؤية المنح الدراسية المتاحة`

    return { text: response }
  }

  async scholarshipsCommand(args, userPhone) {
    let response = `🎓 *المنح الدراسية المتاحة*\n\n`

    response += `🌍 *المنح الخارجية:*\n`
    this.contentManager.content.scholarships.forEach((scholarship, index) => {
      response += `${index + 1}. ${scholarship}\n`
    })

    response += `\n📋 *شروط عامة للمنح:*\n`
    response += `• معدل جيد في البكالوريا\n`
    response += `• إتقان لغة الدراسة\n`
    response += `• شهادة طبية سليمة\n`
    response += `• خطاب دافع قوي\n\n`

    response += `📅 *مواعيد مهمة:*\n`
    response += `• التقديم عادة من يناير إلى مارس\n`
    response += `• النتائج تعلن في مايو-يونيو\n`
    response += `• السفر في سبتمبر-أكتوبر\n\n`

    response += `💡 *نصائح للحصول على منحة:*\n`
    response += `• ابدأ التحضير مبكراً\n`
    response += `• تعلم اللغة المطلوبة\n`
    response += `• اجمع الوثائق المطلوبة\n`
    response += `• اكتب خطاب دافع مقنع\n\n`

    response += `📞 للمزيد من المعلومات، تواصل مع وزارة التعليم العالي`

    return { text: response }
  }

  async competitionsCommand(args, userPhone) {
    let response = `🏆 *المسابقات التعليمية*\n\n`

    response += `📚 *مسابقات التعليم:*\n`
    this.contentManager.content.competitions.forEach((competition, index) => {
      response += `${index + 1}. ${competition}\n`
    })

    response += `\n📅 *التقويم السنوي:*\n`
    response += `• مسابقة دخول الثانوية: مايو\n`
    response += `• البكالوريا: يونيو\n`
    response += `• مسابقات التوظيف: متغيرة\n`
    response += `• المسابقات الثقافية: على مدار السنة\n\n`

    response += `🎯 *نصائح للنجاح:*\n`
    response += `• راجع المنهج كاملاً\n`
    response += `• حل امتحانات السنوات السابقة\n`
    response += `• نظم وقتك جيداً\n`
    response += `• احصل على قسط كافٍ من النوم\n\n`

    response += `📖 اكتب *!اختبار* لتدرب على الامتحانات`

    return { text: response }
  }

  async profileCommand(args, userPhone) {
    const user = await this.db.getUser(userPhone)

    if (!user) {
      return {
        text: `❌ لم يتم العثور على ملفك الشخصي\n\n` + `📝 اكتب *!تسجيل* [الاسم] [المرحلة] لإنشاء ملف شخصي`,
      }
    }

    const gradeInfo = this.contentManager.getGradeInfo(user.grade_level)
    const registrationDate = moment(user.registration_date).format("DD/MM/YYYY")
    const lastActivity = moment(user.last_activity).fromNow()

    let response = `👤 *ملفك الشخصي*\n\n`
    response += `📛 الاسم: ${user.name || "غير محدد"}\n`
    response += `📚 المرحلة: ${gradeInfo ? gradeInfo.name : user.grade_level}\n`
    response += `⭐ النقاط: ${user.points} نقطة\n`
    response += `📅 تاريخ التسجيل: ${registrationDate}\n`
    response += `🕐 آخر نشاط: ${lastActivity}\n`
    response += `💎 العضوية: ${user.is_premium ? "مميزة" : "عادية"}\n\n`

    if (gradeInfo) {
      response += `📖 *المواد المتاحة:*\n`
      gradeInfo.subjects.forEach((subject) => {
        response += `• ${subject}\n`
      })
      response += `\n`
    }

    response += `🎯 *الإجراءات المتاحة:*\n`
    response += `• *!إحصائياتي* - عرض إحصائياتك التفصيلية\n`
    response += `• *!اختباري* - عرض نتائج اختباراتك\n`
    response += `• *!تسجيل* [اسم جديد] [مرحلة جديدة] - تحديث البيانات\n\n`

    response += `💡 احصل على المزيد من النقاط عبر إجراء الاختبارات!`

    return { text: response }
  }

  async statsCommand(args, userPhone) {
    const stats = await this.db.getUserStats(userPhone)

    if (!stats) {
      return {
        text: `❌ لم يتم العثور على إحصائياتك\n\n` + `📝 اكتب *!تسجيل* لإنشاء ملف شخصي أولاً`,
      }
    }

    const { user, quizCount, averageScore, requestCount } = stats
    const gradeInfo = this.contentManager.getGradeInfo(user.grade_level)

    let response = `📊 *إحصائياتك التفصيلية*\n\n`
    response += `👤 *المعلومات الأساسية:*\n`
    response += `• الاسم: ${user.name}\n`
    response += `• المرحلة: ${gradeInfo ? gradeInfo.name : user.grade_level}\n`
    response += `• النقاط الإجمالية: ${user.points}\n\n`

    response += `🧠 *إحصائيات الاختبارات:*\n`
    response += `• عدد الاختبارات: ${quizCount}\n`
    response += `• المعدل العام: ${averageScore}%\n`

    let performance = ""
    if (averageScore >= 90) performance = "🏆 ممتاز"
    else if (averageScore >= 80) performance = "🥈 جيد جداً"
    else if (averageScore >= 70) performance = "🥉 جيد"
    else if (averageScore >= 60) performance = "📚 مقبول"
    else performance = "📖 يحتاج تحسين"

    response += `• مستوى الأداء: ${performance}\n\n`

    response += `📋 *النشاط العام:*\n`
    response += `• طلبات المحتوى: ${requestCount}\n`
    response += `• آخر نشاط: ${moment(user.last_activity).fromNow()}\n\n`

    // Ranking system
    let rank = "مبتدئ"
    if (user.points >= 100) rank = "متقدم"
    if (user.points >= 250) rank = "خبير"
    if (user.points >= 500) rank = "أستاذ"
    if (user.points >= 1000) rank = "عبقري"

    response += `🏅 *رتبتك الحالية:* ${rank}\n\n`

    response += `🎯 *أهداف مقترحة:*\n`
    if (quizCount < 5) response += `• أجرِ 5 اختبارات على الأقل\n`
    if (averageScore < 80) response += `• حسّن معدلك إلى 80% أو أكثر\n`
    if (user.points < 100) response += `• اجمع 100 نقطة\n`

    return { text: response }
  }

  async searchCommand(args, userPhone) {
    if (args.length === 0) {
      return {
        text:
          `🔍 *البحث في المحتوى*\n\n` +
          `الاستخدام: *!بحث* [كلمة البحث]\n\n` +
          `أمثلة:\n` +
          `• !بحث رياضيات\n` +
          `• !بحث جامعة نواكشوط\n` +
          `• !بحث منح تركيا\n` +
          `• !بحث مسابقة البكالوريا`,
      }
    }

    const query = args.join(" ")
    const results = this.contentManager.searchContent(query)

    if (results.length === 0) {
      return {
        text:
          `❌ لم يتم العثور على نتائج لـ "${query}"\n\n` +
          `💡 جرب البحث عن:\n` +
          `• أسماء المواد (رياضيات، عربية، فيزياء)\n` +
          `• أسماء الجامعات\n` +
          `• أنواع المنح\n` +
          `• المسابقات التعليمية`,
      }
    }

    let response = `🔍 *نتائج البحث عن "${query}"*\n\n`

    const groupedResults = {}
    results.forEach((result) => {
      if (!groupedResults[result.type]) {
        groupedResults[result.type] = []
      }
      groupedResults[result.type].push(result)
    })

    if (groupedResults.grade) {
      response += `🎓 *المراحل التعليمية:*\n`
      groupedResults.grade.forEach((result) => {
        response += `• ${result.name}\n`
      })
      response += `\n`
    }

    if (groupedResults.subject) {
      response += `📚 *المواد الدراسية:*\n`
      groupedResults.subject.forEach((result) => {
        response += `• ${result.subject} (${result.grade})\n`
      })
      response += `\n`
    }

    if (groupedResults.university) {
      response += `🏛️ *الجامعات:*\n`
      groupedResults.university.forEach((result) => {
        response += `• ${result.name}\n`
      })
      response += `\n`
    }

    if (groupedResults.scholarship) {
      response += `🎓 *المنح الدراسية:*\n`
      groupedResults.scholarship.forEach((result) => {
        response += `• ${result.name}\n`
      })
      response += `\n`
    }

    response += `💡 *إجراءات مقترحة:*\n`
    response += `• *!الكتب* [المادة] - للحصول على الكتب\n`
    response += `• *!اختبار* [المادة] - لإجراء اختبار\n`
    response += `• *!الجامعات* - لمعلومات الجامعات\n`
    response += `• *!المنح* - لمعلومات المنح`

    return { text: response }
  }

  async tipCommand(args, userPhone) {
    const tip = this.contentManager.getRandomTip()

    return {
      text:
        `${tip}\n\n` +
        `🌟 *نصائح إضافية:*\n` +
        `• استخدم البوت يومياً للمراجعة\n` +
        `• شارك البوت مع زملائك\n` +
        `• اطرح أسئلتك في أي وقت\n\n` +
        `📝 اكتب *!نصيحة* للحصول على نصيحة جديدة`,
    }
  }

  async myQuizzesCommand(args, userPhone) {
    try {
      const quizResults = await this.db.db.all(
        "SELECT * FROM quiz_results WHERE user_phone = ? ORDER BY created_at DESC LIMIT 10",
        [userPhone],
      )

      if (quizResults.length === 0) {
        return {
          text:
            `📊 *نتائج اختباراتك*\n\n` +
            `❌ لم تجرِ أي اختبارات بعد\n\n` +
            `🎯 ابدأ أول اختبار لك:\n` +
            `• *!اختبار* رياضيات 1\n` +
            `• *!اختبار* عربية 1\n\n` +
            `💡 احصل على نقاط من خلال الاختبارات!`,
        }
      }

      let response = `📊 *نتائج اختباراتك الأخيرة*\n\n`

      quizResults.forEach((result, index) => {
        const percentage = Math.round((result.score / result.total_questions) * 100)
        const date = moment(result.created_at).format("DD/MM/YYYY")
        const time = Math.floor(result.completion_time / 60)

        let grade = ""
        if (percentage >= 90) grade = "🏆"
        else if (percentage >= 80) grade = "🥈"
        else if (percentage >= 70) grade = "🥉"
        else if (percentage >= 60) grade = "📚"
        else grade = "📖"

        response += `${index + 1}. ${grade} *${result.subject}* (${this.getGradeName(result.grade_level)})\n`
        response += `   النتيجة: ${result.score}/${result.total_questions} (${percentage}%)\n`
        response += `   التاريخ: ${date} | الوقت: ${time} دقيقة\n\n`
      })

      // Calculate overall stats
      const totalQuizzes = quizResults.length
      const averageScore = Math.round(
        quizResults.reduce((sum, result) => sum + (result.score / result.total_questions) * 100, 0) / totalQuizzes,
      )

      response += `📈 *الإحصائيات العامة:*\n`
      response += `• إجمالي الاختبارات: ${totalQuizzes}\n`
      response += `• المعدل العام: ${averageScore}%\n\n`

      response += `🎯 اكتب *!اختبار* [المادة] لإجراء اختبار جديد`

      return { text: response }
    } catch (error) {
      console.error("خطأ في جلب نتائج الاختبارات:", error)
      return {
        text: "❌ حدث خطأ أثناء جلب نتائج اختباراتك",
      }
    }
  }

  async unknownCommand(command, userPhone) {
    return {
      text:
        `❓ *أمر غير معروف:* ${command}\n\n` +
        `💡 *الأوامر المتاحة:*\n` +
        `• *!المساعدة* - عرض جميع الأوامر\n` +
        `• *!الكتب* - الكتب المدرسية\n` +
        `• *!اختبار* - الاختبارات التفاعلية\n` +
        `• *!الجامعات* - الجامعات الموريتانية\n` +
        `• *!المنح* - المنح الدراسية\n` +
        `• *!بحث* - البحث في المحتوى\n\n` +
        `📝 اكتب *!المساعدة* للحصول على القائمة الكاملة`,
    }
  }

  getGradeName(gradeLevel) {
    const gradeInfo = this.contentManager.getGradeInfo(gradeLevel)
    return gradeInfo ? gradeInfo.name : gradeLevel
  }

  // Admin commands (simplified)
  async adminStatsCommand(args, userPhone) {
    // Check if user is admin (you'd implement proper admin checking)
    const adminNumbers = process.env.ADMIN_NUMBERS?.split(",") || []
    if (!adminNumbers.includes(userPhone)) {
      return { text: "❌ غير مصرح لك بهذا الأمر" }
    }

    try {
      const totalUsers = await this.db.db.get("SELECT COUNT(*) as count FROM users")
      const totalQuizzes = await this.db.db.get("SELECT COUNT(*) as count FROM quiz_results")
      const totalMessages = await this.db.db.get("SELECT COUNT(*) as count FROM message_logs")

      let response = `📊 *إحصائيات البوت العامة*\n\n`
      response += `👥 إجمالي المستخدمين: ${totalUsers.count}\n`
      response += `🧠 إجمالي الاختبارات: ${totalQuizzes.count}\n`
      response += `💬 إجمالي الرسائل: ${totalMessages.count}\n\n`
      response += `📅 تاريخ التقرير: ${moment().format("DD/MM/YYYY HH:mm")}`

      return { text: response }
    } catch (error) {
      return { text: "❌ خطأ في جلب الإحصائيات" }
    }
  }

  async broadcastCommand(args, userPhone) {
    // Check if user is admin
    const adminNumbers = process.env.ADMIN_NUMBERS?.split(",") || []
    if (!adminNumbers.includes(userPhone)) {
      return { text: "❌ غير مصرح لك بهذا الأمر" }
    }

    if (args.length === 0) {
      return {
        text: `📢 *البث العام*\n\nالاستخدام: *!بث* [الرسالة]`,
      }
    }

    const message = args.join(" ")

    // This would be implemented to send to all users
    return {
      text: `✅ تم إرسال الرسالة لجميع المستخدمين:\n\n"${message}"`,
    }
  }
}
