import { GoogleGenerativeAI } from "@google/generative-ai"

export class GeminiManager {
  constructor() {
    this.apiKey = "AIzaSyAWQGW1N3xwceqGYX3QT9RP5KSYoVhFXNs"
    this.genAI = null
    this.model = null
    this.chatSessions = new Map()
  }

  async initialize() {
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey)
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      })

      console.log("✅ تم تهيئة Gemini AI بنجاح")
      return true
    } catch (error) {
      console.error("❌ خطأ في تهيئة Gemini AI:", error)
      return false
    }
  }

  async generateResponse(prompt, userId = null, context = null) {
    try {
      const fullPrompt = `أنت مساعد تعليمي ذكي لموقع RIMBAC (الطالب الموريتاني). 
      تخصصك هو مساعدة الطلاب الموريتانيين في جميع المراحل التعليمية.
      
      قواعد مهمة:
      - أجب باللغة العربية دائماً
      - كن مفيداً ومشجعاً للطلاب
      - قدم معلومات دقيقة وموثوقة
      - ساعد في الواجبات والدروس
      - اشرح المفاهيم بطريقة بسيطة ومفهومة
      
      ${context ? `السياق: ${context}\n` : ""}
      
      السؤال: ${prompt}`

      if (userId && this.chatSessions.has(userId)) {
        // Continue existing chat session
        const chat = this.chatSessions.get(userId)
        const result = await chat.sendMessage(fullPrompt)
        return result.response.text()
      } else {
        // Start new chat session
        const chat = this.model.startChat({
          history: [],
        })

        if (userId) {
          this.chatSessions.set(userId, chat)
        }

        const result = await chat.sendMessage(fullPrompt)
        return result.response.text()
      }
    } catch (error) {
      console.error("خطأ في توليد الرد من Gemini:", error)
      return "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى."
    }
  }

  async analyzeEducationalContent(content, subject = null) {
    try {
      const prompt = `قم بتحليل هذا المحتوى التعليمي وقدم ملخصاً مفيداً:
      
      ${subject ? `المادة: ${subject}\n` : ""}
      
      المحتوى:
      ${content}
      
      يرجى تقديم:
      1. ملخص للنقاط الرئيسية
      2. المفاهيم المهمة
      3. أسئلة للمراجعة
      4. نصائح للدراسة`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error("خطأ في تحليل المحتوى:", error)
      return "عذراً، لم أتمكن من تحليل هذا المحتوى."
    }
  }

  async generateQuiz(topic, difficulty = "متوسط", questionCount = 5) {
    try {
      const prompt = `أنشئ اختباراً تعليمياً حول موضوع: ${topic}
      
      المتطلبات:
      - المستوى: ${difficulty}
      - عدد الأسئلة: ${questionCount}
      - نوع الأسئلة: اختيار من متعدد
      - باللغة العربية
      
      تنسيق الإجابة:
      السؤال 1: [نص السؤال]
      أ) [خيار 1]
      ب) [خيار 2]
      ج) [خيار 3]
      د) [خيار 4]
      الإجابة الصحيحة: [الحرف]
      
      كرر هذا التنسيق لجميع الأسئلة.`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error("خطأ في إنشاء الاختبار:", error)
      return "عذراً، لم أتمكن من إنشاء الاختبار."
    }
  }

  async explainConcept(concept, level = "ثانوي") {
    try {
      const prompt = `اشرح هذا المفهوم بطريقة بسيطة ومفهومة للطلاب:
      
      المفهوم: ${concept}
      المستوى التعليمي: ${level}
      
      يرجى تقديم:
      1. تعريف واضح
      2. أمثلة عملية
      3. تطبيقات في الحياة اليومية
      4. نصائح لفهم المفهوم بشكل أفضل
      
      استخدم لغة بسيطة ومناسبة للمستوى التعليمي المحدد.`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error("خطأ في شرح المفهوم:", error)
      return "عذراً، لم أتمكن من شرح هذا المفهوم."
    }
  }

  clearChatSession(userId) {
    if (this.chatSessions.has(userId)) {
      this.chatSessions.delete(userId)
      return true
    }
    return false
  }

  getChatSessionsCount() {
    return this.chatSessions.size
  }
}
