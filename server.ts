import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// --- TELEGRAM BOT LOGIC ---
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is missing in environment variables.");
} else {
  const bot = new Telegraf(BOT_TOKEN);

  // Initial State Management (Simple session mockup)
  const userStates: Record<number, string> = {};

  // Keyboards
  const mainMenu = Markup.keyboard([
    ["🪑 Mebellar", "🛒 Mebel buyurtma"],
    ["🔧 Ta'mirlash", "📞 Bog'lanish"],
    ["📍 Lokatsiya"]
  ]).resize();

  const furnitureMenu = Markup.keyboard([
    ["Stol", "Stul"],
    ["Shkaf", "Divan"],
    ["⬅️ Orqaga"]
  ]).resize();

  // /start
  bot.start((ctx) => {
    delete userStates[ctx.from.id];
    return ctx.reply(
      "👋 Xush kelibsiz!\nSifatli mebellar do‘koniga xush kelibsiz.",
      mainMenu
    );
  });

  // Messages handling
  bot.on(message("text"), async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;

    if (text === "🪑 Mebellar") {
      return ctx.reply("🪑 Mebellarimizni tanlang:", furnitureMenu);
    }

    if (text === "⬅️ Orqaga") {
      delete userStates[userId];
      return ctx.reply("Asosiy menyuga qaytdik.", mainMenu);
    }

    if (text === "📞 Bog'lanish") {
      return ctx.reply(
        "📞 Telefon raqamingizni yuboring:",
        Markup.keyboard([
          Markup.button.contactRequest("📞 Telefon raqam yuborish"),
          ["⬅️ Orqaga"]
        ]).resize()
      );
    }

    if (text === "📍 Lokatsiya") {
      return ctx.reply(
        "📍 Yetkazib berish uchun lokatsiyani yuboring:",
        Markup.keyboard([
          Markup.button.locationRequest("📍 Lokatsiyani yuborish"),
          ["⬅️ Orqaga"]
        ]).resize()
      );
    }

    if (text === "🛒 Mebel buyurtma") {
      userStates[userId] = "ORDER";
      return ctx.reply("🛒 Nima mebel kerak?\nMasalan: stol, divan, shkaf yozing.");
    }

    if (text === "🔧 Ta'mirlash") {
      userStates[userId] = "REPAIR";
      return ctx.reply(
        "🔧 Ta'mirlash xizmati\n\nEski mebellarni ta'mirlaymiz:\n" +
        "🪑 Stul\n🛋 Divan\n🚪 Shkaf\n🪵 Stol\n\nIltimos, muammo haqida yozing."
      );
    }

    // Furniture Info
    const furnitureData: Record<string, string> = {
      "Stol": "🪵 Stol\n- Material: Eman\n- Sifat: Premium\n- Kafolat: 2 yil\n- Narx: 500,000 so'm",
      "Stul": "🪑 Stul\n- Material: Metall + yog‘och\n- Sifat: Kuchli\n- Kafolat: 1 yil\n- Narx: 150,000 so'm",
      "Shkaf": "🚪 Shkaf\n- Material: MDF\n- Sifat: Zamonaviy\n- Kafolat: 2 yil\n- Narx: buyurtma asosida",
      "Divan": "🛋 Divan\n- Material: Yumshoq\n- Sifat: Komfort premium\n- Kafolat: 2 yil\n- Narx: 2,000,000 so'm"
    };

    if (furnitureData[text]) {
      return ctx.reply(furnitureData[text]);
    }

    // States logic
    if (userStates[userId] === "ORDER") {
      let msg = "✅ Buyurtma qabul qilindi!";
      if (text.toLowerCase().includes("stol")) msg = "🪵 Stol buyurtma qabul qilindi!";
      else if (text.toLowerCase().includes("stul")) msg = "🪑 Stul buyurtma qabul qilindi!";
      else if (text.toLowerCase().includes("shkaf")) msg = "🚪 Shkaf buyurtma qabul qilindi!";
      else if (text.toLowerCase().includes("divan")) msg = "🛋 Divan buyurtma qabul qilindi!";

      delete userStates[userId];
      return ctx.reply(msg + "\n📞 Tez orada bog‘lanamiz.", mainMenu);
    }

    if (userStates[userId] === "REPAIR") {
      delete userStates[userId];
      return ctx.reply(
        "🔧 Ta'mirlash so‘rovi qabul qilindi!\nUsta tez orada bog‘lanadi 📞",
        mainMenu
      );
    }

    return ctx.reply("⚠️ Iltimos menyudan foydalaning.");
  });

  // Handle Contact
  bot.on(message("contact"), (ctx) => {
    const phone = ctx.message.contact.phone_number;
    return ctx.reply(
      `📞 Raqam qabul qilindi: ${phone}\nTez orada siz bilan bog‘lanamiz ✅`,
      mainMenu
    );
  });

  // Handle Location
  bot.on(message("location"), (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    return ctx.reply(
      `📍 Lokatsiya qabul qilindi!\nLatitude: ${latitude}\nLongitude: ${longitude}\n🚚 Tez orada yetkazib beramiz!`,
      mainMenu
    );
  });

  bot.launch().then(() => {
    console.log("🤖 Telegram bot ishga tushdi!");
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// --- EXPRESS SERVER LOGIC ---
async function startServer() {
  // Static API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", bot: BOT_TOKEN ? "connected" : "missing_token" });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
