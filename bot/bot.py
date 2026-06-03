"""
KhaylimTech Ventures — Telegram Bot
Manage products on the website from Telegram.

Commands:
  /add       - Add a new product (guided)
  /delete    - Delete a product
  /update    - Update a product's price or stock
  /list      - List all products
  /stock     - Toggle in/out of stock
  /help      - Show all commands
"""

import os
import json
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, CommandHandler, MessageHandler,
    ConversationHandler, CallbackQueryHandler, ContextTypes, filters
)
import firebase_admin
from firebase_admin import credentials, firestore

# ─── Logging ────────────────────────────────────────────
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ─── Config ─────────────────────────────────────────────
BOT_TOKEN     = os.getenv("BOT_TOKEN")       # Set in Railway environment variables
ADMIN_CHAT_ID = int(os.getenv("ADMIN_ID", "0"))  # Your Telegram user ID

# ─── Firebase Init ───────────────────────────────────────
# Loads from FIREBASE_KEY_JSON env var (Railway) or local file (development)
firebase_key_json = os.getenv("FIREBASE_KEY_JSON")
if firebase_key_json:
    cred = credentials.Certificate(json.loads(firebase_key_json))
else:
    # Local development — place firebase-key.json in bot/ folder
    import os as _os
    key_path = _os.path.join(_os.path.dirname(__file__), "firebase-key.json")
    cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)
db = firestore.client()
COLLECTION = "products"

# ─── Conversation states ─────────────────────────────────
(
    ADD_NAME, ADD_CATEGORY, ADD_PRICE, ADD_OLD_PRICE,
    ADD_DESCRIPTION, ADD_IMAGE, ADD_CONFIRM,
    UPDATE_FIELD, UPDATE_VALUE,
) = range(9)

CATEGORIES = {
    "1": "phones",
    "2": "laptops",
    "3": "gaming",
    "4": "accessories",
}

# ─── Auth guard ─────────────────────────────────────────
def admin_only(func):
    async def wrapper(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        if update.effective_user.id != ADMIN_CHAT_ID:
            await update.message.reply_text("⛔ Unauthorized. Only the store admin can use this bot.")
            return ConversationHandler.END
        return await func(update, ctx)
    return wrapper


# ════════════════════════════════════════
#  /help  and  /start
# ════════════════════════════════════════
@admin_only
async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Welcome to *KhaylimTech Ventures* Admin Bot!\n\n"
        "Use these commands to manage your store:\n\n"
        "📦 `/add` — Add a new product\n"
        "🗑️ `/delete` — Remove a product\n"
        "✏️ `/update` — Update price or stock\n"
        "📋 `/list` — View all products\n"
        "🔄 `/stock` — Toggle in/out of stock\n"
        "❓ `/help` — Show this message",
        parse_mode="Markdown"
    )

help_handler = CommandHandler(["start", "help"], start)


# ════════════════════════════════════════
#  /list — Show all products
# ════════════════════════════════════════
@admin_only
async def list_products(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    docs = db.collection(COLLECTION).stream()
    products = [doc.to_dict() | {"id": doc.id} for doc in docs]

    if not products:
        await update.message.reply_text("📭 No products in the database yet. Use /add to add one!")
        return

    # Group by category
    grouped = {}
    for p in products:
        cat = p.get("category", "other")
        grouped.setdefault(cat, []).append(p)

    cat_emoji = {"phones": "📱", "laptops": "💻", "gaming": "🎮", "accessories": "🔌"}
    lines = []
    for cat, items in grouped.items():
        lines.append(f"\n{cat_emoji.get(cat,'📦')} *{cat.upper()}*")
        for p in items:
            stock = "✅" if p.get("inStock", True) else "❌"
            lines.append(f"  {stock} `{p['id']}` — {p['name']} — ₦{p['price']:,}")

    await update.message.reply_text(
        f"🛍️ *KhaylimTech Products ({len(products)} total)*\n" + "\n".join(lines),
        parse_mode="Markdown"
    )


# ════════════════════════════════════════
#  /add — Guided product creation
# ════════════════════════════════════════
@admin_only
async def add_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data.clear()
    await update.message.reply_text(
        "➕ *Add New Product*\n\n"
        "Step 1/6 — What is the *product name*?\n"
        "_e.g. iPhone 15 Pro Max_",
        parse_mode="Markdown"
    )
    return ADD_NAME

async def add_name(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["name"] = update.message.text.strip()
    keyboard = [[InlineKeyboardButton(f"{e} {n}", callback_data=k)]
                for k, n in [("1","Phones"),("2","Laptops"),("3","Gaming Consoles"),("4","Accessories")]
                for e in [["📱","💻","🎮","🔌"][int(k)-1]]]
    await update.message.reply_text(
        "Step 2/6 — Select *category*:",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("📱 Phones", callback_data="1"),
            InlineKeyboardButton("💻 Laptops", callback_data="2"),
        ],[
            InlineKeyboardButton("🎮 Gaming", callback_data="3"),
            InlineKeyboardButton("🔌 Accessories", callback_data="4"),
        ]]),
        parse_mode="Markdown"
    )
    return ADD_CATEGORY

async def add_category(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    ctx.user_data["category"] = CATEGORIES[query.data]
    await query.edit_message_text(f"Category: *{ctx.user_data['category']}* ✅", parse_mode="Markdown")
    await query.message.reply_text(
        "Step 3/6 — Enter the *selling price* in Naira (numbers only):\n_e.g. 950000_",
        parse_mode="Markdown"
    )
    return ADD_PRICE

async def add_price(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        ctx.user_data["price"] = int(update.message.text.replace(",","").strip())
    except ValueError:
        await update.message.reply_text("❌ Please enter a valid number (e.g. 950000)")
        return ADD_PRICE
    await update.message.reply_text(
        "Step 4/6 — Enter *old/original price* (for strikethrough display).\n"
        "Type `0` to skip.",
        parse_mode="Markdown"
    )
    return ADD_OLD_PRICE

async def add_old_price(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    try:
        val = int(update.message.text.replace(",","").strip())
        ctx.user_data["oldPrice"] = val if val > 0 else None
    except ValueError:
        ctx.user_data["oldPrice"] = None
    await update.message.reply_text(
        "Step 5/6 — Write a *product description*:\n_Keep it clear and enticing!_",
        parse_mode="Markdown"
    )
    return ADD_DESCRIPTION

async def add_description(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    ctx.user_data["description"] = update.message.text.strip()
    await update.message.reply_text(
        "Step 6/6 — Send the *product image* 📸\n"
        "_(Send as a photo, or paste an image URL)_",
        parse_mode="Markdown"
    )
    return ADD_IMAGE

async def add_image(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.message.photo:
        # Get highest resolution photo
        file = await update.message.photo[-1].get_file()
        ctx.user_data["image"] = file.file_path  # Telegram CDN URL
    elif update.message.text and update.message.text.startswith("http"):
        ctx.user_data["image"] = update.message.text.strip()
    else:
        await update.message.reply_text("❌ Please send a photo or image URL.")
        return ADD_IMAGE

    d = ctx.user_data
    summary = (
        f"✅ *Review your product:*\n\n"
        f"📦 Name: {d['name']}\n"
        f"🏷️ Category: {d['category']}\n"
        f"💰 Price: ₦{d['price']:,}\n"
        f"🔖 Old Price: {'₦'+str(d['oldPrice']) if d['oldPrice'] else 'N/A'}\n"
        f"📝 Description: {d['description'][:80]}...\n\n"
        "Confirm and add to website?"
    )
    await update.message.reply_text(
        summary,
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("✅ Yes, Add!", callback_data="confirm_yes"),
            InlineKeyboardButton("❌ Cancel", callback_data="confirm_no"),
        ]]),
        parse_mode="Markdown"
    )
    return ADD_CONFIRM

async def add_confirm(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    if query.data == "confirm_no":
        await query.edit_message_text("❌ Cancelled. Product was not added.")
        return ConversationHandler.END

    d = ctx.user_data
    import re, time
    product_id = re.sub(r"[^a-z0-9]", "", d["name"].lower())[:8] + str(int(time.time()))[-4:]

    product = {
        "id": product_id,
        "name": d["name"],
        "category": d["category"],
        "price": d["price"],
        "oldPrice": d.get("oldPrice"),
        "description": d["description"],
        "image": d["image"],
        "images": [d["image"]],
        "rating": 5.0,
        "reviews": 0,
        "badge": "new",
        "inStock": True,
    }

    db.collection(COLLECTION).document(product_id).set(product)

    await query.edit_message_text(
        f"🎉 *Product added successfully!*\n\n"
        f"ID: `{product_id}`\n"
        f"Name: {d['name']}\n"
        f"Price: ₦{d['price']:,}\n\n"
        "It is now live on your website! 🌐",
        parse_mode="Markdown"
    )
    return ConversationHandler.END


# ════════════════════════════════════════
#  /delete — Remove product
# ════════════════════════════════════════
@admin_only
async def delete_product(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if not args:
        await update.message.reply_text(
            "Usage: `/delete <product_id>`\n\nUse /list to see all product IDs.",
            parse_mode="Markdown"
        )
        return
    pid = args[0].strip()
    doc = db.collection(COLLECTION).document(pid).get()
    if not doc.exists:
        await update.message.reply_text(f"❌ Product `{pid}` not found.", parse_mode="Markdown")
        return
    name = doc.to_dict().get("name", pid)
    db.collection(COLLECTION).document(pid).delete()
    await update.message.reply_text(
        f"🗑️ *{name}* has been removed from the website.",
        parse_mode="Markdown"
    )


# ════════════════════════════════════════
#  /stock — Toggle in/out of stock
# ════════════════════════════════════════
@admin_only
async def toggle_stock(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if len(args) < 2:
        await update.message.reply_text(
            "Usage: `/stock <product_id> <in|out>`\n\nExamples:\n`/stock ph001 out`\n`/stock ph001 in`",
            parse_mode="Markdown"
        )
        return
    pid, status = args[0].strip(), args[1].strip().lower()
    if status not in ("in", "out"):
        await update.message.reply_text("❌ Status must be `in` or `out`.", parse_mode="Markdown")
        return
    doc = db.collection(COLLECTION).document(pid).get()
    if not doc.exists:
        await update.message.reply_text(f"❌ Product `{pid}` not found.", parse_mode="Markdown")
        return
    in_stock = status == "in"
    db.collection(COLLECTION).document(pid).update({"inStock": in_stock})
    name = doc.to_dict().get("name", pid)
    emoji = "✅" if in_stock else "❌"
    await update.message.reply_text(
        f"{emoji} *{name}* is now marked as *{'In Stock' if in_stock else 'Out of Stock'}* on the website.",
        parse_mode="Markdown"
    )


# ════════════════════════════════════════
#  /update — Update price
# ════════════════════════════════════════
@admin_only
async def update_product(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if len(args) < 3:
        await update.message.reply_text(
            "Usage: `/update <product_id> <field> <value>`\n\n"
            "Fields: `price`, `oldPrice`, `name`, `badge`\n\n"
            "Examples:\n"
            "`/update ph001 price 880000`\n"
            "`/update ph001 badge hot`",
            parse_mode="Markdown"
        )
        return
    pid, field, value = args[0], args[1].lower(), " ".join(args[2:])
    allowed = {"price", "oldPrice", "name", "badge", "description"}
    if field not in allowed:
        await update.message.reply_text(f"❌ Field `{field}` is not editable here.", parse_mode="Markdown")
        return
    doc = db.collection(COLLECTION).document(pid).get()
    if not doc.exists:
        await update.message.reply_text(f"❌ Product `{pid}` not found.", parse_mode="Markdown")
        return
    if field in ("price", "oldPrice"):
        try: value = int(value.replace(",",""))
        except: await update.message.reply_text("❌ Price must be a number."); return

    db.collection(COLLECTION).document(pid).update({field: value})
    name = doc.to_dict().get("name", pid)
    await update.message.reply_text(
        f"✏️ *{name}* updated:\n`{field}` → `{value}`\n\nWebsite reflects this immediately! 🌐",
        parse_mode="Markdown"
    )


# ════════════════════════════════════════
#  Cancel handler
# ════════════════════════════════════════
async def cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Operation cancelled.")
    ctx.user_data.clear()
    return ConversationHandler.END


# ════════════════════════════════════════
#  Main
# ════════════════════════════════════════
def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    # /add conversation
    add_conv = ConversationHandler(
        entry_points=[CommandHandler("add", add_start)],
        states={
            ADD_NAME:        [MessageHandler(filters.TEXT & ~filters.COMMAND, add_name)],
            ADD_CATEGORY:    [CallbackQueryHandler(add_category)],
            ADD_PRICE:       [MessageHandler(filters.TEXT & ~filters.COMMAND, add_price)],
            ADD_OLD_PRICE:   [MessageHandler(filters.TEXT & ~filters.COMMAND, add_old_price)],
            ADD_DESCRIPTION: [MessageHandler(filters.TEXT & ~filters.COMMAND, add_description)],
            ADD_IMAGE:       [MessageHandler(filters.PHOTO | filters.TEXT, add_image)],
            ADD_CONFIRM:     [CallbackQueryHandler(add_confirm)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    app.add_handler(help_handler)
    app.add_handler(add_conv)
    app.add_handler(CommandHandler("list",   list_products))
    app.add_handler(CommandHandler("delete", delete_product))
    app.add_handler(CommandHandler("stock",  toggle_stock))
    app.add_handler(CommandHandler("update", update_product))

    logger.info("🤖 KhaylimTech Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
