// =========================================
//  KhaylimTech Ventures — Product Data
//  Replace image URLs with your own photos
//  or Firebase Storage URLs via the bot.
// =========================================

// Sample products — shown immediately, then Firebase products are merged in on top
const PRODUCTS = [

  // ─── LAPTOPS ──────────────────────────
  {
    id: "lp001",
    name: "MacBook Air M2",
    category: "laptops",
    price: 1200000,
    oldPrice: 1350000,
    rating: 0,
    reviews: 0,
    badge: "hot",
    inStock: true,
    description: "Strikingly thin redesign, M2 chip, 18-hour battery life, 13.6\" Liquid Retina display, MagSafe charging, 8GB RAM, 256GB SSD. The notebook everyone wants.",
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=500&q=80"
    ]
  },
  {
    id: "lp002",
    name: "HP Pavilion 15 (Intel i5)",
    category: "laptops",
    price: 380000,
    oldPrice: 420000,
    rating: 0,
    reviews: 0,
    badge: null,
    inStock: true,
    description: "12th Gen Intel Core i5, 8GB DDR4 RAM, 512GB SSD, 15.6\" FHD IPS display, Intel Iris Xe graphics. Perfect for students and everyday productivity.",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80"
    ]
  },
  {
    id: "lp003",
    name: "Lenovo ThinkPad E14",
    category: "laptops",
    price: 420000,
    oldPrice: null,
    rating: 0,
    reviews: 0,
    badge: "new",
    inStock: true,
    description: "Business-grade reliability. AMD Ryzen 5, 8GB RAM, 256GB SSD, 14\" FHD display, MIL-SPEC durability tested, fingerprint reader, backlit keyboard.",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80"
    ]
  },
  {
    id: "lp004",
    name: "Dell XPS 15",
    category: "laptops",
    price: 980000,
    oldPrice: 1100000,
    rating: 0,
    reviews: 0,
    badge: null,
    inStock: false,
    description: "15.6\" OLED touch display, Intel Core i7 13th Gen, NVIDIA RTX 4060, 16GB RAM, 512GB SSD. The creative professional's powerhouse.",
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80"
    ]
  },

  // ─── GAMING CONSOLES ──────────────────
  {
    id: "gc001",
    name: "PlayStation 5 Disc Edition",
    category: "gaming",
    price: 620000,
    oldPrice: 680000,
    rating: 0,
    reviews: 0,
    badge: "hot",
    inStock: true,
    description: "Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games.",
    image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500&q=80"
    ]
  },
  {
    id: "gc002",
    name: "Xbox Series X",
    category: "gaming",
    price: 580000,
    oldPrice: null,
    rating: 0,
    reviews: 0,
    badge: "new",
    inStock: true,
    description: "The fastest, most powerful Xbox ever. 12 teraflops of processing power, DirectX ray tracing, a custom SSD, and 4K gaming at up to 120 FPS.",
    image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=500&q=80"
    ]
  },
  {
    id: "gc003",
    name: "Nintendo Switch OLED",
    category: "gaming",
    price: 280000,
    oldPrice: 310000,
    rating: 0,
    reviews: 0,
    badge: null,
    inStock: true,
    description: "Vivid 7\" OLED screen, wide adjustable stand, 64GB internal storage, enhanced audio. Play at home or on the go — your way, any day.",
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&q=80"
    ]
  },

  // ─── ACCESSORIES ──────────────────────
  {
    id: "ac001",
    name: "AirPods Pro (2nd Gen)",
    category: "accessories",
    price: 95000,
    oldPrice: 110000,
    rating: 0,
    reviews: 0,
    badge: "hot",
    inStock: true,
    description: "Active Noise Cancellation removes up to 2x more noise. Adaptive Transparency lets outside sounds in. Personalized Spatial Audio with dynamic head tracking. Up to 30 hours total listening time.",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80"
    ]
  },
  {
    id: "ac002",
    name: "Samsung 45W Fast Charger",
    category: "accessories",
    price: 12500,
    oldPrice: 15000,
    rating: 0,
    reviews: 0,
    badge: null,
    inStock: true,
    description: "Super-fast 45W charging compatible with all Samsung Galaxy devices and USB-C smartphones. Charge from 0 to 70% in just 30 minutes.",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80"
    ]
  },
  {
    id: "ac003",
    name: "Anker PowerBank 20,000mAh",
    category: "accessories",
    price: 25000,
    oldPrice: 30000,
    rating: 0,
    reviews: 0,
    badge: "new",
    inStock: true,
    description: "PowerCore Essential 20000 — charge an iPhone 15 nearly 4.8 times. Dual USB-A ports + USB-C. Compact design. Perfect for travel and daily commutes.",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80"
    ]
  },
  {
    id: "ac004",
    name: "Oraimo OEB-E95D Earbuds",
    category: "accessories",
    price: 8500,
    oldPrice: 12000,
    rating: 0,
    reviews: 0,
    badge: null,
    inStock: true,
    description: "True wireless earbuds with 40-hour total playtime, ENC call noise cancellation, 10mm bass-boosted drivers, IPX5 water resistance, and instant pairing.",
    image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500&q=80",
    images: [
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500&q=80"
    ]
  }
];

// Category metadata — counts updated dynamically by firebase-db.js
const CATEGORIES = [
  { id: "phones",      label: "Phones",          icon: "📱", count: 0 },
  { id: "laptops",     label: "Laptops",          icon: "💻", count: 0 },
  { id: "gaming",      label: "Gaming Consoles",  icon: "🎮", count: 0 },
  { id: "accessories", label: "Accessories",      icon: "🔌", count: 0 }
];

// Helpers
function formatNGN(amount) {
  return "₦" + amount.toLocaleString("en-NG");
}

function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}

function getRelated(product, limit = 4) {
  return PRODUCTS
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}
