export type Role = "admin" | "staff" | "customer";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "demo_paid"
  | "free";
export type PaymentMethod = "onsite" | "stripe" | "demo" | "free";
export type AttendanceStatus =
  | "enrolled"
  | "attended"
  | "absent"
  | "canceled";
export type BookingStatus = "confirmed" | "canceled";
export type SlotStatus = "open" | "closed" | "full";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type EnrollmentStatus = "active" | "completed" | "canceled";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Role;
  line_user_id: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  capacity: number;
  active: boolean;
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  active: boolean;
  created_at: string;
}

export interface BookingSlot {
  id: string;
  lesson_id: string;
  teacher_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  price: number;
  status: SlotStatus;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  attendance_status: AttendanceStatus;
  status: BookingStatus;
  total_price: number;
  memo: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  tags: string[] | null;
  memo: string | null;
  total_bookings: number;
  total_spent: number;
  last_booking_at: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  level: CourseLevel;
  price: number;
  sale_price: number | null;
  duration_minutes: number;
  lesson_count: number;
  instructor_id: string | null;
  published: boolean;
  featured: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  duration_seconds: number;
  order_index: number;
  preview: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string | null;
  course_id: string;
  customer_name: string;
  customer_email: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount_paid: number;
  status: EnrollmentStatus;
  progress_percent: number;
  last_accessed_at: string | null;
  enrolled_at: string;
  completed_at: string | null;
  coupon_code: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
  published_at: string;
  created_at: string;
}

export interface Faq {
  id: string;
  category: string | null;
  question: string;
  answer: string;
  order_index: number;
  published: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "responded" | "closed";
  created_at: string;
}
