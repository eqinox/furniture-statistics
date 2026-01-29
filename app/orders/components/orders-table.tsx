"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderRow } from "@/lib/actions";

type OrdersTableProps = {
  data: OrderRow[];
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = parse(value, "yyyy-MM-dd", new Date());
  return format(date, "dd.MM.yyyy");
}

function formatLocation(order: OrderRow) {
  if (order.location_type === "city") {
    const cityName = order.city_name ?? order.location_name ?? "";
    const districtName = order.district_name ?? order.district ?? "";
    if (!cityName) return "-";
    if (districtName) {
      return `${cityName} - ${districtName}`;
    }
    return cityName;
  }
  if (order.location_type === "village") {
    return order.location_name ? `Село ${order.location_name}` : "-";
  }
  return order.location_name ?? "-";
}

export function OrdersTable({ data }: OrdersTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const router = useRouter();

  const columns = React.useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Име
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: "location",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Местоположение
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        accessorFn: (row) => formatLocation(row),
        cell: ({ row }) => formatLocation(row.original),
      },
      {
        accessorKey: "final_price",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Крайна цена
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        size: 110,
        cell: ({ row }) =>
          row.original.final_price != null
            ? row.original.final_price.toFixed(2)
            : "-",
      },
      {
        accessorKey: "deposit",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Капаро
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        size: 110,
        cell: ({ row }) =>
          row.original.deposit != null ? row.original.deposit.toFixed(2) : "-",
      },
      {
        accessorKey: "is_completed",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Изпълнена
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        size: 90,
        cell: ({ row }) => (row.original.is_completed ? "Да" : "Не"),
      },
      {
        accessorKey: "ordered_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Дата на поръчване
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        size: 130,
        cell: ({ row }) => formatDate(row.original.ordered_at),
      },
      {
        accessorKey: "completed_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Дата на изпълнение
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        size: 130,
        cell: ({ row }) => formatDate(row.original.completed_at),
      },
      {
        id: "actions",
        header: "Действия",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              onClick={(event) => event.stopPropagation()}
            >
              <Link href={`/orders/${row.original.id}/edit`}>Редактирай</Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.column.id === "final_price" ||
                    header.column.id === "deposit"
                      ? "w-[110px]"
                      : header.column.id === "is_completed"
                        ? "w-[80px]"
                        : header.column.id === "ordered_at" ||
                            header.column.id === "completed_at"
                          ? "w-[140px]"
                          : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => {
                  router.push(`/orders/${row.original.id}`);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={
                      cell.column.id === "final_price" ||
                      cell.column.id === "deposit"
                        ? "w-[110px]"
                        : cell.column.id === "is_completed"
                          ? "w-[80px]"
                          : cell.column.id === "ordered_at" ||
                              cell.column.id === "completed_at"
                            ? "w-[140px]"
                            : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Няма намерени поръчки.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
