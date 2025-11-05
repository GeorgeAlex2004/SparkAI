# Deployment Guide for Career Spark

This guide will help you deploy Career Spark to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Google Gemini API key
- Supabase account (free tier works)

## Step 1: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-migration.sql`
4. Run the SQL script to create the necessary tables

## Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Career Spark ready for deployment"

# Add your remote repository
git remote add origin <your-repo-url>

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

1. **Import Project:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project

2. **Configure Environment Variables:**
   - Before deploying, go to **Settings** → **Environment Variables**
   - Add these three variables:
   
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
   
   - Make sure to add them for **Production**, **Preview**, and **Development**

3. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live!

## Step 4: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. Test creating a new chat
3. Verify messages are being saved to Supabase

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Make sure variables are prefixed with `VITE_`
- Redeploy after adding new variables
- Check that variables are added to all environments (Production, Preview, Development)

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check that RLS policies allow access
- Verify tables were created correctly

### API Errors
- Verify Gemini API key is valid
- Check API quota limits
- Review browser console for errors

## Post-Deployment

- Set up a custom domain (optional)
- Enable analytics (optional)
- Configure preview deployments for pull requests
- Set up monitoring and error tracking

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure Supabase database is properly configured

