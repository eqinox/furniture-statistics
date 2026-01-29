import Link from "next/link";
import { notFound } from "next/navigation";
import { format, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { getOrderById } from "@/lib/actions";

export const dynamic = "force-dynamic";

type OrderDetailsPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return format(parse(value, "yyyy-MM-dd", new Date()), "dd.MM.yyyy");
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);
  if (Number.isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Поръчката не е намерена</h1>
              <p className="text-sm text-muted-foreground">
                Няма запис с този номер.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/orders">Назад</Link>
              </Button>
              <Button asChild>
                <Link href="/orders/new">Добави поръчка</Link>
              </Button>
            </div>
          </header>
        </div>
      </div>
    );
  }

  const location =
    order.location_type === "city"
      ? order.city_name || order.location_name
        ? `${order.city_name ?? order.location_name}${
            order.district_name || order.district
              ? ` - ${order.district_name ?? order.district}`
              : ""
          }`
        : "—"
      : order.location_type === "village"
        ? order.location_name
          ? `Село ${order.location_name}`
          : "—"
        : "—";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Поръчка #{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              Детайли за поръчката и информация за клиента.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/orders">Назад</Link>
            </Button>
            <Button asChild>
              <Link href={`/orders/${order.id}/edit`}>Редактирай</Link>
            </Button>
          </div>
        </header>

        <div className="rounded-md border bg-white p-6">
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Име</dt>
              <dd className="text-base font-semibold">{order.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Местоположение
              </dt>
              <dd className="text-base">{location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Крайна цена
              </dt>
              <dd className="text-base">
                {order.final_price != null
                  ? order.final_price.toFixed(2)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Капаро</dt>
              <dd className="text-base">
                {order.deposit != null ? order.deposit.toFixed(2) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Изпълнена
              </dt>
              <dd className="text-base">{order.is_completed ? "Да" : "Не"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Дата на поръчване
              </dt>
              <dd className="text-base">{formatDate(order.ordered_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Дата на изпълнение
              </dt>
              <dd className="text-base">{formatDate(order.completed_at)}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">
                Допълнително описание
              </dt>
              <dd className="text-base">
                {order.description ? order.description : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link href={`/orders/${order.id}/history`}>Виж всички промени</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
