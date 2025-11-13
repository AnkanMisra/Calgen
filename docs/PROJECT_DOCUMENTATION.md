# CalGen - Project Documentation

## 📋 Project Overview

**CalGen** is a sophisticated web application that generates and schedules realistic calendar events in Google Calendar using AI-powered event title generation. The application combines Google Calendar API integration with OpenRouter AI services to create context-aware, diverse events based on user input.

**Version:** 2.0.0
**License:** ISC
**Node.js:** >=18.0.0

## 🏗️ Architecture

The project follows a modern full-stack architecture:

### Backend (Node.js + Express)
- **Main Server:** `backend/server.js` - Core application logic and API endpoints
- **AI Prompts:** `backend/prompts.js` - LLM prompt configurations and templates
- **Calendar Utilities:** `backend/calendarUtils.js` - Scheduling algorithms and time management
- **Authentication:** OAuth2 flow with Google Calendar API
- **AI Integration:** OpenRouter API for event title generation

### Frontend (React + Vite)
- **Framework:** React 19.2.0 with modern hooks
- **Build Tool:** Vite 7.2.2 for fast development
- **Styling:** Tailwind CSS 3.4.18
- **UI Components:** Custom-built components with state management
- **Package Manager:** pnpm

### Key Components
- `App.jsx` - Main application container
- `AuthStatus.jsx` - Authentication state display
- `EventForm.jsx` - Event creation interface
- `EventList.jsx` - Events display and management
- `StatusLog.jsx` - Real-time status updates

## 🚀 Features

### Core Functionality
1. **AI-Powered Event Generation**: Uses OpenRouter API with multiple AI models
2. **Dynamic Event Categories**: User-defined event types instead of fixed categories
3. **Smart Scheduling**: Prevents overlaps and respects user preferences
4. **Timezone Support**: Full timezone compatibility
5. **Bulk Operations**: Create multiple events in parallel

### Authentication & Security
- **Google OAuth2**: Secure authentication with refresh token support
- **Token Management**: Automatic token refresh and validation stored in `config/token.json`
- **Credentials Security**: OAuth credentials stored in `config/` directory (gitignored)
- **Single API Key**: Optimized from 4 keys to 1 with intelligent caching
- **Rate Limiting**: Built-in protection with 60 requests/minute limit

### User Experience
- **Real-time Status**: Live status updates during event creation
- **Progress Tracking**: Visual feedback for AI generation and API calls
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **Responsive Design**: Mobile-friendly interface

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# OpenRouter AI Configuration (Single Key Recommended)
OPENROUTER_API_KEY=sk-or-v1-your-main-openrouter-api-key-here

# Optional: Additional keys for failover (legacy support)
OPENROUTER_API_KEY_2=sk-or-v1-your-second-key-here
OPENROUTER_API_KEY_3=sk-or-v1-your-third-key-here
OPENROUTER_API_KEY_4=sk-or-v1-your-fourth-key-here

# Model Configuration (Free model recommended)
OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp:free

# Application Settings
NODE_ENV=development
PORT=3000
```

**Note:** The application now uses a single API key with intelligent caching and rate limiting. Multiple keys are optional for legacy support.

### Google Calendar Setup

1. **Create Google Cloud Project**
   - Go to Google Cloud Console
   - Create new project or use existing
   - Enable Google Calendar API

2. **Configure OAuth2 Credentials**
   - Create OAuth2 client ID
   - Add authorized redirect URIs: `http://localhost:3000/oauth2callback`
   - Download credentials and save as `config/credentials.json`

3. **Required Scopes**
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### AI Model Configuration

The application supports multiple AI models through OpenRouter. **Free models are recommended:**

```javascript
// Recommended free models (configure in .env)
OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp:free  // Recommended (fast, free, intelligent)
OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free          // Alternative (fast, free)

// Premium models (paid)
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet              // Advanced reasoning
OPENROUTER_MODEL=openai/gpt-4o-mini                       // Balanced performance
```

**Current Optimization:** The system uses a single API key with intelligent 5-minute caching to minimize API calls while maintaining quality.

## 📁 Project Structure

```
Fake-Calender-Filler/
├── 📂 backend/                   # Backend server code
│   ├── server.js                # Main server application
│   ├── server-backup.js         # Server backup
│   ├── prompts.js               # AI prompt configurations
│   ├── calendarUtils.js         # Calendar utilities
│   └── debug-ai.js              # AI debugging tools
├── 📂 config/                    # Configuration (gitignored)
│   ├── credentials.json         # Google OAuth credentials
│   └── token.json               # Generated after auth (auto-created)
├── 📂 frontend/                  # React frontend
│   ├── 📂 src/
│   │   ├── 📂 components/        # React components
│   │   │   ├── AuthStatus.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── EventList.jsx
│   │   │   └── StatusLog.jsx
│   │   ├── App.jsx              # Main app component
│   │   ├── App.css              # App styles
│   │   └── assets/              # Static assets
│   ├── 📂 dist/                  # Production build
│   ├── 📂 public/                # Public files
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── vite.config.js           # Vite configuration
│   └── ...
├── 📂 scripts/                   # Utility scripts
│   ├── deploy.sh                # Deployment script
│   ├── run-tests.sh             # Test runner
│   ├── test-events.js           # Event testing
│   └── test-runner.js           # Test orchestration
├── 📂 docs/                      # Documentation
│   ├── PROJECT_DOCUMENTATION.md
│   ├── PROJECT_STATUS_REPORT.md
│   └── TESTING_GUIDE.md
├── 📂 tests/                     # Test files
├── 📂 public/                    # Static files (legacy)
│   ├── index.html               # Basic HTML interface
│   └── authorized.html          # Authorization callback
├── package.json                 # Backend dependencies
├── .env                         # Environment variables
└── README.md                    # Project documentation
```

## 🔄 Development Workflow

### Installation

```bash
# Install all dependencies
pnpm install:all

# Development mode (both frontend and backend)
pnpm dev:full

# Backend only
pnpm dev

# Frontend only
pnpm frontend
```

### Build Process

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Common Scripts

```bash
# Start production server
pnpm start

# Clean build files
pnpm clean

# Create server backup
pnpm backup

# Check authentication status
pnpm status

# Development with hot reload
pnpm dev:full
```

## 🧩 Core Components

### Event Generation Engine

The AI-powered event generation system:

1. **Prompt Engineering**: Sophisticated prompts that generate realistic events
2. **Fallback Mechanism**: Pre-defined event templates when AI fails
3. **Category Intelligence**: Smart categorization based on user input
4. **Duration Optimization**: Appropriate event durations based on context

### Scheduling Algorithm

Intelligent event scheduling with:

- **Overlap Prevention**: Checks existing events to avoid conflicts
- **Time Distribution**: Events spread evenly across date range
- **Working Hours**: Respects user-defined working hours
- **Buffer Time**: Configurable gaps between events
- **Timezone Support**: Full timezone compatibility

### Authentication Flow

Secure OAuth2 implementation:

1. **Initial Auth**: User redirects to Google for authorization
2. **Token Storage**: Access and refresh tokens saved securely
3. **Automatic Refresh**: Tokens refreshed automatically before expiry
4. **User Info**: Fetch user profile using Google People API
5. **Logout**: Clean token removal

## 📊 API Endpoints

### Authentication
- `GET /auth` - Initiate Google OAuth flow
- `GET /oauth2callback` - Handle OAuth callback
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout and clear tokens

### Event Management
- `POST /api/events` - Create new events
- `GET /api/events/created` - List created events
- `DELETE /api/events` - Delete all created events

### Legacy Endpoints
- `POST /create-events` - Legacy event creation (backward compatible)

## 🎨 UI Components

### AuthStatus Component
- Displays user authentication state
- Shows user profile information
- Provides login/logout buttons
- Real-time auth status updates

### EventForm Component
- Event creation form with validation
- Date range selection
- Event count control
- User input for AI generation
- Timezone selection
- Start time preferences

### EventList Component
- Displays created events
- Bulk delete functionality
- Event filtering and search
- Status indicators
- Pagination support

### StatusLog Component
- Real-time status updates
- Progress indicators
- Error logging
- Performance metrics
- Debug information

## 🔒 Security Considerations

### Data Protection
- **Token Security**: Secure storage of OAuth tokens in `config/` directory (gitignored)
- **Single API Key**: Simplified from 4 keys to 1 with intelligent optimization
- **Environment Variables**: Sensitive data in `.env` files (never committed)
- **Config Directory**: All credentials isolated in `config/` folder
- **HTTPS Enforcement**: Production SSL requirement

### Rate Limiting
- **AI API Limits**: Intelligent caching (5-minute cache) reduces API calls by ~60%
- **Conservative Rate Limiting**: 60 requests/minute with graceful degradation
- **Google API Quotas**: Respects Google Calendar API limits with batch processing
- **Request Throttling**: 3-event batches with 2-second delays between batches
- **Exponential Backoff**: 1s, 2s, 4s retry intervals for recoverable errors

### Error Handling
- **Graceful Degradation**: Fallback to predefined events when AI fails
- **Retry Logic**: Exponential backoff (1s, 2s, 4s) for transient failures
- **Smart Caching**: Reduces redundant AI API calls by ~60%
- **User Feedback**: Clear, actionable error messages with status codes
- **Logging**: Comprehensive error logging with detailed diagnostics

## 🧪 Testing & Debugging

### Development Tools
- **Chrome DevTools**: Browser debugging
- **React DevTools**: Component inspection
- **Network Tab**: API call monitoring
- **Console Logging**: Detailed application logs

### Common Debug Scenarios

#### Authentication Issues
```bash
# Check token status
pnpm status

# Clear and re-authenticate
rm config/token.json
# Visit /auth again
```

#### AI API Issues
```bash
# Check API key configuration
echo $OPENROUTER_API_KEY

# Test API connectivity
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
     https://openrouter.ai/api/v1/models
```

#### Calendar API Issues
```bash
# Check Google API status
curl -H "Authorization: Bearer $(cat config/token.json | jq -r '.access_token')" \
     https://www.googleapis.com/calendar/v3/calendars/primary/events
```

## 📈 Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Dynamic imports for components
- **Lazy Loading**: Components load on demand
- **Caching**: Browser and API caching strategies
- **Bundle Analysis**: Optimized bundle sizes

### Backend Optimizations
- **Batch Processing**: 3-event batches with 2-second delays to respect API limits
- **Sequential Processing**: Prevents rate limit errors (improved from 68% to 95%+ success)
- **Intelligent Caching**: 5-minute cache with automatic cleanup
- **Memory Management**: Efficient cleanup and garbage collection
- **Path Resolution**: Absolute paths using `path.join()` for reliability

### AI Performance
- **Intelligent Caching**: 5-minute cache reduces API calls by ~60%
- **Single API Key**: Simplified from 4-key rotation to optimized single-key system
- **Model Selection**: Free Gemini models for zero-cost operation
- **Response Time**: 3-5 seconds average (cached: ~500ms)
- **Timeout Management**: Dynamic timeouts based on request complexity
- **Fallback Strategies**: High-quality predefined events when AI is unavailable

## 🚀 Deployment

### Production Build
```bash
# Build frontend
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

### Environment Setup
- **Production Secrets**: Secure environment variables
- **HTTPS**: SSL certificate configuration
- **Domain**: Custom domain setup
- **Monitoring**: Application monitoring setup

### Hosting Options
- **Vercel**: Easy frontend deployment
- **Heroku**: Full-stack hosting
- **AWS**: Scalable cloud infrastructure
- **Digital Ocean**: Affordable VPS hosting

## 🔧 Troubleshooting

### Common Issues

#### Token Not Found
```
Error: No token file exists
```
**Solution:** Visit `/auth` to authenticate with Google

#### AI API Rate Limit
```
Error: 429 Too Many Requests
```
**Solution:** Application automatically rotates API keys

#### Calendar API Quota
```
Error: Quota exceeded for calendar API
```
**Solution:** Reduce event count or wait for quota reset

#### Date Range Issues
```
Error: Invalid date range
```
**Solution:** Ensure end date is after start date

### Debug Commands

```bash
# Check server logs
tail -f /var/log/app.log

# Monitor API calls
curl -I http://localhost:3000/api/auth/status

# Test event creation
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2024-01-01","endDate":"2024-01-07","count":3,"userInput":"work"}'
```

## 🔄 Updates & Maintenance

### Version History
- **2.0.0**: Major rewrite with AI integration, React frontend
- **1.0.0**: Initial version with basic event generation

### Update Process
1. **Backup Current Version**: `pnpm backup`
2. **Update Dependencies**: `pnpm update`
3. **Test Changes**: Comprehensive testing
4. **Deploy**: Production deployment

### Maintenance Tasks
- **Dependency Updates**: Regular security patches with `pnpm update`
- **Performance Monitoring**: Track success rates (target: 95%+) and response times
- **Backup Management**: Use `pnpm backup` to create timestamped server backups
- **Cache Cleanup**: Automatic 5-minute cache expiration with memory management
- **Config Security**: Ensure `config/` directory remains in `.gitignore`

## 📝 Contributing

### Development Guidelines
- **Code Style**: ESLint configuration enforced
- **Component Architecture**: Maintain component structure
- **API Design**: RESTful API principles
- **Testing**: Comprehensive test coverage

### Feature Requests
- **AI Model Expansion**: Support for more AI models
- **Calendar Integration**: Outlook, Apple Calendar support
- **Event Templates**: Pre-defined event templates
- **Recurring Events**: Support for recurring event patterns

## 📚 Resources

### Documentation
- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

### Community
- **Issues**: GitHub issue tracker
- **Discussions**: Feature requests and discussions
- **Support**: Email support for enterprise users

---

**Note:** This is a humor-focused application designed for entertainment purposes. Always use responsibly and respect others' calendars. The application includes safeguards to prevent abuse and ensures user privacy.
