export type Role = "admin" | "staff" | "customer" | "teacher" | "student";

export type PlanId = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "demo_subscription"
  | "incomplete";

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
export type LocationType = "offline" | "online" | "hybrid";
export type BookingSource = "web" | "chat" | "admin" | "api";

export type BusinessType =
  | "multi"
  | "learning"
  | "sports"
  | "cooking"
  | "music"
  | "language"
  | "dance"
  | "yoga"
  | "fitness"
  | "art"
  | "business"
  | "other";

export interface SiteConfig {
  id: number;
  product_name: string;
  business_type: BusinessType;
  service_label: string;
  instructor_label: string;
  participant_label: string;
  schedule_label: string;
  primary_color: string;
  timezone: string;
  currency: string;
  locale: string;
  updated_at: string;
  hero_copy?: string | null;
  chat_opening_message?: string | null;
  sample_categories?: string[] | null;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Role;
  line_user_id: string | null;
  organization_id: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  business_type: BusinessType;
  plan: PlanId;
  status: "active" | "suspended" | "closed";
  owner_id: string | null;
  primary_color: string;
  timezone: string;
  currency: string;
  locale: string;
  service_label: string | null;
  instructor_label: string | null;
  participant_label: string | null;
  schedule_label: string | null;
  hero_copy: string | null;
  chat_opening_message: string | null;
  sample_categories: string[] | null;
  logo_url: string | null;
  tagline: string | null;
  website: string | null;
  contact_email: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: PlanId;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  capacity: number;
  active: boolean;
  category: string | null;
  difficulty: string | null;
  location_type: LocationType;
  target_audience: string | null;
  required_items: string | null;
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
  location: string | null;
  online_url: string | null;
  waitlist_enabled: boolean;
  waitlist_count: number;
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
  participant_note: string | null;
  admin_note: string | null;
  source: BookingSource;
  reminder_sent_at: string | null;
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
  industry: string | null;
  level: CourseLevel;
  difficulty: string | null;
  location_type: LocationType;
  target_audience: string | null;
  required_items: string | null;
  active: boolean;
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
