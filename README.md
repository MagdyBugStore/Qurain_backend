# Qurain Backend API

Backend API server for the Quran Online platform built with Node.js and Express.

## Features

- **Authentication**: JWT-based authentication for students, teachers, and admins
- **Database**: MongoDB with Mongoose ODM
- **File Uploads**: Image and video upload with validation and storage
- **Video Streaming**: HTTP range request support for video streaming
- **Video Rooms**: Live video session management with WebSocket support
- **Payment Processing**: Payment intents and subscription management
- **Admin Panel**: Teacher approval, user management, and reporting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- Set `JWT_SECRET` to a secure random string
- Configure `MONGODB_URI` (default: `mongodb://localhost:27017/qurain`)
- Configure `CORS_ORIGIN` to match your frontend URL

### Running MongoDB

**Local MongoDB:**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**MongoDB Atlas:**
- Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string and update `MONGODB_URI` in `.env`

### Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` by default and automatically connect to MongoDB.

## Database Schema

The application uses MongoDB with Mongoose. All models are located in `src/models/`:

- **User** - Base user accounts
- **Student** - Student profiles
- **Teacher** - Teacher profiles and approval status
- **Session** - Learning sessions
- **Subscription** - Student subscriptions
- **Payment** - Payment records
- **Review** - Teacher reviews
- And more...

See `src/models/README.md` for complete documentation.

## API Structure

All API endpoints are prefixed with `/api/v1`.

### Authentication
- `POST /api/v1/auth/register/student` - Register as student
- `POST /api/v1/auth/register/teacher` - Register as teacher
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update user profile

### Teachers
- `GET /api/v1/teachers` - List teachers (with filters)
- `GET /api/v1/teachers/:teacherId` - Get teacher details
- `GET /api/v1/teachers/:teacherId/slots` - Get teacher slots
- `GET /api/v1/teachers/me/profile` - Get my teacher profile
- `PATCH /api/v1/teachers/me/profile` - Update teacher profile
- `POST /api/v1/teachers/me/slots` - Create availability slot

### Sessions
- `POST /api/v1/sessions/book` - Book a session
- `GET /api/v1/sessions/:sessionId` - Get session details
- `GET /api/v1/sessions/me` - Get my sessions
- `POST /api/v1/sessions/:sessionId/join` - Join session

### Uploads
- `POST /api/v1/uploads/image` - Upload image
- `POST /api/v1/uploads/video` - Upload video
- `GET /api/v1/uploads/stream/:videoId` - Stream video

### Rooms
- `POST /api/v1/rooms/create` - Create video room
- `POST /api/v1/rooms/:roomId/join` - Join room
- `GET /api/v1/rooms/:roomId` - Get room info

### Payments
- `GET /api/v1/payments/options` - Get payment options
- `POST /api/v1/payments/session` - Create payment intent
- `POST /api/v1/payments/subscriptions` - Create subscription

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## File Uploads

### Image Upload
- Max size: 10MB
- Formats: JPEG, PNG, WebP, GIF
- Endpoint: `POST /api/v1/uploads/image`
- Form field: `image`

### Video Upload
- Max size: 50MB (configurable)
- Formats: MP4, WebM, MOV, AVI
- Endpoint: `POST /api/v1/uploads/video`
- Form field: `video`

## Video Streaming

Videos are streamed using HTTP range requests for efficient playback:

```
GET /api/v1/uploads/stream/:videoId
Range: bytes=0-1023
```

## WebSocket

The server includes Socket.io for real-time communication. Connect to:

```
ws://localhost:3000
```

Events:
- `join-room` - Join a video room
- `leave-room` - Leave a video room
- `room-created` - Room created notification
- `user-joined` - User joined room notification
- `user-left` - User left room notification

## Development

### Project Structure

```
Qurain_backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # MongoDB connection
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # Route definitions
│   └── server.js        # Entry point
├── uploads/             # Uploaded files
├── .env                 # Environment variables
└── package.json
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/qurain

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# File Uploads
MAX_FILE_SIZE=52428800
MAX_IMAGE_SIZE=10485760

# CORS
CORS_ORIGIN=http://localhost:5173
```

## TODO

- [x] MongoDB integration with Mongoose
- [x] User authentication with JWT
- [x] Database models for all entities
- [ ] Complete controller implementations
- [ ] Add video transcoding service
- [ ] Integrate payment gateway (Stripe/PayPal)
- [ ] Add video room provider (Agora/Daily.co)
- [ ] Implement email service
- [ ] Add comprehensive error handling
- [ ] Write unit and integration tests
- [ ] Add API documentation (Swagger/OpenAPI)

## License

ISC
