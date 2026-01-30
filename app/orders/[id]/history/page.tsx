import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notFound } from "next/navigation";

import { getOrderHistory } from "@/lib/actions";
import { formatBgDate, formatBgDateTime } from "@/lib/date-format";

export const dynamic = "force-dynamic";

type OrderHistoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderHistoryPage({
  params,
}: OrderHistoryPageProps) {
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);
  if (Number.isNaN(orderId)) {
    notFound();
  }
  const history = await getOrderHistory(orderId);
  const fieldLabels: Record<string, string> = {
    name: "Име",
    location_type: "Тип местоположение",
    location_name: "Населено място",
    district: "Квартал",
    city_id: "Град (ID)",
    district_id: "Квартал (ID)",
    final_price: "Крайна цена",
    deposit: "Капаро",
    is_completed: "Изпълнена",
    ordered_at: "Дата на поръчване",
    completed_at: "Дата на изпълнение",
    description: "Описание",
  };

  const formatValue = (field: string, value: string | null) => {
    if (!value) return "—";
    if (field === "is_completed") {
      return value === "1" ? "Да" : "Не";
    }
    if (field === "ordered_at" || field === "completed_at") {
      return formatBgDate(value, { placeholder: "—" });
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              История на промени (#{orderId})
            </h1>
            <p className="text-sm text-muted-foreground">
              Всички промени по избрания запис.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/orders/${orderId}`}>Назад</Link>
          </Button>
        </header>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата на промяна</TableHead>
                <TableHead>Поле</TableHead>
                <TableHead>Стара стойност</TableHead>
                <TableHead>Нова стойност</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length ? (
                history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {formatBgDateTime(row.changed_at, { placeholder: "—" })}
                    </TableCell>
                    <TableCell>{fieldLabels[row.field] ?? row.field}</TableCell>
                    <TableCell>{formatValue(row.field, row.old_value)}</TableCell>
                    <TableCell>{formatValue(row.field, row.new_value)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Няма записани промени.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
