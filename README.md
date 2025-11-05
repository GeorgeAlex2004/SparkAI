# Career Spark

A free AI career assistant for job seekers. Get help drafting cover letters, critiquing resume bullet points, and generating practice interview questions.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   
   Create a `.env` file in the root directory:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   
   Get your free API key from [Google AI Studio](https://aistudio.google.com/apikey).

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Deploy to Vercel

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Add Environment Variables in Vercel:**
   - In your project settings, go to "Environment Variables"
   - Add the following variables:
     - `VITE_GEMINI_API_KEY` = Your Google Gemini API key
     - `VITE_SUPABASE_URL` = Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
   - Make sure to add them for **Production**, **Preview**, and **Development** environments

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Your app will be live at `https://your-project.vercel.app`

5. **Set up Supabase Database:**
   - Make sure you've run the SQL migration from `supabase-migration.sql` in your Supabase dashboard
   - Go to SQL Editor in Supabase and run the migration script

## Features

- ✨ Beautiful UI built with shadcn/ui components
- 🤖 Powered by Google Gemini API (gemini-2.5-flash-preview-09-2025)
- 💬 Clean, modern chat interface with message history
- 📱 Fully responsive design
- 🔄 Automatic retry with exponential backoff (3 retries for 429/5xx errors)
- 🎨 Professional Career Spark theme with dark mode support
- ⚡ Fast and lightweight with TypeScript

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Google Gemini API
- React Router
- TanStack Query

