# KhaylimTech Telegram Bot — Setup Guide

## Step 1: Create Your Telegram Bot
1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Name it: `KhaylimTech Store`
4. Username: `khaylimtech_bot` (or similar)
5. Copy the **BOT TOKEN** it gives you

## Step 2: Get Your Telegram User ID
1. Search `@userinfobot` on Telegram
2. Send `/start` — it will show your **User ID** (a number like `1234567890`)

## Step 3: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add Project** → name it `khaylimtech`
3. Go to **Firestore Database** → Create database → Start in test mode
4. Go to **Project Settings** → **Service Accounts**
5. Click **Generate New Private Key** → download `firebase-key.json`
6. Place `firebase-key.json` in the `bot/` folder

## Step 4: Deploy Bot to Railway (Free)
1. Go to https://railway.app → sign up free
2. Click **New Project** → **Deploy from GitHub repo**
3. Upload this project or connect your GitHub
4. Add Environment Variables in Railway:
   - `BOT_TOKEN` = your token from Step 1
   - `ADMIN_ID` = your Telegram user ID from Step 2
5. Set **Start Command**: `python bot.py`
6. Deploy! ✅

## Step 5: Connect Website to Firebase
1. In Firebase Console → Project Settings → Your apps → Add Web App
2. Copy the `firebaseConfig` object
3. Open `js/firebase-config.js` in the website folder
4. Replace the placeholder values with your real config

## Bot Commands
| Command | What it does |
|---------|-------------|
| `/add` | Add a new product (guided 6-step flow) |
| `/delete ph001` | Remove product by ID |
| `/update ph001 price 850000` | Update a product field |
| `/stock ph001 out` | Mark product as out of stock |
| `/stock ph001 in` | Mark product as in stock |
| `/list` | See all products with IDs |
| `/help` | Show all commands |

## That's it! 🎉
Once deployed, manage your entire store from Telegram — the website updates live!
