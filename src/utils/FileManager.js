import fs from "fs-extra"
import path from "path"
import axios from "axios"
import sharp from "sharp"
import pdfParse from "pdf-parse"

export class FileManager {
  constructor() {
    this.downloadPath = "./downloads"
    this.tempPath = "./temp"
    this.maxFileSize = 50 * 1024 * 1024 // 50MB
  }

  async initialize() {
    await fs.ensureDir(this.downloadPath)
    await fs.ensureDir(this.tempPath)
    console.log("✅ تم تهيئة مدير الملفات")
  }

  async downloadFile(url, filename) {
    try {
      console.log(`📥 تحميل الملف: ${url}`)

      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
        timeout: 30000,
        maxContentLength: this.maxFileSize,
      })

      const filePath = path.join(this.downloadPath, filename)
      const writer = fs.createWriteStream(filePath)

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`✅ تم تحميل الملف: ${filename}`)
          resolve(filePath)
        })
        writer.on("error", reject)
      })
    } catch (error) {
      console.error(`❌ خطأ في تحميل الملف ${filename}:`, error.message)
      throw error
    }
  }

  async processImage(imagePath, options = {}) {
    try {
      const { width = 800, height = 600, quality = 80, format = "jpeg" } = options

      const outputPath = path.join(this.tempPath, `processed_${Date.now()}.${format}`)

      await sharp(imagePath)
        .resize(width, height, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality })
        .toFile(outputPath)

      console.log(`✅ تم معالجة الصورة: ${outputPath}`)
      return outputPath
    } catch (error) {
      console.error("خطأ في معالجة الصورة:", error)
      throw error
    }
  }

  async extractTextFromPDF(pdfPath) {
    try {
      const dataBuffer = await fs.readFile(pdfPath)
      const data = await pdfParse(dataBuffer)

      console.log(`✅ تم استخراج النص من PDF: ${data.numpages} صفحة`)
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info,
      }
    } catch (error) {
      console.error("خطأ في استخراج النص من PDF:", error)
      throw error
    }
  }

  async createThumbnail(imagePath, size = 150) {
    try {
      const thumbnailPath = path.join(this.tempPath, `thumb_${Date.now()}.jpeg`)

      await sharp(imagePath).resize(size, size, { fit: "cover" }).jpeg({ quality: 70 }).toFile(thumbnailPath)

      return thumbnailPath
    } catch (error) {
      console.error("خطأ في إنشاء الصورة المصغرة:", error)
      throw error
    }
  }

  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath)
      const ext = path.extname(filePath).toLowerCase()

      return {
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        extension: ext,
        type: this.getFileType(ext),
        created: stats.birthtime,
        modified: stats.mtime,
        name: path.basename(filePath),
      }
    } catch (error) {
      console.error("خطأ في الحصول على معلومات الملف:", error)
      return null
    }
  }

  getFileType(extension) {
    const types = {
      ".pdf": "document",
      ".doc": "document",
      ".docx": "document",
      ".txt": "text",
      ".jpg": "image",
      ".jpeg": "image",
      ".png": "image",
      ".gif": "image",
      ".mp4": "video",
      ".mp3": "audio",
      ".wav": "audio",
    }
    return types[extension] || "unknown"
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  async cleanupTempFiles(olderThanHours = 24) {
    try {
      const files = await fs.readdir(this.tempPath)
      const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000

      let deletedCount = 0

      for (const file of files) {
        const filePath = path.join(this.tempPath, file)
        const stats = await fs.stat(filePath)

        if (stats.mtime.getTime() < cutoffTime) {
          await fs.remove(filePath)
          deletedCount++
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 تم حذف ${deletedCount} ملف مؤقت`)
      }
    } catch (error) {
      console.error("خطأ في تنظيف الملفات المؤقتة:", error)
    }
  }

  async compressFile(filePath, compressionLevel = 6) {
    try {
      const ext = path.extname(filePath).toLowerCase()

      if ([".jpg", ".jpeg", ".png"].includes(ext)) {
        return await this.compressImage(filePath, compressionLevel)
      }

      // For other file types, you could implement other compression methods
      return filePath
    } catch (error) {
      console.error("خطأ في ضغط الملف:", error)
      return filePath
    }
  }

  async compressImage(imagePath, quality = 70) {
    try {
      const compressedPath = path.join(this.tempPath, `compressed_${Date.now()}.jpeg`)

      await sharp(imagePath).jpeg({ quality, progressive: true }).toFile(compressedPath)

      const originalSize = (await fs.stat(imagePath)).size
      const compressedSize = (await fs.stat(compressedPath)).size
      const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)

      console.log(`✅ تم ضغط الصورة بنسبة ${savings}%`)
      return compressedPath
    } catch (error) {
      console.error("خطأ في ضغط الصورة:", error)
      throw error
    }
  }
}
