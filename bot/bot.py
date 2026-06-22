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
import uuid
import tempfile
import cloudinary
import cloudinary.uploader
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
# Multiple admins — add IDs separated by commas in ADMIN_IDS env var
# e.g. ADMIN_IDS=123456789,5532033861
_raw_ids = os.getenv("ADMIN_IDS", os.getenv("ADMIN_ID", "0"))
ADMIN_IDS = set(int(i.strip()) for i in _raw_ids.split(",") if i.strip())

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

# ─── Cloudinary Config (values set as Railway environment variables) ─────────
cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key    = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
    secure     = True
)

# ─── Upload to Cloudinary ────────────────────────────────
async def upload_to_cloudinary(tg_file, resource_type: str = "image") -> str:
    """Download file from Telegram, upload to Cloudinary, return secure public URL."""
    suffix = ".mp4" if resource_type == "video" else ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        await tg_file.download_to_drive(tmp.name)
        result = cloudinary.uploader.upload(
            tmp.name,
            resource_type = resource_type,
            folder        = "khaylimtech/products",
        )
        return result["secure_url"]

# ─── Conversation states ─────────────────────────────────
(
    ADD_NAME, ADD_CATEGORY, ADD_PRICE, ADD_OLD_PRICE,
    ADD_DESCRIPTION, ADD_IMAGE, ADD_MORE_IMAGES, ADD_VIDEO, ADD_CONFIRM,
    UPDATE_FIELD, UPDATE_VALUE,
) = range(11)

CATEGORIES = {
    "1": "phones",
    "2": "laptops",
    "3": "gaming",
    "4": "accessories",
}

# ─── Auth guard ─────────────────────────────────────────
def admin_only(func):
    async def wrapper(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        if update.effective_user.id not in ADMIN_IDS:
            await update.message.reply_text("⛔ Unauthorized. Only the store admin can use this bot.")
            return ConversationHandler.END
        return await func(update, ctx)
    return wrapper


# ════════════════════════════════════════
#  /help  and  /start
# ════════════════════════════════════════
@admin_only
async def start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    from telegram import ReplyKeyboardMarkup, KeyboardButton
    # Buttons starting with "/" are sent as commands natively by Telegram
    keyboard = [
        [KeyboardButton("/add"),         KeyboardButton("/list"),        KeyboardButton("/stock")],
        [KeyboardButton("/update"),      KeyboardButton("/discount"),    KeyboardButton("/delete")],
        [KeyboardButton("/sales"),       KeyboardButton("/subscribers"), KeyboardButton("/promo")],
        [KeyboardButton("/cancel"),      KeyboardButton("/help")],
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True, persistent=True)
    await update.message.reply_text(
        "👋 Welcome to *KhaylimTech Ventures* Admin Bot!\n\n"
        "Use the buttons below or type commands to manage your store:",
        parse_mode="Markdown",
        reply_markup=reply_markup
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
    ctx.user_data["image"] = None
    ctx.user_data["images"] = []
    ctx.user_data["video"] = None
    await update.message.reply_text(
        "Step 6/8 — Send the *main product image* 📸\n"
        "_(This is the primary image shown on the product card)_",
        parse_mode="Markdown"
    )
    return ADD_IMAGE

async def add_image(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    msg = await update.message.reply_text("⏳ Uploading to storage, please wait...")

    if update.message.photo:
        try:
            file = await update.message.photo[-1].get_file()
            url = await upload_to_cloudinary(file, "image")
            ctx.user_data["image"] = url
            ctx.user_data["images"] = [url]
            ctx.user_data["video"] = None
            await msg.edit_text("✅ Main image uploaded! (1/5)")
            await update.message.reply_text(
                "Step 7/8 — Send *more product images* 📸 _(up to 4 more)_\n"
                "Send photos one by one, then type `done` when finished.\n"
                "_More images = customers see all angles of the product!_",
                parse_mode="Markdown"
            )
            return ADD_MORE_IMAGES
        except Exception as e:
            await msg.edit_text(f"❌ Upload failed: {e}\nPlease try again.")
            return ADD_IMAGE

    elif update.message.video:
        try:
            file = await update.message.video.get_file()
            url = await upload_to_cloudinary(file, "video")
            ctx.user_data["video"] = url
            ctx.user_data["image"] = "https://placehold.co/400x400/1a1a24/c9a227?text=Video+Product"
            await msg.edit_text("✅ Video uploaded!")
            d = ctx.user_data
            summary = (
                f"✅ *Review your product:*\n\n"
                f"📦 Name: {d['name']}\n"
                f"🏷️ Category: {d['category']}\n"
                f"💰 Price: ₦{d['price']:,}\n"
                f"🔖 Old Price: {'₦'+str(d['oldPrice']) if d['oldPrice'] else 'N/A'}\n"
                f"📝 Description: {d['description'][:80]}...\n"
                f"🎬 Video: Yes\n\n"
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
        except Exception as e:
            await msg.edit_text(f"❌ Upload failed: {e}\nPlease try again.")
            return ADD_IMAGE

    elif update.message.text and update.message.text.startswith("http"):
        await msg.edit_text("✅ URL saved!")
        ctx.user_data["image"] = update.message.text.strip()
        ctx.user_data["video"] = None
        await update.message.reply_text(
            "Step 7/7 — Send a *product video* 🎬 _(optional)_\n"
            "Send a video file, or type `skip` to skip.",
            parse_mode="Markdown"
        )
        return ADD_VIDEO

    else:
        await msg.edit_text("❌ Please send a *photo*, a *video*, or a direct image URL.", parse_mode="Markdown")
        return ADD_IMAGE

async def add_more_images(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    images = ctx.user_data.get("images", [])
    MAX = 5

    # User typed "done" — move to video step
    if update.message.text and update.message.text.strip().lower() == "done":
        await update.message.reply_text(
            f"✅ {len(images)} image(s) saved!\n\n"
            "Step 8/8 — Send a *product video* 🎬 _(optional)_\n"
            "Send a video file, or type `skip` to skip.",
            parse_mode="Markdown"
        )
        return ADD_VIDEO

    if update.message.photo:
        if len(images) >= MAX:
            await update.message.reply_text(
                f"⚠️ Maximum {MAX} images reached. Type `done` to continue.",
                parse_mode="Markdown"
            )
            return ADD_MORE_IMAGES
        try:
            msg = await update.message.reply_text("⏳ Uploading image...")
            file = await update.message.photo[-1].get_file()
            url = await upload_to_cloudinary(file, "image")
            images.append(url)
            ctx.user_data["images"] = images
            remaining = MAX - len(images)
            await msg.edit_text(
                f"✅ Image {len(images)}/{MAX} uploaded!\n"
                f"{'Send another photo or type `done` to continue.' if remaining > 0 else 'Maximum reached — type `done` to continue.'}"
            )
        except Exception as e:
            await update.message.reply_text(f"❌ Upload failed: {e}. Try again.")
        return ADD_MORE_IMAGES

    await update.message.reply_text(
        "📸 Send a photo or type `done` to continue.",
        parse_mode="Markdown"
    )
    return ADD_MORE_IMAGES


async def add_video(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if update.message.video:
        msg = await update.message.reply_text("⏳ Uploading video to Cloudinary...")
        try:
            file = await update.message.video.get_file()
            url = await upload_to_cloudinary(file, "video")
            ctx.user_data["video"] = url
            await msg.edit_text("✅ Video uploaded!")
        except Exception as e:
            await msg.edit_text(f"❌ Video upload failed: {e}")
            ctx.user_data["video"] = None
    elif update.message.text and update.message.text.lower() == "skip":
        ctx.user_data["video"] = None
    elif update.message.text and update.message.text.startswith("http"):
        ctx.user_data["video"] = update.message.text.strip()
    else:
        await update.message.reply_text("❌ Send a video file, a video URL, or type `skip`.", parse_mode="Markdown")
        return ADD_VIDEO

    d = ctx.user_data
    has_video = "🎬 Video: Yes" if d.get("video") else "🎬 Video: No"
    summary = (
        f"✅ *Review your product:*\n\n"
        f"📦 Name: {d['name']}\n"
        f"🏷️ Category: {d['category']}\n"
        f"💰 Price: ₦{d['price']:,}\n"
        f"🔖 Old Price: {'₦'+str(d['oldPrice']) if d['oldPrice'] else 'N/A'}\n"
        f"📝 Description: {d['description'][:80]}...\n"
        f"📸 Image: Yes\n"
        f"{has_video}\n\n"
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
        "images": d.get("images") or [d["image"]],  # all uploaded images
        "video": d.get("video"),        # None if skipped
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
#  /discount — Apply % or flat discount
# ════════════════════════════════════════
@admin_only
async def discount_product(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    if len(args) < 2:
        await update.message.reply_text(
            "Usage: `/discount <product_id> <percent|amount|off>`\n\n"
            "Examples:\n"
            "`/discount ph001 15` — 15% off\n"
            "`/discount ph001 20000` — ₦20,000 off\n"
            "`/discount ph001 off` — Remove discount",
            parse_mode="Markdown"
        )
        return
    pid, value = args[0].strip(), args[1].strip().lower()
    doc = db.collection(COLLECTION).document(pid).get()
    if not doc.exists:
        await update.message.reply_text(f"❌ Product `{pid}` not found.", parse_mode="Markdown")
        return
    data = doc.to_dict()
    name = data.get("name", pid)
    current_price = int(data.get("price", 0))

    if value == "off":
        db.collection(COLLECTION).document(pid).update({"oldPrice": None})
        await update.message.reply_text(f"✅ Discount removed from *{name}*.", parse_mode="Markdown")
        return

    try: amount = float(value)
    except:
        await update.message.reply_text("❌ Invalid value. Use a number (15 for 15%) or `off`.", parse_mode="Markdown")
        return

    if amount <= 100:  # treat as percentage
        new_price = int(current_price * (1 - amount / 100))
        label = f"{int(amount)}% off"
    else:  # treat as flat naira amount
        new_price = current_price - int(amount)
        label = f"₦{int(amount):,} off"

    if new_price <= 0:
        await update.message.reply_text("❌ Discount too large — price would be zero or negative.", parse_mode="Markdown")
        return

    db.collection(COLLECTION).document(pid).update({"oldPrice": current_price, "price": new_price})
    await update.message.reply_text(
        f"🏷️ *Discount applied to {name}!*\n\n"
        f"Original: ₦{current_price:,}\n"
        f"Discount: {label}\n"
        f"New price: ₦{new_price:,}\n\n"
        f"Website updated instantly! 🌐",
        parse_mode="Markdown"
    )


# ════════════════════════════════════════
#  /sales — WhatsApp order summary
# ════════════════════════════════════════
@admin_only
async def sales_report(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    docs = db.collection("orders").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(20).stream()
    orders = [doc.to_dict() for doc in docs]

    if not orders:
        await update.message.reply_text(
            "📊 *Sales Report*\n\n"
            "No recorded orders yet.\n\n"
            "💡 Orders placed via WhatsApp cart button are tracked here automatically.",
            parse_mode="Markdown"
        )
        return

    total = sum(o.get("total", 0) for o in orders)
    lines = [f"📊 *Sales Report* — Last {len(orders)} orders\n"]
    for o in orders[:10]:
        lines.append(
            f"• {o.get('name','?')} — ₦{o.get('total',0):,} "
            f"({o.get('date','?')})"
        )
    lines.append(f"\n💰 *Total Revenue: ₦{total:,}*")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


# ════════════════════════════════════════
#  Cancel handler
# ════════════════════════════════════════
async def cancel(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Operation cancelled.")
    ctx.user_data.clear()
    return ConversationHandler.END


# ════════════════════════════════════════
#  /subscribers — View newsletter list
# ════════════════════════════════════════
@admin_only
async def list_subscribers(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    docs = db.collection("subscribers").order_by("date", direction=firestore.Query.DESCENDING).limit(50).stream()
    subs = [doc.to_dict() for doc in docs]
    if not subs:
        await update.message.reply_text("📭 No newsletter subscribers yet.")
        return
    lines = [f"📧 *Newsletter Subscribers ({len(subs)})*\n"]
    for s in subs:
        date = s.get("date","")[:10]
        lines.append(f"• `{s.get('email','?')}` — {date}")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


# ════════════════════════════════════════
#  /promo — Update homepage promo banner
# ════════════════════════════════════════
@admin_only
async def set_promo(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """
    Usage:
      /promo <product_id> <title> | <description>
    Examples:
      /promo gc001 PlayStation 5 Now In Stock! | Limited units. Order before it sells out!
      /promo ph003 New iPhone 15 Pro Has Arrived | Get yours today at the best price.
      /promo hide   — hide the banner entirely
    """
    args = ctx.args
    if not args:
        await update.message.reply_text(
            "📢 *Update Homepage Promo Banner*\n\n"
            "Usage:\n`/promo <product_id> <title> | <description>`\n\n"
            "Examples:\n"
            "`/promo gc001 PlayStation 5 Now In Stock! | Limited units available!`\n"
            "`/promo ph003 New iPhone 15 Pro Arrived | Best price guaranteed.`\n"
            "`/promo hide` — hide the promo banner",
            parse_mode="Markdown"
        )
        return

    if args[0].lower() == "hide":
        db.collection("config").document("promo").set({"hidden": True}, merge=True)
        await update.message.reply_text("🙈 Promo banner hidden from homepage.")
        return

    pid = args[0].strip()
    rest = " ".join(args[1:])
    if "|" in rest:
        title, desc = [x.strip() for x in rest.split("|", 1)]
    else:
        title, desc = rest.strip(), "Order now while stock lasts!"

    db.collection("config").document("promo").set({
        "productId": pid,
        "title":     title,
        "desc":      desc,
        "tag":       "🔥 New Arrival",
        "btnText":   "Order Now",
        "hidden":    False,
        "updatedAt": firestore.SERVER_TIMESTAMP
    })
    await update.message.reply_text(
        f"✅ *Promo banner updated!*\n\n"
        f"🔗 Product ID: `{pid}`\n"
        f"📝 Title: {title}\n"
        f"💬 Desc: {desc}\n\n"
        f"Homepage banner updated instantly! 🌐",
        parse_mode="Markdown"
    )


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
            ADD_IMAGE:       [MessageHandler(filters.PHOTO | filters.VIDEO | filters.TEXT, add_image)],
            ADD_MORE_IMAGES: [MessageHandler(filters.PHOTO | filters.TEXT, add_more_images)],
            ADD_VIDEO:       [MessageHandler(filters.VIDEO | filters.TEXT, add_video)],
            ADD_CONFIRM:     [CallbackQueryHandler(add_confirm)],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    app.add_handler(help_handler)
    app.add_handler(add_conv)
    app.add_handler(CommandHandler("list",     list_products))
    app.add_handler(CommandHandler("delete",   delete_product))
    app.add_handler(CommandHandler("stock",    toggle_stock))
    app.add_handler(CommandHandler("update",   update_product))
    app.add_handler(CommandHandler("discount",    discount_product))
    app.add_handler(CommandHandler("sales",       sales_report))
    app.add_handler(CommandHandler("subscribers", list_subscribers))
    app.add_handler(CommandHandler("promo",       set_promo))

    # Register commands so they appear in Telegram's / menu with descriptions
    from telegram import BotCommand
    commands = [
        BotCommand("add",      "➕ Add a new product (guided step-by-step)"),
        BotCommand("list",     "📋 List all products with IDs and prices"),
        BotCommand("stock",    "🔄 [product_id] [in|out] — Mark in/out of stock"),
        BotCommand("update",   "✏️ [product_id] [field] [value] — Update a field"),
        BotCommand("discount", "🏷️ [product_id] [%|amount|off] — Apply discount"),
        BotCommand("delete",   "🗑️ [product_id] — Remove a product permanently"),
        BotCommand("sales",       "📊 View recent orders and revenue report"),
        BotCommand("subscribers", "📧 View newsletter subscriber list"),
        BotCommand("promo",       "📢 [product_id] [message] — Update homepage promo"),
        BotCommand("cancel",      "❌ Cancel the current operation"),
        BotCommand("help",        "❓ Show all available commands"),
    ]
    from telegram import MenuButtonCommands
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_until_complete(app.bot.set_my_commands(commands))
    loop.run_until_complete(app.bot.set_chat_menu_button(menu_button=MenuButtonCommands()))

    logger.info("🤖 KhaylimTech Bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
