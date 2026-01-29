import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createOrder, getAllDistricts, getCities } from "@/lib/actions";
import { OrderForm } from "../components/order-form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [cities, districts] = await Promise.all([
    getCities(),
    getAllDistricts(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Добави поръчка</h1>
            <p className="text-sm text-muted-foreground">
              Попълнете данните за нова поръчка.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/orders">Назад</Link>
          </Button>
        </header>

        <OrderForm
          action={createOrder}
          cities={cities}
          districts={districts}
          submitLabel="Запази поръчка"
          redirectBasePath="/orders"
        />
      </div>
    </div>
  );
}
