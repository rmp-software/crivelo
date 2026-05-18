# Crema Arena

Specialty Coffee Competition Platform - MVP for organizing and broadcasting latte art TNTs, barista championships, and bar battles in Brazil.

## Technology Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Crema Arena design system
- **Database:** PostgreSQL (via Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth.js with JWT sessions
- **Icons:** Lucide React
- **QR Codes:** qrcode npm package

## Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database (Neon recommended)
3. Font files from the Crema Arena design system in `/public/fonts/`
4. Brand assets in `/public/assets/`

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your application URL (default: `http://localhost:3000`)
- `ADMIN_EMAIL` - Default admin user email
- `ADMIN_PASSWORD` - Default admin user password

### 3. Initialize Database

Run the initialization script:

```bash
chmod +x init.sh
./init.sh
```

This will:
- Install dependencies (if needed)
- Generate Prisma Client
- Run database migrations
- Seed the database with the default admin user

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
crema-arena/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles with design system variables
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Utility functions and configurations
│   └── auth.ts           # NextAuth configuration
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma schema
│   └── seed.ts           # Database seeding script
├── public/               # Static assets
│   ├── fonts/           # Custom fonts
│   ├── assets/          # Brand assets (logos, icons)
│   └── uploads/         # User-uploaded files
├── types/               # TypeScript type definitions
├── middleware.ts        # Next.js middleware (auth protection)
└── init.sh             # Initialization script
```

## Database Schema

The application uses the following main entities:

- **Organizers** - Admin and organizer users with role-based access
- **Competitors** - Global pool of competition participants
- **Events** - Competition events (setup → running → finished)
- **EventEntries** - Competitor registrations for specific events
- **Duels** - Individual matches with vote tracking
- **Votes** - Judge selections in duels

## Authentication

- Login route: `/login`
- Protected routes: `/dashboard/*` (requires authentication)
- Two roles: `admin` (full access) and `organizer` (manage own events)
- No public registration - only admins can create organizer accounts

## Design System

The Crema Arena design system is implemented via CSS custom properties in `app/globals.css`:

- **Colors:** Espresso (dark), Crema (light), Cinnamon (brand), Marigold (gold), Mint (live), Cherry (danger)
- **Typography:** Bricolage Grotesque (display), Instrument Serif (editorial), Geist (body), Geist Mono (scores)
- **Border Radii:** xs (6px), sm (10px), md (18px), lg (28px), full (999px)
- **Shadows:** Subtle depth with espresso tones
- **Animations:** Standard (180ms) and overshoot easing curves

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (warning: deletes all data)
npx prisma migrate reset
```

## Deployment

The application is configured for deployment on Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

The `vercel.json` file includes the necessary build configuration.

## License

ISC
