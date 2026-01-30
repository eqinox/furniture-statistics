import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getAllDistricts,
  getCities,
  getCompletionOptions,
  getOrders,
  getVillages,
  OrderFilters,
} from "@/lib/actions";
import { OrdersFilters } from "./components/orders-filters";
import { OrdersTable } from "./components/orders-table";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): OrderFilters {
  const filterType =
    (searchParams.filter as OrderFilters["filterType"]) ?? "all";
  const year = searchParams.year as string | undefined;
  const month = searchParams.month as string | undefined;
  const priceComparison = searchParams.priceComparison as "gt" | "lt" | undefined;
  const priceValueRaw = searchParams.priceValue as string | undefined;
  const priceValue = priceValueRaw ? Number(priceValueRaw) : undefined;
  const locationType = searchParams.locationType as "city" | "village" | undefined;
  const locationName = searchParams.locationName as string | undefined;
  const district = searchParams.district as string | undefined;
  const name = searchParams.name as string | undefined;

  return {
    filterType,
    year,
    month,
    priceComparison,
    priceValue: Number.isNaN(priceValue) ? undefined : priceValue,
    locationType,
    locationName,
    district,
    name,
  };
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const [orders, completionOptions, cities, districts, villages] = await Promise.all([
    getOrders(filters),
    getCompletionOptions(),
    getCities(),
    getAllDistricts(),
    getVillages(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Всички поръчки</h1>
            <p className="text-sm text-muted-foreground">
              Общо записи: {orders.length}
            </p>
          </div>
          <Button asChild>
            <Link href="/orders/new">Добави поръчка</Link>
          </Button>
        </header>

        <OrdersFilters
          completionOptions={completionOptions}
          cities={cities}
          districts={districts}
          villages={villages}
        />

        <OrdersTable data={orders} />
      </div>
    </div>
  );
}
