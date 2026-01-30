"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";

export type OrderRow = {
  id: number;
  name: string;
  location_type: "city" | "village" | null;
  location_name: string | null;
  district: string | null;
  city_id: number | null;
  district_id: number | null;
  city_name: string | null;
  district_name: string | null;
  final_price: number | null;
  deposit: number | null;
  is_completed: number;
  ordered_at: string | null;
  completed_at: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderChangeRow = {
  id: number;
  order_id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
};

export type OrderInput = {
  name: string;
  locationType?: "city" | "village";
  locationName?: string | null;
  villageId?: number | null;
  cityId?: number | null;
  cityName?: string | null;
  districtId?: number | null;
  districtName?: string | null;
  finalPrice?: number | null;
  deposit?: number | null;
  isCompleted?: boolean;
  orderedAt?: string | null;
  completedAt?: string | null;
  description?: string | null;
};

export type OrderFilters = {
  filterType?: "all" | "year" | "yearMonth" | "price" | "location" | "name";
  year?: string;
  month?: string;
  priceComparison?: "gt" | "lt";
  priceValue?: number;
  locationType?: "city" | "village";
  locationName?: string;
  district?: string;
  name?: string;
};

export type CityRow = {
  id: number;
  name: string;
};

export type DistrictRow = {
  id: number;
  city_id: number;
  name: string;
};

export type VillageRow = {
  id: number;
  name: string;
};

type YearRow = {
  year: string;
};

export async function createOrder(input: OrderInput): Promise<number> {
  if (!input.name?.trim()) {
    throw new Error("Името е задължително.");
  }

  const insertCity = db.prepare(`INSERT OR IGNORE INTO cities (name) VALUES (?)`);
  const selectCity = db.prepare(`SELECT id, name FROM cities WHERE name = ?`);
  const insertDistrict = db.prepare(
    `INSERT OR IGNORE INTO districts (city_id, name) VALUES (?, ?)`,
  );
  const selectDistrict = db.prepare(
    `SELECT id, name FROM districts WHERE city_id = ? AND name = ?`,
  );
  const insertVillage = db.prepare(`INSERT OR IGNORE INTO villages (name) VALUES (?)`);
  const selectVillage = db.prepare(`SELECT id, name FROM villages WHERE name = ?`);
  const insertYear = db.prepare(`INSERT OR IGNORE INTO years (year) VALUES (?)`);

  const ensureYear = (dateValue?: string | null) => {
    if (!dateValue) return;
    const yearValue = dateValue.slice(0, 4);
    if (yearValue.length === 4) {
      insertYear.run(yearValue);
    }
  };

  const stmt = db.prepare(`
    INSERT INTO orders
      (name, location_type, location_name, district, city_id, district_id, final_price, deposit, is_completed, ordered_at, completed_at, description, updated_at)
    VALUES
      (@name, @location_type, @location_name, @district, @city_id, @district_id, @final_price, @deposit, @is_completed, @ordered_at, @completed_at, @description, datetime('now', '+2 hours'))
  `);

  const transaction = db.transaction(() => {
    let cityId: number | null = null;
    let cityName: string | null = null;
    let districtId: number | null = null;
    let districtName: string | null = null;

    if (input.locationType === "city") {
      const providedCityName = input.cityName?.trim() || null;
      if (input.cityId) {
        const cityRow = db
          .prepare(`SELECT id, name FROM cities WHERE id = ?`)
          .get(input.cityId) as CityRow | undefined;
        if (cityRow) {
          cityId = cityRow.id;
          cityName = cityRow.name;
        }
      } else if (providedCityName) {
        insertCity.run(providedCityName);
        const cityRow = selectCity.get(providedCityName) as CityRow | undefined;
        if (cityRow) {
          cityId = cityRow.id;
          cityName = cityRow.name;
        }
      }

      const providedDistrictName = input.districtName?.trim() || null;
      if (cityId) {
        if (input.districtId) {
          const districtRow = db
            .prepare(`SELECT id, name FROM districts WHERE id = ?`)
            .get(input.districtId) as DistrictRow | undefined;
          if (districtRow) {
            districtId = districtRow.id;
            districtName = districtRow.name;
          }
        } else if (providedDistrictName) {
          insertDistrict.run(cityId, providedDistrictName);
          const districtRow = selectDistrict.get(
            cityId,
            providedDistrictName,
          ) as DistrictRow | undefined;
          if (districtRow) {
            districtId = districtRow.id;
            districtName = districtRow.name;
          }
        }
      }
    }
    if (input.locationType === "village") {
      const providedVillageName = input.locationName?.trim() || null;
      let villageName: string | null = null;
      if (input.villageId) {
        const villageRow = db
          .prepare(`SELECT id, name FROM villages WHERE id = ?`)
          .get(input.villageId) as VillageRow | undefined;
        if (villageRow) {
          villageName = villageRow.name;
        }
      }
      if (!villageName && providedVillageName) {
        insertVillage.run(providedVillageName);
        const villageRow = selectVillage.get(
          providedVillageName,
        ) as VillageRow | undefined;
        if (villageRow) {
          villageName = villageRow.name;
        }
      }
      return stmt.run({
        name: input.name.trim(),
        location_type: input.locationType ?? null,
        location_name: villageName ?? providedVillageName,
        district: null,
        city_id: null,
        district_id: null,
        final_price: input.finalPrice ?? null,
        deposit: input.deposit ?? null,
        is_completed: input.isCompleted ? 1 : 0,
        ordered_at: input.orderedAt ?? null,
        completed_at: input.completedAt ?? null,
        description: input.description?.trim() || null,
      });
    }

    ensureYear(input.orderedAt ?? null);
    ensureYear(input.completedAt ?? null);

    return stmt.run({
      name: input.name.trim(),
      location_type: input.locationType ?? null,
      location_name:
        input.locationType === "city"
          ? cityName
          : input.locationName?.trim() || null,
      district: input.locationType === "city" ? districtName : null,
      city_id: input.locationType === "city" ? cityId : null,
      district_id: input.locationType === "city" ? districtId : null,
      final_price: input.finalPrice ?? null,
      deposit: input.deposit ?? null,
      is_completed: input.isCompleted ? 1 : 0,
      ordered_at: input.orderedAt ?? null,
      completed_at: input.completedAt ?? null,
      description: input.description?.trim() || null,
    });
  });

  const info = transaction();

  return Number(info.lastInsertRowid);
}

function normalizeValue(value: unknown) {
  if (value === undefined) return null;
  if (value === "") return null;
  if (value === null) return null;
  return String(value);
}

export async function updateOrder(id: number, input: OrderInput): Promise<void> {
  if (!input.name?.trim()) {
    throw new Error("Името е задължително.");
  }
  const existing = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id) as
    | OrderRow
    | undefined;
  if (!existing) {
    throw new Error("Поръчката не е намерена.");
  }

  const next: OrderRow = {
    id: existing.id,
    name: input.name.trim(),
    location_type: input.locationType ?? null,
    location_name: null,
    district: null,
    city_id: null,
    district_id: null,
    city_name: null,
    district_name: null,
    final_price: input.finalPrice ?? null,
    deposit: input.deposit ?? null,
    is_completed: input.isCompleted ? 1 : 0,
    ordered_at: input.orderedAt ?? null,
    completed_at: input.completedAt ?? null,
    description: input.description?.trim() || null,
    created_at: existing.created_at,
    updated_at: existing.updated_at ?? existing.created_at,
  };

  const updateStmt = db.prepare(`
    UPDATE orders SET
      name = @name,
      location_type = @location_type,
      location_name = @location_name,
      district = @district,
      city_id = @city_id,
      district_id = @district_id,
      final_price = @final_price,
      deposit = @deposit,
      is_completed = @is_completed,
      ordered_at = @ordered_at,
      completed_at = @completed_at,
      description = @description,
      updated_at = datetime('now', '+2 hours')
    WHERE id = @id
  `);

  const insertChange = db.prepare(`
    INSERT INTO order_changes (order_id, field, old_value, new_value)
    VALUES (@order_id, @field, @old_value, @new_value)
  `);
  const insertCity = db.prepare(`INSERT OR IGNORE INTO cities (name) VALUES (?)`);
  const selectCity = db.prepare(`SELECT id, name FROM cities WHERE name = ?`);
  const insertDistrict = db.prepare(
    `INSERT OR IGNORE INTO districts (city_id, name) VALUES (?, ?)`,
  );
  const selectDistrict = db.prepare(
    `SELECT id, name FROM districts WHERE city_id = ? AND name = ?`,
  );
  const insertVillage = db.prepare(`INSERT OR IGNORE INTO villages (name) VALUES (?)`);
  const selectVillage = db.prepare(`SELECT id, name FROM villages WHERE name = ?`);
  const insertYear = db.prepare(`INSERT OR IGNORE INTO years (year) VALUES (?)`);

  const ensureYear = (dateValue?: string | null) => {
    if (!dateValue) return;
    const yearValue = dateValue.slice(0, 4);
    if (yearValue.length === 4) {
      insertYear.run(yearValue);
    }
  };

  const transaction = db.transaction(() => {
    if (next.location_type === "city") {
      let cityId: number | null = null;
      let cityName: string | null = null;
      let districtId: number | null = null;
      let districtName: string | null = null;

      const providedCityName = input.cityName?.trim() || null;
      if (input.cityId) {
        const cityRow = db
          .prepare(`SELECT id, name FROM cities WHERE id = ?`)
          .get(input.cityId) as CityRow | undefined;
        if (cityRow) {
          cityId = cityRow.id;
          cityName = cityRow.name;
        }
      } else if (providedCityName) {
        insertCity.run(providedCityName);
        const cityRow = selectCity.get(providedCityName) as CityRow | undefined;
        if (cityRow) {
          cityId = cityRow.id;
          cityName = cityRow.name;
        }
      }

      const providedDistrictName = input.districtName?.trim() || null;
      if (cityId) {
        if (input.districtId) {
          const districtRow = db
            .prepare(`SELECT id, name FROM districts WHERE id = ?`)
            .get(input.districtId) as DistrictRow | undefined;
          if (districtRow) {
            districtId = districtRow.id;
            districtName = districtRow.name;
          }
        } else if (providedDistrictName) {
          insertDistrict.run(cityId, providedDistrictName);
          const districtRow = selectDistrict.get(
            cityId,
            providedDistrictName,
          ) as DistrictRow | undefined;
          if (districtRow) {
            districtId = districtRow.id;
            districtName = districtRow.name;
          }
        }
      }

      next.city_id = cityId;
      next.district_id = districtId;
      next.location_name = cityName;
      next.district = districtName;
    } else if (next.location_type === "village") {
      const providedVillageName = input.locationName?.trim() || null;
      let villageName: string | null = null;
      if (input.villageId) {
        const villageRow = db
          .prepare(`SELECT id, name FROM villages WHERE id = ?`)
          .get(input.villageId) as VillageRow | undefined;
        if (villageRow) {
          villageName = villageRow.name;
        }
      }
      if (!villageName && providedVillageName) {
        insertVillage.run(providedVillageName);
        const villageRow = selectVillage.get(
          providedVillageName,
        ) as VillageRow | undefined;
        if (villageRow) {
          villageName = villageRow.name;
        }
      }
      next.location_name = villageName ?? providedVillageName;
      next.district = null;
    } else {
      next.location_name = null;
      next.district = null;
    }

    if (next.location_type !== "city") {
      next.city_id = null;
      next.district_id = null;
    }

    const changes: Array<{
      field: keyof typeof next;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    (Object.keys(next) as Array<keyof typeof next>).forEach((field) => {
      const oldValue = normalizeValue(
        (existing as Record<string, unknown>)[field],
      );
      const newValue = normalizeValue(next[field]);
      if (oldValue !== newValue) {
        changes.push({ field, oldValue, newValue });
      }
    });

    updateStmt.run({ ...next, id });
    changes.forEach((change) => {
      insertChange.run({
        order_id: id,
        field: change.field,
        old_value: change.oldValue,
        new_value: change.newValue,
      });
    });

    ensureYear(next.ordered_at);
    ensureYear(next.completed_at);
  });

  transaction();
}

export async function getOrderById(id: number): Promise<OrderRow | null> {
  const row = db
    .prepare(
      `
      SELECT
        orders.*,
        cities.name AS city_name,
        districts.name AS district_name
      FROM orders
      LEFT JOIN cities ON orders.city_id = cities.id
      LEFT JOIN districts ON orders.district_id = districts.id
      WHERE orders.id = ?
    `,
    )
    .get(id) as OrderRow | undefined;
  return row ?? null;
}

export async function getOrders(filters: OrderFilters): Promise<OrderRow[]> {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  switch (filters.filterType) {
    case "year": {
      if (filters.year) {
        conditions.push("COALESCE(completed_at, ordered_at) IS NOT NULL");
        conditions.push("substr(COALESCE(completed_at, ordered_at), 1, 4) = ?");
        params.push(filters.year);
      }
      break;
    }
    case "yearMonth": {
      if (filters.year && filters.month) {
        conditions.push("COALESCE(completed_at, ordered_at) IS NOT NULL");
        conditions.push("substr(COALESCE(completed_at, ordered_at), 1, 4) = ?");
        conditions.push("substr(COALESCE(completed_at, ordered_at), 6, 2) = ?");
        params.push(filters.year, filters.month);
      }
      break;
    }
    case "price": {
      if (filters.priceComparison && typeof filters.priceValue === "number") {
        conditions.push("final_price IS NOT NULL");
        conditions.push(
          `final_price ${filters.priceComparison === "gt" ? ">" : "<"} ?`,
        );
        params.push(filters.priceValue);
      }
      break;
    }
    case "location": {
      if (filters.locationType) {
        conditions.push("orders.location_type = ?");
        params.push(filters.locationType);
      }
      if (filters.locationName) {
        if (filters.locationType === "city") {
          conditions.push("(cities.name = ? OR orders.location_name = ?)");
          params.push(filters.locationName.trim(), filters.locationName.trim());
        } else {
          conditions.push("orders.location_name = ?");
          params.push(filters.locationName.trim());
        }
      }
      if (filters.district && filters.locationType === "city") {
        conditions.push("(districts.name = ? OR orders.district = ?)");
        params.push(filters.district.trim(), filters.district.trim());
      }
      break;
    }
    case "name": {
      if (filters.name) {
        conditions.push("orders.name LIKE ?");
        params.push(`%${filters.name.trim()}%`);
      }
      break;
    }
    case "all":
    default:
      break;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const stmt = db.prepare(`
    SELECT
      orders.*,
      cities.name AS city_name,
      districts.name AS district_name
    FROM orders
    LEFT JOIN cities ON orders.city_id = cities.id
    LEFT JOIN districts ON orders.district_id = districts.id
    ${where}
    ORDER BY orders.created_at DESC, orders.id DESC
  `);

  return stmt.all(...params) as OrderRow[];
}

export async function getOrderHistory(orderId: number): Promise<OrderChangeRow[]> {
  return db
    .prepare(`SELECT * FROM order_changes WHERE order_id = ? ORDER BY changed_at DESC`)
    .all(orderId) as OrderChangeRow[];
}

export async function deleteOrder(orderId: number): Promise<void> {
  const existing = db
    .prepare(`SELECT id FROM orders WHERE id = ?`)
    .get(orderId) as { id: number } | undefined;
  if (!existing) {
    throw new Error("Поръчката не е намерена.");
  }

  const transaction = db.transaction(() => {
    db.prepare(`DELETE FROM order_changes WHERE order_id = ?`).run(orderId);
    db.prepare(`DELETE FROM orders WHERE id = ?`).run(orderId);
  });

  transaction();
}

export async function deleteOrderAndRedirect(orderId: number): Promise<void> {
  await deleteOrder(orderId);
  redirect("/orders");
}

export async function getCompletionOptions(): Promise<
  { year: string; months: string[] }[]
> {
  const yearRows = db
    .prepare(`SELECT year FROM years ORDER BY year DESC`)
    .all() as YearRow[];

  const monthsStmt = db.prepare(
    `
    SELECT DISTINCT substr(COALESCE(completed_at, ordered_at), 6, 2) AS month
    FROM orders
    WHERE COALESCE(completed_at, ordered_at) IS NOT NULL
      AND substr(COALESCE(completed_at, ordered_at), 1, 4) = ?
    ORDER BY month DESC
  `,
  );

  return yearRows.map((row) => {
    const monthRows = monthsStmt.all(row.year) as Array<{ month: string }>;
    return {
      year: row.year,
      months: monthRows.map((monthRow) => monthRow.month),
    };
  });
}

export async function getSofiaDistricts(): Promise<string[]> {
  const rows = db
    .prepare(
      `
      SELECT districts.name AS name
      FROM districts
      INNER JOIN cities ON districts.city_id = cities.id
      WHERE cities.name = 'София'
      ORDER BY districts.name
    `,
    )
    .all() as Array<{ name: string }>;

  return rows.map((row) => row.name);
}

export async function getCities(): Promise<CityRow[]> {
  return db.prepare(`SELECT id, name FROM cities ORDER BY name`).all() as CityRow[];
}

export async function getDistrictsByCity(cityId: number): Promise<DistrictRow[]> {
  return db
    .prepare(`SELECT id, city_id, name FROM districts WHERE city_id = ? ORDER BY name`)
    .all(cityId) as DistrictRow[];
}

export async function getAllDistricts(): Promise<DistrictRow[]> {
  return db
    .prepare(`SELECT id, city_id, name FROM districts ORDER BY name`)
    .all() as DistrictRow[];
}

export async function getVillages(): Promise<VillageRow[]> {
  return db.prepare(`SELECT id, name FROM villages ORDER BY name`).all() as VillageRow[];
}
