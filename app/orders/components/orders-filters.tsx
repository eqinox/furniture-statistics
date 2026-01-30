"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CityRow, DistrictRow, VillageRow } from "@/lib/actions";

type CompletionOptions = { year: string; months: string[] };

type OrdersFiltersProps = {
  completionOptions: CompletionOptions[];
  cities: CityRow[];
  districts: DistrictRow[];
  villages: VillageRow[];
};

export function OrdersFilters({
  completionOptions,
  cities,
  districts,
  villages,
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
  const [debouncedPriceValue, setDebouncedPriceValue] = React.useState(priceValue);
  const [debouncedName, setDebouncedName] = React.useState(name);
  const lastQueryRef = React.useRef<string | null>(null);

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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceValue(priceValue);
    }, 800);
    return () => clearTimeout(timer);
  }, [priceValue]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(name);
    }, 800);
    return () => clearTimeout(timer);
  }, [name]);

  const monthsForYear =
    completionOptions.find((option) => option.year === year)?.months ?? [];

  React.useEffect(() => {
    if (filterType === "yearMonth" && month && !monthsForYear.includes(month)) {
      setMonth("");
    }
  }, [filterType, month, monthsForYear]);

  const selectedCity = React.useMemo(() => {
    if (locationType !== "city" || !locationName) return null;
    return (
      cities.find(
        (city) => city.name.toLowerCase() === locationName.toLowerCase(),
      ) ?? null
    );
  }, [cities, locationName, locationType]);

  const availableDistricts = React.useMemo(() => {
    if (!selectedCity) return [];
    return districts.filter((item) => item.city_id === selectedCity.id);
  }, [districts, selectedCity]);

  const applyFilters = (params: URLSearchParams) => {
    const nextQuery = params.toString();
    if (nextQuery === lastQueryRef.current) {
      return;
    }
    lastQueryRef.current = nextQuery;
    router.push(`/orders?${nextQuery}`);
  };

  React.useEffect(() => {
    const params = new URLSearchParams();
    params.set("filter", filterType);

    if (filterType === "year" && year) {
      params.set("year", year);
    }
    if (filterType === "yearMonth" && year && month) {
      params.set("year", year);
      params.set("month", month);
    }
    if (filterType === "yearMonth" && year && !month) {
      return;
    }
    if (filterType === "price" && debouncedPriceValue) {
      params.set("priceComparison", priceComparison);
      params.set("priceValue", debouncedPriceValue);
    }
    if (filterType === "location") {
      if (locationType) params.set("locationType", locationType);
      if (locationName) params.set("locationName", locationName);
      if (locationType === "city" && district && district !== "all") {
        params.set("district", district);
      }
    }
    if (filterType === "name" && debouncedName) {
      params.set("name", debouncedName);
    }

    applyFilters(params);
  }, [
    filterType,
    year,
    month,
    priceComparison,
    debouncedPriceValue,
    locationType,
    locationName,
    district,
    debouncedName,
  ]);

  const resetFilters = () => {
    router.push("/orders");
    lastQueryRef.current = null;
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
      <div className="flex flex-wrap gap-3">
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
              <Select
                value={locationType}
                onValueChange={(value) => {
                  setLocationType(value);
                  setLocationName("");
                  setDistrict("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Изберете" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">Град</SelectItem>
                  <SelectItem value="village">Село</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {locationType === "city" ? (
              <div>
                <label className="text-sm font-medium">Град</label>
                <Select
                  value={locationName || "none"}
                  onValueChange={(value) => {
                    setLocationName(value === "none" ? "" : value);
                    setDistrict("all");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете град" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не е избрано</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {locationType === "village" ? (
              <div>
                <label className="text-sm font-medium">Село</label>
                <Select
                  value={locationName || "none"}
                  onValueChange={(value) =>
                    setLocationName(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете село" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не е избрано</SelectItem>
                    {villages.map((village) => (
                      <SelectItem key={village.id} value={village.name}>
                        {village.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {locationType === "city" ? (
              <div>
                <label className="text-sm font-medium">Квартал</label>
                <Select
                  value={district}
                  onValueChange={setDistrict}
                  disabled={!selectedCity}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedCity ? "Изберете квартал" : "Изберете град"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всички</SelectItem>
                    {availableDistricts.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
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
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Изчисти
        </button>
      </div>
    </div>
  );
}
