import { z } from "zod";

import { isSubmissionImagePath } from "@/lib/storage/image-paths";

const remoteImageSchema = z.url().max(2000);

export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8).max(128),
  locale: z.enum(["en", "ku", "ar"]),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(6).max(40),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  locale: z.enum(["en", "ku", "ar"]),
});

export const emailSchema = z.object({
  email: z.email().trim().toLowerCase(),
  locale: z.enum(["en", "ku", "ar"]),
});

export const passwordUpdateSchema = z.object({
  password: z.string().min(8).max(128),
  confirmation: z.string().min(8).max(128),
  locale: z.enum(["en", "ku", "ar"]),
}).refine((value) => value.password === value.confirmation, {
  path: ["confirmation"],
  message: "passwords_mismatch",
});

export const propertySchema = z.object({
  title: z.object({
    en: z.string().trim().min(2).max(120),
    ku: z.string().trim().min(2).max(120),
    ar: z.string().trim().min(2).max(120),
  }),
  description: z.object({
    en: z.string().trim().max(2000),
    ku: z.string().trim().max(2000),
    ar: z.string().trim().max(2000),
  }),
  property_type: z.enum(["land", "house", "apartment"]),
  status: z.enum(["available", "reserved", "sold", "construction"]),
  price: z.number().positive().max(999_999_999),
  area_m2: z.number().positive().max(10_000_000),
  address: z.string().trim().min(2).max(240),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  image_url: z.string().trim().max(2000).refine(
    (value) => isSubmissionImagePath(value) || remoteImageSchema.safeParse(value).success,
    "Invalid image URL or managed storage path",
  ),
  payment_options: z.array(z.enum(["cash", "installment", "advance"])).min(1),
  completion_percent: z.number().int().min(0).max(100),
  is_published: z.boolean(),
  project_id: z.uuid().nullable(),
  bedrooms: z.number().int().min(0).max(100).nullable(),
  bathrooms: z.number().int().min(0).max(100).nullable(),
  floors: z.number().int().min(0).max(200).nullable(),
  parking_spaces: z.number().int().min(0).max(1000).nullable(),
  year_built: z.number().int().min(1800).max(2200).nullable(),
  features: z.array(z.string().trim().min(1).max(80)).max(50),
  internal_notes: z.string().trim().max(4000),
});

export const expenseSchema = z.object({
  property_id: z.uuid().nullable(),
  category: z.enum(["materials", "labor", "equipment", "permits", "operations", "other"]),
  amount: z.number().positive().max(999_999_999),
  incurred_on: z.iso.date(),
  vendor: z.string().trim().min(2).max(160),
  notes: z.string().trim().max(1200),
});

export const receiptSchema = z.object({
  property_id: z.uuid().nullable(),
  customer_name: z.string().trim().min(2).max(160),
  customer_phone: z.string().trim().max(40),
  customer_address: z.string().trim().max(240),
  payment_type: z.enum(["cash", "installment", "advance"]),
  amount: z.number().positive().max(999_999_999),
  contract_total: z.number().positive().max(999_999_999).nullable(),
  payment_date: z.iso.date(),
  next_due_date: z.iso.date().nullable(),
  installment_number: z.number().int().positive().max(1000).nullable(),
  notes: z.string().trim().max(1200),
  authorized_by: z.string().trim().min(2).max(160),
});
