# ChainArena Backend

A tournament management backend built with Node.js, TypeScript, Express, and Prisma.

## Features

- **Tournament Management**: Create, manage, and track tournaments
- **User Authentication**: Supabase-powered authentication
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain Integration**: Solana integration for prizes and NFT achievements
- **API Documentation**: Swagger/OpenAPI documentation
- **Type Safety**: Full TypeScript support

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database (for production)
- Supabase account (for authentication)

### Quick Start (Development Mode)

The backend can run in development mode with mock data without requiring external services:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start the development server
npm start
```

The server will start on `http://localhost:4000` with:
- Mock database (no real data persistence)
- Mock authentication (authentication disabled)
- API documentation at `/api-docs`

### Full Setup (Production Ready)

1. **Environment Configuration**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables in `.env`:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/chainarena"
   
   # Supabase Authentication
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   
   # Server
   PORT=4000
   NODE_ENV=production
   
   # JWT
   JWT_SECRET="your-secret-key"
   
   # Solana
   SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
   PLATFORM_WALLET_SECRET_KEY="your-wallet-secret-key"
   ```

2. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

3. **Build and Start**

   ```bash
   npm run build
   npm start
   ```

## API Endpoints

- `GET /tournaments` - List tournaments
- `POST /tournaments` - Create tournament
- `GET /tournaments/:id` - Get tournament details
- `POST /tournaments/:id/join` - Join tournament
- `GET /matches` - List matches
- `POST /matches/:id/result` - Submit match result
- `GET /api-docs` - API documentation

## Development Features

### Mock Mode Detection

The backend automatically detects missing configuration and switches to mock mode:

```typescript
import { isMockMode } from './lib/db';
import { isSupabaseMockMode } from './lib/supabase';

if (isMockMode) {
  console.log('Database is in mock mode');
}
```

### Logging

- Development: Detailed logging including database queries
- Production: Error-level logging only

### TypeScript Support

Full type safety with:
- Prisma-generated types
- Custom type definitions for external services
- Strict TypeScript configuration

## Project Structure

```
src/
├── lib/           # Core libraries (database, auth, etc.)
├── modules/       # Feature modules (tournaments, matches, etc.)
│   ├── auth/      # Authentication
│   ├── tournament/ # Tournament management
│   ├── match/     # Match management
│   └── user/      # User management
├── middlewares/   # Express middlewares
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start the production server
- `npm run dev` - Start development server with hot reload (if nodemon configured)

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure all required environment variables
3. Ensure database is accessible and migrations are run
4. Build and start the application

## Troubleshooting

### Database Connection Issues

If you see "Mock Prisma client" messages:
1. Verify `DATABASE_URL` is set correctly
2. Run `npx prisma generate`
3. Ensure database is accessible

### Authentication Issues

If you see "Mock Supabase" messages:
1. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. Verify Supabase project is active

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check TypeScript version compatibility
- Verify all environment variables for external services

## License

[Your License Here]