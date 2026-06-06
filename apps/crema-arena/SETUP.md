# Setup Instructions

## Node.js Version Requirement

This project requires **Node.js 18 or higher**. The current environment has Node.js 14, which is too old.

### To proceed with setup:

1. **Install Node.js 24 using nvm:**

   ```bash
   nvm install 24
   nvm use 24
   ```

2. **Run the initialization script:**

   ```bash
   ./init.sh
   ```

   This will:
   - Install all npm dependencies
   - Generate Prisma Client
   - Run database migrations (if DATABASE_URL is configured)
   - Seed the database with default admin user

3. **Configure your database:**
   - Update `.env` file with your Neon PostgreSQL connection string
   - Replace `DATABASE_URL` with your actual database URL

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Manual Setup (if init.sh fails)

If the initialization script fails, run these commands manually:

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run migrations (ensure DATABASE_URL is configured in .env)
npx prisma migrate dev --name init

# 4. Seed database
npx prisma db seed

# 5. Start dev server
npm run dev
```

## Project Status

✅ **Completed:**

- Next.js 14 project structure created
- TypeScript configured
- Tailwind CSS configured with Crema Arena design system
- Prisma schema created with all required tables
- NextAuth.js configured with CredentialsProvider
- Middleware for route protection
- Database seed script for admin user
- All CSS variables and design tokens implemented
- Font face declarations added
- vercel.json deployment configuration
- .gitignore configured
- Directory structure created (fonts, assets, uploads, screenshots)

⚠️ **Requires Node.js 18+:**

- Dependencies installation
- Prisma Client generation
- Database migrations
- Development server

## Next Steps After Setup

Once the project is running with Node.js 18+:

1. Verify the homepage loads at http://localhost:3000
2. Check that CSS variables are applied correctly
3. Test database connection with Prisma Studio: `npx prisma studio`
4. Begin implementing Step 2: Admin base layout and authentication
