import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getAllDistricts,
  getCities,
  getOrderById,
  getVillages,
  updateOrder,
} from "@/lib/actions";
import { OrderForm } from "../../components/order-form";

export const dynamic = "force-dynamic";

type OrderEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderEditPage({ params }: OrderEditPageProps) {
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);
  if (Number.isNaN(orderId)) {
    notFound();
  }

  const [order, cities, districts, villages] = await Promise.all([
    getOrderById(orderId),
    getCities(),
    getAllDistricts(),
    getVillages(),
  ]);

  if (!order) {
    notFound();
  }

  async function updateAction(payload: Parameters<typeof updateOrder>[1]) {
    "use server";
    await updateOrder(orderId, payload);
    return orderId;
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Редакция на поръчка</h1>
            <p className="text-sm text-muted-foreground">
              Обновете информацията и запазете промените.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/orders/${orderId}`}>Назад</Link>
          </Button>
        </header>

        <OrderForm
          action={updateAction}
          initialData={order}
          cities={cities}
          districts={districts}
          villages={villages}
          submitLabel="Запази промените"
          redirectBasePath="/orders"
        />
      </div>
    </div>
  );
}
