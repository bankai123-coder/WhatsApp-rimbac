import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys"
import qrcode from "qrcode-terminal"
import pino from "pino"
import fs from "fs-extra"
import { DatabaseManager } from "./src/database/DatabaseManager.js"
import { CommandHandler } from "./src/commands/CommandHandler.js"
import { ContentManager } from "./src/content/ContentManager.js"
import { MessageHandler } from "./src/handlers/MessageHandler.js"
import { AuthManager } from "./src/auth/AuthManager.js"
import { GeminiManager } from "./src/ai/GeminiManager.js"

class RimbacWhatsAppBot {
  constructor() {
    this.logger = pino({ level: "silent" })
    this.db = new DatabaseManager()
    this.contentManager = new ContentManager()
    this.geminiManager = new GeminiManager()
    this.commandHandler = new CommandHandler(this.db, this.contentManager, this.geminiManager)
    this.messageHandler = new MessageHandler(this.commandHandler, this.db, this.geminiManager)
    this.authManager = new AuthManager()
    this.sock = null
    this.qrRetries = 0
    this.maxQrRetries = 5
    this.ownerNumber = "22232157828"
    this.version = null
    this.isLatest = null
  }

  async initialize() {
    console.log("🚀 بدء تشغيل بوت RIMBAC للواتساب...")

    // Initialize database
    await this.db.initialize()
    console.log("✅ تم تهيئة قاعدة البيانات")

    await this.geminiManager.initialize()
    console.log("✅ تم تهيئة الذكاء الاصطناعي Gemini")

    // Initialize content
    await this.contentManager.initialize()
    console.log("✅ تم تحميل المحتوى التعليمي")

    // Fetch latest Baileys version
    await this.fetchLatestBaileysVersion()

    // Start WhatsApp connection
    await this.startWhatsApp()
  }

  async fetchLatestBaileysVersion() {
    try {
      const { version, isLatest } = await fetchLatestBaileysVersion()
      this.version = version
      this.isLatest = isLatest
      console.log(`📱 استخدام إصدار واتساب: ${version.join(".")}, الأحدث: ${isLatest}`)
    } catch (error) {
      console.error("❌ خطأ في الحصول على إصدار واتساب الأحدث:", error)
    }
  }

  async startWhatsApp() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState("./auth_info")

      this.sock = makeWASocket({
        version: this.version,
        logger: this.logger,
        printQRInTerminal: false, // سنتعامل مع QR بطريقتنا
        auth: state,
        browser: ["RIMBAC Bot", "Chrome", "120.0.0"],
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 250,
        maxMsgRetryCount: 5,
        transactionOpts: {
          maxCommitRetries: 10,
          delayBetweenTriesMs: 3000,
        },
      })

      // Handle connection updates
      this.sock.ev.on("connection.update", async (update) => {
        await this.handleConnectionUpdate(update, saveCreds)
      })

      // Handle credentials update
      this.sock.ev.on("creds.update", saveCreds)

      // Handle incoming messages
      this.sock.ev.on("messages.upsert", async (m) => {
        await this.messageHandler.handleMessage(m, this.sock)
      })

      // Handle group updates
      this.sock.ev.on("groups.update", async (updates) => {
        for (const update of updates) {
          console.log(`📊 تحديث المجموعة: ${update.id}`)
        }
      })

      // Handle participants update
      this.sock.ev.on("group-participants.update", async (update) => {
        await this.handleGroupParticipantsUpdate(update)
      })
    } catch (error) {
      console.error("❌ خطأ في بدء الاتصال:", error)
      setTimeout(() => this.startWhatsApp(), 5000)
    }
  }

  async handleConnectionUpdate(update, saveCreds) {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      this.qrRetries++
      console.log(`\n📱 QR Code (المحاولة ${this.qrRetries}/${this.maxQrRetries}):\n`)
      qrcode.generate(qr, { small: true })
      console.log("\n🔗 أو استخدم رقم الاقتران بدلاً من QR Code")
      console.log(`💡 للمالك: يمكنك استخدام رقم الاقتران ${this.ownerNumber}`)

      if (this.qrRetries >= this.maxQrRetries) {
        console.log("⚠️ تم الوصول للحد الأقصى من محاولات QR Code")
        console.log("💡 جرب استخدام رقم الاقتران بدلاً من ذلك")
      }
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("🔌 انقطع الاتصال:", lastDisconnect?.error)

      if (shouldReconnect) {
        console.log("🔄 إعادة الاتصال...")
        setTimeout(() => this.startWhatsApp(), 3000)
      } else {
        console.log("🚪 تم تسجيل الخروج، يرجى إعادة المصادقة")
        // Clear auth info
        await fs.remove("./auth_info")
        this.qrRetries = 0
        setTimeout(() => this.startWhatsApp(), 2000)
      }
    } else if (connection === "open") {
      this.qrRetries = 0
      console.log("✅ تم الاتصال بواتساب بنجاح!")
      console.log(`🤖 البوت جاهز للعمل - RIMBAC WhatsApp Bot`)

      // Send startup message to admin
      await this.sendStartupNotification()
    }
  }

  async handleGroupParticipantsUpdate(update) {
    const { id, participants, action } = update

    try {
      const groupMetadata = await this.sock.groupMetadata(id)

      for (const participant of participants) {
        if (action === "add") {
          const welcomeMessage =
            `🎓 أهلاً وسهلاً بك في ${groupMetadata.subject}!\n\n` +
            `📚 هذا البوت يوفر لك:\n` +
            `• الكتب المدرسية لجميع المراحل\n` +
            `• المسابقات التعليمية\n` +
            `• المنح الدراسية\n` +
            `• معلومات الجامعات الموريتانية\n\n` +
            `📝 اكتب *!المساعدة* لرؤية جميع الأوامر المتاحة`

          await this.sock.sendMessage(id, { text: welcomeMessage })
        }
      }
    } catch (error) {
      console.error("خطأ في معالجة تحديث المشاركين:", error)
    }
  }

  async sendStartupNotification() {
    const adminNumbers = [this.ownerNumber, ...(process.env.ADMIN_NUMBERS?.split(",") || [])]

    for (const adminNumber of adminNumbers) {
      try {
        const message =
          `🚀 تم تشغيل بوت RIMBAC بنجاح!\n\n` +
          `⏰ الوقت: ${new Date().toLocaleString("ar-MR")}\n` +
          `📊 الحالة: متصل ويعمل بكامل الطاقة\n` +
          `🤖 الذكاء الاصطناعي: Gemini AI مفعل\n` +
          `🎯 جاهز لخدمة الطلاب الموريتانيين\n\n` +
          `👑 المالك: ${this.ownerNumber}`

        await this.sock.sendMessage(`${adminNumber}@s.whatsapp.net`, { text: message })
      } catch (error) {
        console.error(`خطأ في إرسال إشعار البدء للمشرف ${adminNumber}:`, error)
      }
    }
  }

  async requestPairingCode(phoneNumber) {
    try {
      if (phoneNumber === this.ownerNumber) {
        console.log(`👑 طلب رمز اقتران من المالك: ${phoneNumber}`)
      }

      const code = await this.sock.requestPairingCode(phoneNumber)
      console.log(`🔑 رمز الاقتران لرقم ${phoneNumber}: ${code}`)
      return code
    } catch (error) {
      console.error("خطأ في طلب رمز الاقتران:", error)
      throw error
    }
  }

  isOwner(phoneNumber) {
    return phoneNumber.replace(/\D/g, "") === this.ownerNumber
  }
}

// Start the bot
const bot = new RimbacWhatsAppBot()

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 إيقاف البوت...")
  if (bot.sock) {
    await bot.sock.logout()
  }
  process.exit(0)
})

process.on("uncaughtException", (error) => {
  console.error("❌ خطأ غير متوقع:", error)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ رفض غير معالج:", reason)
})

// Initialize and start
bot.initialize().catch(console.error)

export default bot
