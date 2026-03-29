# MongoDB Models

This directory contains all Mongoose models for the Qurain backend application.

## Models Overview

### Core Models
- **User** - Base user model for all user types (student, teacher, admin)
- **Student** - Student-specific data
- **Teacher** - Teacher-specific data and approval status

### Teacher-Related Models
- **TeacherLanguage** - Languages a teacher can teach
- **TeacherQualification** - Teacher qualifications and certifications
- **Ijazah** - Ijazah certificates for teachers
- **Availability** - Teacher availability schedule (7x12 grid)
- **AvailabilitySlot** - Individual time slots for booking

### Session Models
- **Session** - One-to-one learning sessions
- **AttendanceRecord** - Attendance tracking for sessions

### Subscription & Payment Models
- **SubscriptionPlan** - Available subscription plans (starter, premium, elite)
- **Subscription** - Student subscriptions to teachers
- **Payment** - Payment records
- **Refund** - Refund records

### Review & Communication Models
- **Review** - Student reviews of teachers
- **Notification** - User notifications
- **AuditLog** - System audit logs

### Media & Room Models
- **Room** - Video room/meeting rooms
- **UploadedFile** - Uploaded images and videos metadata

## Relationships

- User 1:1 Student
- User 1:1 Teacher
- Teacher 1:N AvailabilitySlots
- Teacher 1:1 Availability (schedule grid)
- Student N:M Teacher (through Sessions)
- Session 1:0..1 Review
- Student 1:N Subscriptions
- Student 1:N Payments
- Session 1:0..1 Payment (pay per session)
- Subscription 1:N Payments

## Usage Example

```javascript
import { User, Teacher, Session } from './models/index.js';

// Create a user
const user = new User({
  email: 'user@example.com',
  fullName: 'John Doe',
  passwordHash: hashedPassword,
  role: 'student',
});
await user.save();

// Find with population
const teacher = await Teacher.findOne({ userId: user._id })
  .populate('userId');

// Query with filters
const sessions = await Session.find({
  studentId: studentId,
  status: 'scheduled',
  scheduledStart: { $gte: new Date() },
}).populate('teacherId', 'userId');
```

## Indexes

All models include appropriate indexes for common query patterns:
- User: `{ role, isActive }`, `{ email }`, `{ phone }`
- Teacher: `{ approvalStatus, ratingAvg }`
- Session: `{ studentId, scheduledStart }`, `{ teacherId, scheduledStart }`
- Payment: `{ studentId, createdAt }`
- Subscription: `{ studentId, status, expiresAt }`

## Validation

Models include:
- Required field validation
- Enum validation for status fields
- Custom validators (e.g., email format, date ranges)
- Pre-save hooks for business logic validation
