"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CityRow, DistrictRow, OrderInput, OrderRow } from "@/lib/actions";
import { orderFormSchema, OrderFormValues } from "@/lib/validation";
import { DatePickerField } from "./date-picker-field";

type OrderFormProps = {
  action: (input: OrderInput) => Promise<number | void>;
  initialData?: OrderRow | null;
  cities: CityRow[];
  districts: DistrictRow[];
  submitLabel: string;
  redirectBasePath: string;
};

function parseDate(value: string | null) {
  if (!value) return undefined;
  return parse(value, "yyyy-MM-dd", new Date());
}

export function OrderForm({
  action,
  initialData,
  cities,
  districts,
  submitLabel,
  redirectBasePath,
}: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const didInitRef = React.useRef(false);
  const prevCityIdRef = React.useRef<string | undefined>(undefined);

  const resolvedCity =
    initialData?.city_id
      ? {
          id: initialData.city_id,
          name:
            initialData.city_name ??
            initialData.location_name ??
            "София",
        }
      : initialData?.location_type === "city" && initialData.location_name
        ? cities.find(
            (city) =>
              city.name.toLowerCase() ===
              initialData.location_name!.toLowerCase(),
          )
        : null;

  const resolvedDistrict =
    resolvedCity && (initialData?.district_name || initialData?.district)
      ? districts.find(
          (district) =>
            district.city_id === resolvedCity.id &&
            district.name.toLowerCase() ===
              (initialData.district_name ?? initialData.district)!.toLowerCase(),
        )
      : null;

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      locationType: initialData?.location_type ?? undefined,
      locationName:
        initialData?.location_type === "village"
          ? initialData?.location_name ?? ""
          : "",
      cityId: resolvedCity
        ? String(resolvedCity.id)
        : initialData?.location_type === "city"
          ? "new"
          : "",
      cityName:
        resolvedCity?.name ??
        (initialData?.location_type === "city"
          ? initialData?.location_name ?? ""
          : ""),
      districtId: resolvedDistrict ? String(resolvedDistrict.id) : "",
      districtName:
        resolvedDistrict?.name ??
        initialData?.district_name ??
        initialData?.district ??
        "",
      finalPrice:
        initialData?.final_price != null
          ? String(initialData.final_price)
          : "",
      deposit:
        initialData?.deposit != null ? String(initialData.deposit) : "",
      isCompleted: initialData?.is_completed === 1,
      orderedAt: parseDate(initialData?.ordered_at ?? null),
      completedAt: parseDate(initialData?.completed_at ?? null),
      description: initialData?.description ?? "",
    },
  });

  const locationType = form.watch("locationType");
  const selectedCityId = form.watch("cityId") ?? "";
  const selectedCityIdNumber =
    selectedCityId && selectedCityId !== "new" ? Number(selectedCityId) : null;

  const availableDistricts = React.useMemo(() => {
    if (!selectedCityIdNumber) return [];
    return districts.filter((district) => district.city_id === selectedCityIdNumber);
  }, [districts, selectedCityIdNumber]);

  React.useEffect(() => {
    if (!didInitRef.current) {
      didInitRef.current = true;
      return;
    }
    if (locationType !== "city") {
      form.setValue("cityId", "");
      form.setValue("cityName", "");
      form.setValue("districtId", "");
      form.setValue("districtName", "");
      if (!locationType) {
        form.setValue("locationName", "");
      }
      return;
    }
    if (!selectedCityId) {
      form.setValue("cityId", "");
    }
  }, [form, locationType, selectedCityId]);

  React.useEffect(() => {
    if (locationType === "city") {
      if (
        prevCityIdRef.current !== undefined &&
        prevCityIdRef.current !== selectedCityId
      ) {
        form.setValue("districtId", "");
        form.setValue("districtName", "");
      }
    }
    prevCityIdRef.current = selectedCityId;
  }, [form, selectedCityId, locationType]);

  React.useEffect(() => {
    if (!selectedCityIdNumber) return;
    const currentDistrictId = form.getValues("districtId");
    const currentDistrictName = form.getValues("districtName")?.trim();
    if (!currentDistrictId && currentDistrictName) {
      const match = availableDistricts.find(
        (district) =>
          district.name.toLowerCase() === currentDistrictName.toLowerCase(),
      );
      if (match) {
        form.setValue("districtId", String(match.id));
      }
    }
  }, [form, availableDistricts, selectedCityIdNumber]);

  const onSubmit = (values: OrderFormValues) => {
    const parsed = orderFormSchema.parse(values);
    const finalPriceValue = parsed.finalPrice
      ? Number(parsed.finalPrice)
      : null;
    const depositValue = parsed.deposit ? Number(parsed.deposit) : null;
    const cityIdValue =
      parsed.cityId && parsed.cityId !== "new" ? Number(parsed.cityId) : null;
    const districtIdValue = parsed.districtId ? Number(parsed.districtId) : null;
    const payload: OrderInput = {
      name: parsed.name.trim(),
      locationType: parsed.locationType,
      locationName: parsed.locationName?.trim() || null,
      cityId: cityIdValue,
      cityName: parsed.cityId === "new" ? parsed.cityName?.trim() || null : null,
      districtId: districtIdValue,
      districtName: parsed.districtName?.trim() || null,
      finalPrice: finalPriceValue,
      deposit: depositValue,
      isCompleted: parsed.isCompleted ?? false,
      orderedAt: parsed.orderedAt ? format(parsed.orderedAt, "yyyy-MM-dd") : null,
      completedAt: parsed.completedAt
        ? format(parsed.completedAt, "yyyy-MM-dd")
        : null,
      description: parsed.description?.trim() || null,
    };

    startTransition(async () => {
      const result = await action(payload);
      if (typeof result === "number") {
        router.push(`${redirectBasePath}/${result}`);
        return;
      }
      if (initialData?.id) {
        router.push(`${redirectBasePath}/${initialData.id}`);
      }
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Име</FormLabel>
              <FormControl>
                <Input placeholder="Име на клиента" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип местоположение</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Не е избрано" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Не е избрано</SelectItem>
                    <SelectItem value="city">Град</SelectItem>
                    <SelectItem value="village">Село</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {locationType === "city" ? (
            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Град</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? "" : value);
                      if (value !== "new") {
                        form.setValue("cityName", "");
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете град" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Не е избрано</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={String(city.id)}>
                          {city.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">Нов град</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {locationType === "city" && selectedCityId === "new" ? (
            <FormField
              control={form.control}
              name="cityName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Нов град</FormLabel>
                  <FormControl>
                    <Input placeholder="Например Пловдив" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {locationType === "village" ? (
            <FormField
              control={form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Село</FormLabel>
                  <FormControl>
                    <Input placeholder="Име на селото" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

          {locationType === "city" ? (
            <>
              <FormField
                control={form.control}
                name="districtName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Квартал (текст)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Например Лозенец"
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          form.setValue("districtId", "");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Квартал (избор)</FormLabel>
                <Select
                  onValueChange={(value) => {
                    form.setValue("districtId", value === "none" ? "" : value);
                    const district = availableDistricts.find(
                      (item) => String(item.id) === value,
                    );
                    if (district) {
                      form.setValue("districtName", district.name);
                    }
                  }}
                  value={form.watch("districtId") || "none"}
                  disabled={!selectedCityIdNumber}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedCityIdNumber
                            ? "Изберете квартал"
                            : "Изберете град"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Не е избрано</SelectItem>
                    {availableDistricts.map((district) => (
                      <SelectItem key={district.id} value={String(district.id)}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            </>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="finalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Крайна цена</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Капаро</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isCompleted"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={(value) => field.onChange(Boolean(value))}
                />
              </FormControl>
              <FormLabel className="font-normal">Изпълнена</FormLabel>
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="orderedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата на поръчване</FormLabel>
                <FormControl>
                  <DatePickerField value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Дата на изпълнение</FormLabel>
                <FormControl>
                  <DatePickerField value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Допълнително описание</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Запис..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
