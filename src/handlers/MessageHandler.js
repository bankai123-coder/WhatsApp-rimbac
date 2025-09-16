import moment from "moment"

export class MessageHandler {
  constructor(commandHandler, db, geminiManager) {
    this.commandHandler = commandHandler
    this.db = db
    this.geminiManager = geminiManager
    this.userSessions = new Map()
    this.ownerNumber = "22232157828"
  }

  async handleMessage(m, sock) {
    try {
      const message = m.messages[0]
      if (!message || message.key.fromMe) return

      const messageType = Object.keys(message.message || {})[0]
      if (!["conversation", "extendedTextMessage"].includes(messageType)) return

      const text = message.message.conversation || message.message.extendedTextMessage?.text || ""

      const userPhone = message.key.remoteJid.replace("@s.whatsapp.net", "")
      const isGroup = message.key.remoteJid.includes("@g.us")

      // Skip if empty message
      if (!text.trim()) return

      console.log(`📨 رسالة من ${userPhone}: ${text}`)

      // Handle quiz answers first
      if (this.isQuizAnswer(text) && global.quizSessions?.has(userPhone)) {
        const response = await this.commandHandler.handleQuizAnswer(text.trim(), userPhone)
        await this.sendResponse(sock, message.key.remoteJid, response)
        return
      }

      // Handle commands
      if (text.startsWith("!") || text.startsWith("/")) {
        await this.handleCommand(text, userPhone, sock, message, isGroup)
        return
      }

      // Handle natural language queries with AI
      await this.handleNaturalLanguageWithAI(text, userPhone, sock, message, isGroup)
    } catch (error) {
      console.error("خطأ في معالجة الرسالة:", error)
    }
  }

  async handleCommand(text, userPhone, sock, message, isGroup) {
    const parts = text.slice(1).trim().split(/\s+/)
    const command = parts[0]
    const args = parts.slice(1)

    const messageInfo = {
      isGroup,
      groupId: isGroup ? message.key.remoteJid : null,
      timestamp: message.messageTimestamp,
    }

    const response = await this.commandHandler.handleCommand(command, args, userPhone, sock, messageInfo)

    await this.sendResponse(sock, message.key.remoteJid, response)
  }

  async handleNaturalLanguageWithAI(text, userPhone, sock, message, isGroup) {
    const lowerText = text.toLowerCase()

    // Common greetings
    if (this.isGreeting(lowerText)) {
      const response = await this.handleGreeting(userPhone)
      await this.sendResponse(sock, message.key.remoteJid, response)
      return
    }

    // Educational queries with AI enhancement
    if (this.isEducationalQuery(lowerText)) {
      const response = await this.handleEducationalQueryWithAI(text, userPhone)
      await this.sendResponse(sock, message.key.remoteJid, response)
      return
    }

    // Help requests
    if (this.isHelpRequest(lowerText)) {
      const response = await this.commandHandler.helpCommand([], userPhone)
      await this.sendResponse(sock, message.key.remoteJid, response)
      return
    }

    // Math problems detection
    if (this.isMathProblem(text)) {
      const response = await this.handleMathProblem(text, userPhone)
      await this.sendResponse(sock, message.key.remoteJid, response)
      return
    }

    // Question detection
    if (this.isQuestion(text)) {
      const response = await this.handleQuestionWithAI(text, userPhone)
      await this.sendResponse(sock, message.key.remoteJid, response)
      return
    }

    // Default AI response for unrecognized messages (only in private chats)
    if (!isGroup) {
      const response = await this.handleUnrecognizedMessageWithAI(text, userPhone)
      await this.sendResponse(sock, message.key.remoteJid, response)
    }
  }

  async handleEducationalQueryWithAI(text, userPhone) {
    try {
      const user = await this.db.getUser(userPhone)
      const context = user ? `الطالب في ${this.commandHandler.getGradeName(user.grade_level)}` : null

      // Use AI to provide intelligent educational responses
      const aiResponse = await this.geminiManager.generateResponse(text, userPhone, context)

      return {
        text: `🤖 *مساعد تعليمي ذكي*\n\n${aiResponse}\n\n💡 يمكنك أيضاً استخدام الأوامر:\n• *!اسأل* [سؤالك] - للأسئلة المباشرة\n• *!اشرح* [المفهوم] - لشرح المفاهيم\n• *!المساعدة* - لرؤية جميع الأوامر`,
      }
    } catch (error) {
      return await this.handleEducationalQuery(text.toLowerCase(), userPhone)
    }
  }

  async handleQuestionWithAI(text, userPhone) {
    try {
      const user = await this.db.getUser(userPhone)
      const context = user ? `الطالب في ${this.commandHandler.getGradeName(user.grade_level)}` : null

      const aiResponse = await this.geminiManager.generateResponse(text, userPhone, context)

      return {
        text: `🤖 *إجابة ذكية*\n\n${aiResponse}\n\n💡 لمزيد من الأسئلة، اكتب *!اسأل* [سؤالك]`,
      }
    } catch (error) {
      return await this.handleUnrecognizedMessage(text.toLowerCase(), userPhone)
    }
  }

  async handleMathProblem(text, userPhone) {
    try {
      const user = await this.db.getUser(userPhone)
      const context = `حل هذه المسألة الرياضية خطوة بخطوة مع الشرح التفصيلي. ${user ? `الطالب في ${this.commandHandler.getGradeName(user.grade_level)}` : ""}`

      const solution = await this.geminiManager.generateResponse(text, userPhone, context)

      return {
        text: `🔢 *حل المسألة الرياضية*\n\n**المسألة:** ${text}\n\n**الحل:**\n${solution}\n\n💡 لحل مسائل أخرى، اكتب *!حل* [المسألة]`,
      }
    } catch (error) {
      return {
        text: `🔢 *مسألة رياضية*\n\nلحل المسائل الرياضية، استخدم:\n*!حل* [المسألة]\n\nمثال: !حل 2x + 5 = 15`,
      }
    }
  }

  async handleUnrecognizedMessageWithAI(text, userPhone) {
    try {
      // Use AI to understand and respond to unrecognized messages
      const context =
        "المستخدم يرسل رسالة غير واضحة في بوت تعليمي موريتاني. ساعده في فهم كيفية استخدام البوت وقدم له اقتراحات مفيدة."
      const aiResponse = await this.geminiManager.generateResponse(text, userPhone, context)

      return {
        text: `🤖 *مساعد ذكي*\n\n${aiResponse}\n\n📝 اكتب *!المساعدة* لرؤية جميع الأوامر المتاحة`,
      }
    } catch (error) {
      return await this.handleUnrecognizedMessage(text.toLowerCase(), userPhone)
    }
  }

  isQuizAnswer(text) {
    const trimmed = text.trim().toUpperCase()
    return ["A", "B", "C", "D"].includes(trimmed)
  }

  isGreeting(text) {
    const greetings = [
      "سلام",
      "مرحبا",
      "أهلا",
      "هلا",
      "صباح",
      "مساء",
      "hello",
      "hi",
      "hey",
      "good morning",
      "good evening",
    ]
    return greetings.some((greeting) => text.includes(greeting))
  }

  isEducationalQuery(text) {
    const educationalKeywords = [
      "كتاب",
      "كتب",
      "مادة",
      "مواد",
      "درس",
      "دروس",
      "اختبار",
      "امتحان",
      "جامعة",
      "جامعات",
      "منحة",
      "منح",
      "مسابقة",
      "مسابقات",
      "رياضيات",
      "عربية",
      "فرنسية",
      "انجليزية",
      "فيزياء",
      "كيمياء",
      "تاريخ",
      "جغرافيا",
      "علوم",
      "book",
      "books",
      "subject",
      "test",
      "exam",
      "university",
      "scholarship",
    ]
    return educationalKeywords.some((keyword) => text.includes(keyword))
  }

  isHelpRequest(text) {
    const helpKeywords = ["مساعدة", "ساعدني", "كيف", "ماذا", "أريد", "أحتاج", "help", "how", "what", "need", "want"]
    return helpKeywords.some((keyword) => text.includes(keyword))
  }

  isMathProblem(text) {
    // Detect mathematical expressions and problems
    const mathPatterns = [
      /\d+\s*[+\-*/]\s*\d+/, // Basic arithmetic
      /\d+x\s*[+-]\s*\d+/, // Linear equations
      /x\s*[+-]\s*\d+\s*=\s*\d+/, // Equations
      /\d+\s*=\s*\d+/, // Equations
      /مساحة|حجم|محيط/, // Geometry terms
      /جذر|أس|قوة/, // Mathematical terms
    ]
    return mathPatterns.some((pattern) => pattern.test(text))
  }

  isQuestion(text) {
    const questionIndicators = [
      "؟",
      "ما هو",
      "ما هي",
      "كيف",
      "متى",
      "أين",
      "لماذا",
      "من",
      "what",
      "how",
      "when",
      "where",
      "why",
      "who",
    ]
    return questionIndicators.some((indicator) => text.includes(indicator))
  }

  isOwner(phoneNumber) {
    return phoneNumber.replace(/\D/g, "") === this.ownerNumber
  }

  async handleGreeting(userPhone) {
    const user = await this.db.getUser(userPhone)
    const timeOfDay = this.getTimeOfDay()
    const isOwner = this.isOwner(userPhone)

    let greeting = `${timeOfDay} وأهلاً وسهلاً بك! 🌟\n\n`

    if (isOwner) {
      greeting += `👑 *أهلاً بالمالك!*\n`
      greeting += `🤖 البوت يعمل بكامل الطاقة\n`
      greeting += `🧠 Gemini AI متصل ونشط\n\n`
    }

    if (user && user.name) {
      greeting += `👋 مرحباً ${user.name}!\n`
      const gradeInfo = this.commandHandler.contentManager.getGradeInfo(user.grade_level)
      if (gradeInfo) {
        greeting += `📚 مرحلتك: ${gradeInfo.name}\n`
      }
      greeting += `⭐ نقاطك: ${user.points} نقطة\n\n`
    }

    greeting +=
      `🤖 أنا بوت RIMBAC، مساعدك التعليمي الذكي\n\n` +
      `💡 يمكنني مساعدتك في:\n` +
      `• الحصول على الكتب المدرسية\n` +
      `• إجراء اختبارات تفاعلية\n` +
      `• معلومات الجامعات والمنح\n` +
      `• البحث في المحتوى التعليمي\n` +
      `• الإجابة على أسئلتك بالذكاء الاصطناعي\n\n` +
      `📝 اكتب *!المساعدة* لرؤية جميع الأوامر`

    return { text: greeting }
  }

  async handleEducationalQuery(text, userPhone) {
    // Simple keyword matching for educational queries
    if (text.includes("كتاب") || text.includes("كتب") || text.includes("book")) {
      return {
        text:
          `📚 *الكتب المدرسية*\n\n` +
          `للحصول على الكتب، استخدم:\n` +
          `*!الكتب* - لرؤية جميع الكتب المتاحة\n` +
          `*!الكتب* [المادة] [المرحلة] - لكتاب محدد\n\n` +
          `مثال: !الكتب رياضيات 1`,
      }
    }

    if (text.includes("اختبار") || text.includes("امتحان") || text.includes("test")) {
      return {
        text:
          `🧠 *الاختبارات التفاعلية*\n\n` +
          `لإجراء اختبار، استخدم:\n` +
          `*!اختبار* [المادة] [المرحلة]\n\n` +
          `مثال: !اختبار رياضيات 1\n\n` +
          `🏆 احصل على نقاط من خلال الاختبارات!`,
      }
    }

    if (text.includes("جامعة") || text.includes("جامعات") || text.includes("university")) {
      return {
        text:
          `🏛️ *الجامعات الموريتانية*\n\n` +
          `للحصول على معلومات الجامعات:\n` +
          `*!الجامعات* - قائمة الجامعات\n\n` +
          `💡 يمكنك أيضاً معرفة المنح المتاحة بكتابة *!المنح*`,
      }
    }

    if (text.includes("منحة") || text.includes("منح") || text.includes("scholarship")) {
      return {
        text:
          `🎓 *المنح الدراسية*\n\n` +
          `للحصول على معلومات المنح:\n` +
          `*!المنح* - قائمة المنح المتاحة\n\n` +
          `📅 معظم المنح تفتح للتقديم من يناير إلى مارس`,
      }
    }

    // Default educational response
    return {
      text:
        `📚 *استفسار تعليمي*\n\n` +
        `يمكنني مساعدتك في:\n` +
        `• *!الكتب* - الكتب المدرسية\n` +
        `• *!اختبار* - الاختبارات التفاعلية\n` +
        `• *!الجامعات* - معلومات الجامعات\n` +
        `• *!المنح* - المنح الدراسية\n` +
        `• *!بحث* [كلمة البحث] - البحث في المحتوى\n\n` +
        `📝 اكتب *!المساعدة* للحصول على القائمة الكاملة`,
    }
  }

  async handleUnrecognizedMessage(text, userPhone) {
    const suggestions = [
      `💡 *لم أفهم طلبك تماماً*\n\n`,
      `جرب استخدام الأوامر التالية:\n`,
      `• *!المساعدة* - لرؤية جميع الأوامر\n`,
      `• *!الكتب* - للكتب المدرسية\n`,
      `• *!اختبار* - للاختبارات التفاعلية\n`,
      `• *!اسأل* [سؤالك] - لسؤال الذكاء الاصطناعي\n`,
      `• *!بحث* [كلمة البحث] - للبحث\n\n`,
      `📝 أو اكتب سؤالك بوضوح أكثر`,
    ].join("")

    return { text: suggestions }
  }

  getTimeOfDay() {
    const hour = moment().hour()
    if (hour < 12) return "صباح الخير"
    else if (hour < 18) return "مساء الخير"
    else return "مساء الخير"
  }

  async sendResponse(sock, chatId, response) {
    try {
      if (response.text) {
        await sock.sendMessage(chatId, { text: response.text })
      }

      if (response.image) {
        await sock.sendMessage(chatId, {
          image: response.image,
          caption: response.caption || "",
        })
      }

      if (response.document) {
        await sock.sendMessage(chatId, {
          document: response.document,
          fileName: response.fileName,
          mimetype: response.mimetype,
        })
      }
    } catch (error) {
      console.error("خطأ في إرسال الرد:", error)
    }
  }
}
