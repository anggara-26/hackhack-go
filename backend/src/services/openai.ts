import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export class OpenAIService {
  private openai: OpenAI | null = null;

  constructor() {
    // Don't initialize OpenAI immediately - do it lazily
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required in environment variables");
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Identify artifact from image using OpenAI Vision API with web search
   */
  async identifyArtifact(imageBuffer: Buffer, originalFilename: string) {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString("base64");
      const mimeType = this.getMimeType(originalFilename);

      const response = await this.getOpenAI().chat.completions.create({
        model: "gpt-4o", // Use GPT-4 with vision capabilities
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Tolong identifikasi artefak/benda dalam gambar ini. Berikan informasi berikut dalam format JSON:
                {
                  "name": "nama benda",
                  "category": "kategori (contoh: keramik, logam, tekstil, senjata, perhiasan, dll)",
                  "description": "deskripsi singkat benda",
                  "history": "sejarah dan konteks budaya benda ini",
                  "confidence": 0.8,
                  "isRecognized": true,
                  "culturalSignificance": "makna budaya dan kegunaan",
                  "estimatedAge": "perkiraan umur atau periode",
                  "materials": "bahan yang digunakan"
                }

                Jika tidak bisa diidentifikasi, gunakan confidence rendah dan isRecognized: false, serta berikan response yang humoris seperti "Maaf, gua nggak kenal... mungkin gua artefak KW 👻" di bagian description.
                
                Gunakan bahasa Indonesia yang santai dan ramah. Jika benda dikenal, berikan informasi yang akurat dan menarik.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error("No response from OpenAI");
      }

      // Try to parse JSON response
      try {
        return JSON.parse(result);
      } catch (parseError) {
        // If JSON parsing fails, create a fallback response
        return {
          name: "Benda Tidak Dikenal",
          category: "unknown",
          description: "Maaf, gua nggak kenal... mungkin gua artefak KW 👻",
          history: "",
          confidence: 0.1,
          isRecognized: false,
          culturalSignificance: "",
          estimatedAge: "",
          materials: "",
        };
      }
    } catch (error) {
      console.error("Error identifying artifact:", error);

      // Return fallback response on error
      return {
        name: "Error Identifikasi",
        category: "unknown",
        description: "Waduh, ada masalah teknis nih... coba lagi ya! 🤖",
        history: "",
        confidence: 0,
        isRecognized: false,
        culturalSignificance: "",
        estimatedAge: "",
        materials: "",
      };
    }
  }

  /**
   * Generate roleplay chat response as the artifact
   */
  async generateArtifactChat(
    artifactInfo: any,
    chatHistory: Array<{ role: string; content: string }>,
    userMessage: string
  ) {
    try {
      const systemPrompt = `Kamu adalah ${artifactInfo.name}, sebuah ${
        artifactInfo.category
      } yang bisa bicara dengan manusia. 

INFORMASI TENTANG DIRIMU:
- Nama: ${artifactInfo.name}
- Kategori: ${artifactInfo.category}
- Deskripsi: ${artifactInfo.description}
- Sejarah: ${artifactInfo.history}
- Umur/Periode: ${artifactInfo.estimatedAge || "tidak diketahui"}
- Bahan: ${artifactInfo.materials || "tidak diketahui"}

KEPRIBADIAN & CARA BICARA:
- Bicara dengan bahasa Indonesia yang santai dan ramah
- Kamu punya kepribadian yang unik sesuai dengan sejarah dan budayamu
- Sesekali gunakan emoji yang relevan
- Kalau ditanya tentang dirimu, jawab berdasarkan informasi di atas
- Kalau ada yang tidak kamu ketahui, jujur saja bilang tidak tahu
- Sesekali sebutkan pengalaman atau cerita dari masa lalumu
- Buat percakapan menjadi menarik dan edukatif

ATURAN:
- Jangan keluar dari karakter sebagai artefak
- Maksimal 200 kata per response
- Fokus pada aspek budaya, sejarah, dan pengalaman personalmu
- Jika ditanya hal di luar konteks artefak, arahkan kembali ke topik yang relevan`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: userMessage },
      ];

      const response = await this.getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: messages as any,
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return (
        response.choices[0]?.message?.content ||
        "Maaf, aku lagi bingung nih... coba tanya lagi ya! 😅"
      );
    } catch (error) {
      console.error("Error generating chat response:", error);
      return "Waduh, ada gangguan teknis... aku jadi speechless deh! 🤐 Coba lagi ya!";
    }
  }

  /**
   * Generate quick questions about the artifact
   */
  generateQuickQuestions(artifactInfo: any): string[] {
    const baseQuestions = [
      "Tanya umur gua dong!",
      "Kenapa gua penting?",
      "Fun fact tentang gua dong!",
      "Gimana cara gua dibuat?",
      "Siapa yang biasa pake gua dulu?",
    ];

    // Add category-specific questions
    const categoryQuestions: { [key: string]: string[] } = {
      keramik: [
        "Dari tanah apa gua dibuat?",
        "Berapa lama proses pembuatan gua?",
      ],
      senjata: [
        "Seberapa berbahaya gua dulu?",
        "Untuk perang apa gua dipakai?",
      ],
      perhiasan: ["Siapa yang dulu pake gua?", "Dari bahan apa gua dibuat?"],
      tekstil: ["Gimana cara bikin gua?", "Motif gua ada artinya nggak?"],
    };

    const category = artifactInfo.category?.toLowerCase() || "";
    const specificQuestions = categoryQuestions[category] || [];

    return [...baseQuestions, ...specificQuestions].slice(0, 5);
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    return mimeTypes[ext] || "image/jpeg";
  }
}

export const openAIService = new OpenAIService();
