# 🔱 TridentFans Setup Guide

**Transform this into a fully functional baseball community platform in under 30 minutes!**

---

## ⚡ QUICK START

### **Option 1: Automated Setup (Recommended)**
```bash
# 1. Update credentials interactively
node update-credentials.js

# 2. Setup database automatically  
node setup-database.js

# 3. Start the development server
npm run dev
```

### **Option 2: Manual Setup**
1. Get Supabase credentials (see below)
2. Edit `.env.local` manually
3. Run database setup
4. Start development server

---

## 🔑 STEP 1: GET SUPABASE CREDENTIALS (10 minutes)

### **Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login → "New project"
3. **Name:** TridentFans
4. **Password:** Create strong password (save it!)
5. **Region:** Choose closest to you
6. Wait for deployment (~3 minutes)

### **Get API Credentials:**
1. Go to **Settings** → **API**
2. Copy these three values:
   - **Project URL** (https://abc123.supabase.co)
   - **anon public key** (long string starting with eyJ...)
   - **service_role key** (longer string starting with eyJ...)

---

## 🤖 STEP 2: OPTIONAL ENHANCEMENTS

### **AI Bot Functionality:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up → Create API key
3. Add to credentials when prompted

### **Email Notifications:**
1. Go to [resend.com](https://resend.com)
2. Sign up → Create API key
3. Add to credentials when prompted

---

## 🚀 STEP 3: RUN SETUP

### **Easy Way:**
```bash
node update-credentials.js
```
*Follow the prompts to enter your credentials*

### **Manual Way:**
Edit `.env.local` and replace these values:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

---

## 📊 STEP 4: CREATE DATABASE TABLES

```bash
node setup-database.js
```

This automatically runs all database migrations to create:
- User profiles and authentication
- Forum categories and posts
- Prediction games and scoring
- Blog posts and content
- Admin controls and settings
- AI bot configurations
- Email and notification systems

---

## 🧪 STEP 5: TEST EVERYTHING

```bash
npm run dev
```

Visit `http://localhost:3000` and test:

### **Core Features:**
- [ ] Homepage loads with MLB data
- [ ] User signup: `/auth/signup`
- [ ] User login: `/auth/login`
- [ ] Predictions: Click predictions on homepage
- [ ] Admin panel: `/admin` (password: `mariners2026`)
- [ ] Forum: `/forum`

### **Auto-Updates:**
- [ ] Live MLB scores during games
- [ ] AL West standings refresh
- [ ] News articles update every 15 minutes
- [ ] Mobile responsive design

### **Advanced Features:**
- [ ] AI bot chat: `/chat/mark` (if Anthropic key added)
- [ ] Email signup (if Resend key added)
- [ ] Push notifications (auto-configured)

---

## 🚨 TROUBLESHOOTING

### **"Failed to connect to Supabase"**
- Check Supabase URL and keys are correct
- Verify project isn't paused (free tier auto-pauses)
- Ensure no extra spaces in credentials

### **"Authentication not working"**
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- Verify auth.users table was created
- Check browser console for errors

### **"Predictions not saving"**
- Ensure user is logged in
- Check prediction_categories table has data
- Verify API endpoints in browser Network tab

### **"MLB data not loading"**
- Check browser Network tab for API errors
- Test endpoint directly: `/api/mlb?type=schedule`
- MLB API may have temporary issues

---

## 🏆 SUCCESS CHECKLIST

After setup, you should have:

**✅ Immediate Results:**
- Professional sports community platform
- Real-time MLB data integration  
- Interactive prediction system
- User authentication and profiles
- Forum and blog functionality
- Comprehensive admin controls

**✅ Long-term Value:**
- Daily active users for live scores
- Community growth through predictions
- Revenue potential via subscriptions
- Mobile app deployment ready
- Scalable architecture for thousands of users

---

## 📱 OPTIONAL: MOBILE APP DEPLOYMENT

TridentFans includes Capacitor for native iOS/Android apps:

```bash
# iOS Development
npm run ios:sync
npm run ios:open

# Build for production  
npm run ios:build
```

---

## 🔧 FILE STRUCTURE

```
tridentfans/
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                # Utilities and integrations
├── supabase/           # Database migrations
├── .env.local          # Environment configuration
├── setup-database.js   # Automated database setup
└── update-credentials.js # Interactive credential setup
```

---

## 🎯 WHAT YOU'VE BUILT

**TridentFans is now a comprehensive baseball community platform with:**

- **Real-time MLB data** from official APIs
- **Interactive predictions** with point-based scoring
- **AI community members** (Mark, Hammy, Spartan)
- **Professional forum system** with moderation
- **Blog and content management**
- **User authentication** and profiles  
- **Email notification system**
- **Mobile app framework** ready for deployment
- **Revenue generation** via subscriptions and donations
- **Analytics and admin controls**
- **Background automation** for content and engagement

**Ready to become the premier Seattle Mariners fan destination!** 🔱⚾🚀

---

## 📞 NEED HELP?

1. Check browser console for error messages
2. Verify all environment variables are set correctly
3. Test individual API endpoints
4. Check Supabase dashboard for database issues

**Most issues are resolved by double-checking credentials and ensuring database migrations completed successfully.**