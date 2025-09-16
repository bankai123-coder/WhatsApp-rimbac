import fs from "fs-extra"
import qrcode from "qrcode-terminal"

export class AuthManager {
  constructor() {
    this.authPath = "./auth_info"
    this.pairingCodes = new Map()
  }

  async clearAuthInfo() {
    try {
      await fs.remove(this.authPath)
      console.log("✅ تم مسح معلومات المصادقة")
    } catch (error) {
      console.error("خطأ في مسح معلومات المصادقة:", error)
    }
  }

  async isAuthenticated() {
    try {
      const exists = await fs.pathExists(this.authPath)
      return exists
    } catch (error) {
      return false
    }
  }

  generateQRCode(qr) {
    console.log("\n📱 امسح رمز QR التالي بواتساب:\n")
    qrcode.generate(qr, { small: true })
    console.log("\n🔗 أو استخدم رقم الاقتران بدلاً من QR Code")
  }

  async requestPairingCode(phoneNumber, sock) {
    try {
      // Validate phone number format
      const cleanNumber = phoneNumber.replace(/[^\d]/g, "")
      if (cleanNumber.length < 8) {
        throw new Error("رقم الهاتف غير صحيح")
      }

      console.log(`📞 طلب رمز الاقتران لرقم: ${phoneNumber}`)

      const code = await sock.requestPairingCode(cleanNumber)

      console.log(`\n🔑 رمز الاقتران: ${code}`)
      console.log("📱 أدخل هذا الرمز في واتساب > الأجهزة المرتبطة > ربط جهاز")

      // Store pairing code temporarily
      this.pairingCodes.set(phoneNumber, {
        code,
        timestamp: Date.now(),
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      })

      return code
    } catch (error) {
      console.error("خطأ في طلب رمز الاقتران:", error)
      throw error
    }
  }

  getPairingCode(phoneNumber) {
    const pairingInfo = this.pairingCodes.get(phoneNumber)

    if (!pairingInfo) {
      return null
    }

    if (Date.now() > pairingInfo.expires) {
      this.pairingCodes.delete(phoneNumber)
      return null
    }

    return pairingInfo.code
  }

  cleanupExpiredCodes() {
    const now = Date.now()
    for (const [phoneNumber, info] of this.pairingCodes.entries()) {
      if (now > info.expires) {
        this.pairingCodes.delete(phoneNumber)
      }
    }
  }

  // Advanced authentication features
  async backupAuthInfo(backupPath = "./auth_backup") {
    try {
      if (await fs.pathExists(this.authPath)) {
        await fs.copy(this.authPath, backupPath)
        console.log(`✅ تم نسخ معلومات المصادقة إلى ${backupPath}`)
        return true
      }
      return false
    } catch (error) {
      console.error("خطأ في نسخ معلومات المصادقة:", error)
      return false
    }
  }

  async restoreAuthInfo(backupPath = "./auth_backup") {
    try {
      if (await fs.pathExists(backupPath)) {
        await fs.copy(backupPath, this.authPath)
        console.log(`✅ تم استعادة معلومات المصادقة من ${backupPath}`)
        return true
      }
      return false
    } catch (error) {
      console.error("خطأ في استعادة معلومات المصادقة:", error)
      return false
    }
  }

  async getAuthStatus() {
    try {
      const isAuth = await this.isAuthenticated()
      const authFiles = await fs.readdir(this.authPath).catch(() => [])

      return {
        authenticated: isAuth,
        filesCount: authFiles.length,
        lastModified: isAuth ? (await fs.stat(this.authPath)).mtime : null,
      }
    } catch (error) {
      return {
        authenticated: false,
        filesCount: 0,
        lastModified: null,
        error: error.message,
      }
    }
  }
}
