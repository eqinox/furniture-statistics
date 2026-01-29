"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CompletionOptions = { year: string; months: string[] };

type OrdersFiltersProps = {
  completionOptions: CompletionOptions[];
  sofiaDistricts: string[];
};

export function OrdersFilters({
  completionOptions,
  sofiaDistricts,
}: OrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filterType, setFilterType] = React.useState(
    searchParams.get("filter") ?? "all",
  );
  const [year, setYear] = React.useState(searchParams.get("year") ?? "");
  const [month, setMonth] = React.useState(searchParams.get("month") ?? "");
  const [priceComparison, setPriceComparison] = React.useState(
    searchParams.get("priceComparison") ?? "gt",
  );
  const [priceValue, setPriceValue] = React.useState(
    searchParams.get("priceValue") ?? "",
  );
  const [locationType, setLocationType] = React.useState(
    searchParams.get("locationType") ?? "",
  );
  const [locationName, setLocationName] = React.useState(
    searchParams.get("locationName") ?? "",
  );
  const [district, setDistrict] = React.useState(
    searchParams.get("district") ?? "all",
  );
  const [name, setName] = React.useState(searchParams.get("name") ?? "");

  React.useEffect(() => {
    setFilterType(searchParams.get("filter") ?? "all");
    setYear(searchParams.get("year") ?? "");
    setMonth(searchParams.get("month") ?? "");
    setPriceComparison(searchParams.get("priceComparison") ?? "gt");
    setPriceValue(searchParams.get("priceValue") ?? "");
    setLocationType(searchParams.get("locationType") ?? "");
    setLocationName(searchParams.get("locationName") ?? "");
    setDistrict(searchParams.get("district") ?? "all");
    setName(searchParams.get("name") ?? "");
  }, [searchParams]);

  const monthsForYear =
    completionOptions.find((option) => option.year === year)?.months ?? [];

  React.useEffect(() => {
    if (filterType === "yearMonth" && month && !monthsForYear.includes(month)) {
      setMonth("");
    }
  }, [filterType, month, monthsForYear]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("filter", filterType);

    if (filterType === "year" && year) {
      params.set("year", year);
    }
    if (filterType === "yearMonth" && year && month) {
      params.set("year", year);
      params.set("month", month);
    }
    if (filterType === "price" && priceValue) {
      params.set("priceComparison", priceComparison);
      params.set("priceValue", priceValue);
    }
    if (filterType === "location") {
      if (locationType) params.set("locationType", locationType);
      if (locationName) params.set("locationName", locationName);
      if (locationName === "София" && district && district !== "all") {
        params.set("district", district);
      }
    }
    if (filterType === "name" && name) {
      params.set("name", name);
    }

    router.push(`/orders?${params.toString()}`);
  };

  const resetFilters = () => {
    router.push("/orders");
    setFilterType("all");
    setYear("");
    setMonth("");
    setPriceComparison("gt");
    setPriceValue("");
    setLocationType("");
    setLocationName("");
    setDistrict("all");
    setName("");
  };

  return (
    <div className="space-y-4 rounded-md border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Филтър</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Изберете" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички</SelectItem>
              <SelectItem value="year">По година</SelectItem>
              <SelectItem value="yearMonth">По година и месец</SelectItem>
              <SelectItem value="price">По крайна цена</SelectItem>
              <SelectItem value="location">По местоположение</SelectItem>
              <SelectItem value="name">По име</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterType === "year" || filterType === "yearMonth" ? (
          <div>
            <label className="text-sm font-medium">Година</label>
            <Select value={year} onValueChange={(value) => setYear(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Изберете година" />
              </SelectTrigger>
              <SelectContent>
                {completionOptions.map((option) => (
                  <SelectItem key={option.year} value={option.year}>
                    {option.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {filterType === "yearMonth" ? (
          <div>
            <label className="text-sm font-medium">Месец</label>
            <Select value={month} onValueChange={(value) => setMonth(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Изберете месец" />
              </SelectTrigger>
              <SelectContent>
                {monthsForYear.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {filterType === "price" ? (
          <>
            <div>
              <label className="text-sm font-medium">Сравнение</label>
              <Select
                value={priceComparison}
                onValueChange={setPriceComparison}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Изберете" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt">По-голяма от</SelectItem>
                  <SelectItem value="lt">По-малка от</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Крайна цена</label>
              <Input
                type="number"
                value={priceValue}
                onChange={(event) => setPriceValue(event.target.value)}
              />
            </div>
          </>
        ) : null}

        {filterType === "location" ? (
          <>
            <div>
              <label className="text-sm font-medium">Тип</label>
              <Select value={locationType} onValueChange={setLocationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">Град</SelectItem>
                  <SelectItem value="village">Село</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Населено място</label>
              <Input
                value={locationName}
                onChange={(event) => setLocationName(event.target.value)}
                placeholder="Например София"
              />
            </div>
            {locationName === "София" ? (
              <div>
                <label className="text-sm font-medium">Квартал</label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Всички квартали" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички</SelectItem>
                    {sofiaDistricts.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </>
        ) : null}

        {filterType === "name" ? (
          <div>
            <label className="text-sm font-medium">Име</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Търсене по име"
            />
          </div>
        ) : null}
      </div>

      <div className="flex gap-3">
        <Button onClick={applyFilters}>Филтрирай</Button>
        <Button variant="outline" onClick={resetFilters}>
          Изчисти
        </Button>
      </div>
    </div>
  );
}
