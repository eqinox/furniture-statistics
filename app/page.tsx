import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <h1 className="text-lg font-semibold">Статистика за поръчки</h1>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/orders">Виж всички</Link>
          </Button>
          <Button asChild>
            <Link href="/orders/new">Добави</Link>
          </Button>
        </div>
      </header>
    </div>
  );
}
