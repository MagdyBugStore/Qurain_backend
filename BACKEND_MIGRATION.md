# Backend Migration from Firestore to MongoDB

This document outlines how the backend now handles all frontend functionality that was previously using Firestore.

## Overview

All Firestore repositories have been replaced with MongoDB models and Express controllers. The backend now provides complete API endpoints for all frontend operations.

## Repository to Controller Mapping

### 1. TeacherRepository → Teacher Controller

**Location:** `src/controllers/teacher.controller.js`

**Endpoints:**
- `GET /api/v1/teachers` - List all approved teachers (with filters)
- `GET /api/v1/teachers/:teacherId` - Get teacher details
- `GET /api/v1/teachers/:teacherId/slots` - Get teacher available slots
- `GET /api/v1/teachers/me/profile` - Get my teacher profile
- `PATCH /api/v1/teachers/me/profile` - Update teacher profile
- `PATCH /api/v1/teachers/me/pricing` - Update session pricing
- `GET /api/v1/teachers/me/qualifications` - Get qualifications
- `POST /api/v1/teachers/me/qualifications` - Save qualifications
- `GET /api/v1/teachers/me/ijazahs` - Get ijazahs
- `POST /api/v1/teachers/me/ijazahs` - Create ijazah
- `PATCH /api/v1/teachers/me/ijazahs/:ijazahId` - Update ijazah
- `DELETE /api/v1/teachers/me/ijazahs/:ijazahId` - Delete ijazah
- `GET /api/v1/teachers/me/availability` - Get availability schedule
- `POST /api/v1/teachers/me/availability` - Save availability schedule
- `POST /api/v1/teachers/me/slots` - Create availability slot
- `PATCH /api/v1/teachers/me/slots/:slotId` - Update slot
- `DELETE /api/v1/teachers/me/slots/:slotId` - Delete slot
- `GET /api/v1/teachers/me/sessions` - Get my sessions
- `GET /api/v1/teachers/me/sessions/completed-count` - Get completed sessions count
- `POST /api/v1/teachers/me/sessions/:sessionId/start` - Start session
- `POST /api/v1/teachers/me/sessions/:sessionId/attendance` - Mark attendance

**Models Used:**
- `Teacher`, `TeacherLanguage`, `TeacherQualification`, `Ijazah`, `Availability`, `AvailabilitySlot`, `Session`, `Review`

### 2. StudentRepository → Student Controller

**Location:** `src/controllers/student.controller.js`

**Endpoints:**
- `GET /api/v1/students/tasks` - Get student tasks
- `GET /api/v1/students/tasks/weekly` - Get weekly tasks
- `POST /api/v1/students/tasks` - Create task
- `PATCH /api/v1/students/tasks/:taskId/status` - Update task status
- `GET /api/v1/students/sessions/upcoming` - Get upcoming session
- `GET /api/v1/students/sessions` - Get student sessions
- `GET /api/v1/students/memorization-logs` - Get memorization logs
- `POST /api/v1/students/memorization-logs` - Create memorization log
- `GET /api/v1/students/activities` - Get student activities
- `POST /api/v1/students/activities` - Create activity
- `GET /api/v1/students/stats` - Get student statistics

**Models Used:**
- `Student`, `StudentTask`, `MemorizationLog`, `StudentActivity`, `Session`

### 3. Wallet Service → Wallet Controller

**Location:** `src/controllers/wallet.controller.js`

**Endpoints:**
- `GET /api/v1/wallet` - Get wallet data (balance, transactions, withdrawal requests)
- `GET /api/v1/wallet/transactions` - Get transactions
- `GET /api/v1/wallet/withdrawal-requests` - Get withdrawal requests
- `POST /api/v1/wallet/withdrawal-requests` - Create withdrawal request
- `PATCH /api/v1/wallet/balance` - Update wallet balance (admin only)

**Models Used:**
- `Wallet`, `Transaction`, `WithdrawalRequest`, `Teacher`

### 4. Support Service → Support Controller

**Location:** `src/controllers/support.controller.js`

**Endpoints:**
- `GET /api/v1/support` - Get support tickets
- `GET /api/v1/support/:ticketId` - Get single ticket
- `POST /api/v1/support` - Create support ticket
- `POST /api/v1/support/:ticketId/replies` - Add reply to ticket
- `PATCH /api/v1/support/:ticketId/status` - Update ticket status

**Models Used:**
- `SupportTicket`

### 5. Review Controller

**Location:** `src/controllers/review.controller.js`

**Endpoints:**
- `POST /api/v1/reviews/sessions/:sessionId/review` - Submit review
- `GET /api/v1/reviews/teachers/:teacherId/reviews` - Get teacher reviews
- `GET /api/v1/reviews/teachers/:teacherId/rating` - Get teacher rating

**Models Used:**
- `Review`, `Teacher`, `Session`

### 6. RoomRepository → Room Controller

**Location:** `src/controllers/room.controller.js`

**Endpoints:**
- `POST /api/v1/rooms/create` - Create video room
- `POST /api/v1/rooms/:roomId/join` - Join room
- `POST /api/v1/rooms/:roomId/leave` - Leave room
- `GET /api/v1/rooms/:roomId` - Get room info

**Models Used:**
- `Room`, `Session`

## New MongoDB Models Created

1. **Wallet** - Teacher wallet balance
2. **Transaction** - Wallet transactions (credit/debit)
3. **WithdrawalRequest** - Withdrawal requests from teachers
4. **SupportTicket** - Support tickets with replies
5. **StudentTask** - Student tasks/assignments
6. **MemorizationLog** - Student memorization progress logs
7. **StudentActivity** - Student activity feed

## Authentication

All endpoints (except public ones) require JWT authentication via Bearer token:

```
Authorization: Bearer <token>
```

## Response Format

All endpoints follow the standard response format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {}
}
```

## Real-time Updates

For real-time updates (previously handled by Firestore subscriptions), the backend uses:
- **WebSocket (Socket.io)** for room updates
- **Polling** can be implemented for other real-time needs
- Future: Consider adding WebSocket support for notifications, ticket updates, etc.

## Migration Checklist

- [x] Create all MongoDB models
- [x] Implement all teacher controller functions
- [x] Implement all student controller functions
- [x] Implement wallet controller
- [x] Implement support controller
- [x] Implement review controller
- [x] Update room controller
- [x] Create all routes
- [x] Update user controller to use MongoDB
- [ ] Add WebSocket support for real-time updates
- [ ] Add pagination to list endpoints
- [ ] Add rate limiting
- [ ] Add comprehensive error handling
- [ ] Write integration tests

## Next Steps

1. Update frontend API services to use the new backend endpoints
2. Remove Firestore dependencies from frontend
3. Test all endpoints
4. Add real-time WebSocket support where needed
5. Implement caching for frequently accessed data
6. Add monitoring and logging
