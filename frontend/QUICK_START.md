# BabyGrowth AI - Quick Start Guide

Get up and running with BabyGrowth AI in minutes!

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

### 3. Open in Browser
```
http://localhost:3000
```

That's it! The app is now running with demo data.

## 🗺️ Explore the App

### Dashboard `/`
- View child's profile
- See growth statistics
- Read AI insights
- Latest measurements

### Child Profile `/profile`
- View and edit child information
- Update measurements
- Manage basic details

### Growth Tracking `/growth`
- Interactive weight/height charts
- Full measurement history
- Growth analysis statistics
- Detailed data tables

### AI Assistant `/assistant`
- Chat with health assistant
- Quick question templates
- Message history with timestamps
- Professional chat interface

## 🛠 Development

### Available Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Format code
pnpm format
```

### Project Structure
```
├── app/                 # Next.js app router
├── components/          # Reusable React components
├── lib/                 # Utilities and mock data
├── public/              # Static files
└── README.md            # Full documentation
```

## 📝 Using Mock Data

The app includes realistic demo data:

**Child: Emma Johnson**
- Age: 3 years old
- Gender: Female
- DOB: June 15, 2022

**Growth Records: 10 data points**
- Spanning Jan 2023 to Dec 2024
- Weight: 3.5 kg → 14.5 kg
- Height: 50 cm → 75.5 cm

**Chat Samples**
- Pre-written examples
- Mock assistant responses

## 🔌 Connect to Your Backend

### Step 1: Update API Base URL
Create `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Step 2: Implement API Client
See `API_INTEGRATION.md` for detailed instructions.

### Step 3: Replace Mock Data
Examples in `lib/mock-data.ts` show what to replace.

## 🎨 Customize Colors

Edit `app/globals.css` to change the theme:

```css
:root {
  --primary: oklch(0.55 0.14 250);        /* Light blue */
  --secondary: oklch(0.70 0.08 140);      /* Light green */
  --background: oklch(0.99 0.002 280);    /* Off-white */
  /* ... more colors ... */
}
```

## 📱 Responsive Testing

Test on different devices:

```bash
# Desktop (1920x1080)
# Tablet (768x1024)
# Mobile (375x667)
```

All layouts are optimized for each size.

## 🚀 Deploy to Vercel

### Option 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

Then connect repo to Vercel dashboard.

### Option 2: Use Vercel CLI
```bash
npm i -g vercel
vercel
```

### Environment Variables
Set in Vercel dashboard:
```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

## ✅ Pre-deployment Checklist

- [ ] Replace mock data with real API
- [ ] Set up environment variables
- [ ] Test all pages on mobile
- [ ] Verify charts render correctly
- [ ] Check form submissions
- [ ] Test navigation between pages
- [ ] Verify metadata (title, description)
- [ ] Add custom favicon if needed

## 🎓 Key Files to Know

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout & metadata |
| `app/page.tsx` | Dashboard home page |
| `lib/mock-data.ts` | Demo data (replace this) |
| `components/sidebar.tsx` | Navigation menu |
| `app/globals.css` | Theme colors |

## 🔧 Customization Examples

### Change App Title
`app/layout.tsx` - line 13:
```typescript
title: 'Your App Name',
```

### Update Theme Colors
`app/globals.css` - Update CSS variables

### Add New Page
1. Create folder: `app/newpage/`
2. Create file: `app/newpage/page.tsx`
3. Add link in Sidebar: `components/sidebar.tsx`

### Modify Chart Data
`lib/mock-data.ts` - Update `growthRecords` array

## 📚 Documentation Files

- **README.md** - Complete documentation
- **API_INTEGRATION.md** - Backend integration guide
- **APP_STRUCTURE.md** - Component architecture
- **PROJECT_SUMMARY.md** - Project overview
- **QUICK_START.md** - This file

## 🆘 Troubleshooting

### App won't start
```bash
# Clear cache
rm -rf .next
pnpm install
pnpm dev
```

### Charts not showing
- Ensure Recharts is installed: `pnpm list recharts`
- Check console for errors
- Verify data is passed correctly

### Styling looks wrong
- Clear browser cache
- Rebuild: `pnpm build`
- Check Tailwind CSS is imported in `app/layout.tsx`

### Navigation not working
- Check routes in `components/sidebar.tsx`
- Verify page files exist in `app/` folder
- Check Next.js app router setup

## 💡 Tips & Tricks

### Development
- Use `console.log()` in components for debugging
- Check React DevTools for component structure
- Use VS Code Intellisense for TypeScript help

### Performance
- Charts update automatically with data changes
- Use `useCallback` for expensive operations
- Consider memoization for large lists

### Testing
- Test on real mobile devices
- Use Chrome DevTools responsive mode
- Test with slow network (DevTools → Network)

## 🎯 Next Steps

1. **Explore the Code** - Check out component implementations
2. **Connect Backend** - Follow API_INTEGRATION.md
3. **Customize Design** - Modify colors in globals.css
4. **Add Features** - Create new pages and components
5. **Deploy** - Push to Vercel with `vercel` command

## 📞 Need Help?

1. Check the full **README.md** for detailed docs
2. Review **API_INTEGRATION.md** for backend setup
3. Look at **APP_STRUCTURE.md** for architecture
4. Examine component code with JSDoc comments

## 🎉 You're Ready!

The application is production-ready and waiting for your customizations. 

Start by exploring the code, then connect it to your Python FastAPI backend for a complete solution!

---

**Happy building! 🚀**
