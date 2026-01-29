import { z } from "zod";

const optionalNumberString = z
  .string()
  .trim()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      return !Number.isNaN(Number(value)) && Number(value) >= 0;
    },
    { message: "Въведете валидно число." },
  );

export const orderFormSchema = z
  .object({
    name: z.string().trim().min(1, "Името е задължително."),
    locationType: z.enum(["city", "village"]).optional(),
    locationName: z.string().trim().optional(),
    cityId: z.string().trim().optional(),
    cityName: z.string().trim().optional(),
    districtId: z.string().trim().optional(),
    districtName: z.string().trim().optional(),
    finalPrice: optionalNumberString,
    deposit: optionalNumberString,
    isCompleted: z.boolean().optional(),
    orderedAt: z.date().optional(),
    completedAt: z.date().optional(),
    description: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.locationType !== "village") return true;
      return Boolean(data.locationName && data.locationName.trim().length > 0);
    },
    {
      path: ["locationName"],
      message: "Попълнете населено място.",
    },
  )
  .refine(
    (data) => {
      if (data.locationType !== "city") return true;
      if (data.cityId && data.cityId !== "new") return true;
      return Boolean(data.cityName && data.cityName.trim().length > 0);
    },
    {
      path: ["cityName"],
      message: "Попълнете град.",
    },
  );

export type OrderFormValues = z.infer<typeof orderFormSchema>;
