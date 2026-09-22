# Lets Organic 🌿

A modern, responsive e-commerce web platform for organic skincare, superfoods, and wellness products built with Next.js App Router, Vanilla CSS Modules, and MongoDB Atlas.

## ✨ Features

- **Centered Full-Product Hero Showcase**: Interactive image switcher, live stock badge, botanical perks, quantity selector, and instant checkout.
- **Dynamic PKR Currency & Delivery Controls**: Supports nationwide free delivery toggle and minimum threshold delivery fee settings.
- **Full-Stack Admin Control Panel**: Hidden console at `/console-gate-4527` for real-time inventory management, promotion banners, and review moderation.
- **MongoDB Atlas Integration**: Live persistent database for products, customer reviews/feedback, and site settings.
- **Cart & Wishlist**: Client-side resilient caching with instant feedback toasts.
- **Botanical Aesthetics**: Glassmorphic elements, modern typography, responsive grids, and zero flashy AI-generated templates.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your database and admin credentials:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS Modules (no Tailwind)
- **Database**: MongoDB Atlas with Mongoose
- **Icons**: Lucide React
- **Authentication**: JWT & HttpOnly cookies
