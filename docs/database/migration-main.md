# Migración de alineación — Supabase MAIN (`rgtgzyhyvnuirhliovsu`)

> **ESTADO: PENDIENTE DE APROBACIÓN — NO APLICAR sin OK explícito del usuario.**
> Auditoría: 2026-09-13. Canon: `docs/database/schema.sql` (= preview `hqensmmyjpasurqsuegy`, drift cero).
> Alcance: SOLO DDL de esquema. NO toca datos (12 productos / 36 variantes clásicas se conservan).

## Drift que corrige

| # | Severidad | Drift (main vs canon) |
|---|-----------|------------------------|
| 1 | **ALTA** | `variants.price` es `INTEGER` en main; canon/preview es `NUMERIC(10,2)`. Verificado: los 36 valores actuales son enteros → cast seguro sin pérdida. |
| 2 | **MEDIA** | Faltan policies `Service role can manage products` y `Service role can manage variants` (main solo tiene `catalog_public_read` SELECT). RLS está activo en las 4 tablas en ambos entornos. |
| 3 | **BAJA (cosmético)** | Las policies de lectura se llaman `catalog_public_read` en main vs `Allow public read access to …` en canon (misma semántica `FOR SELECT TO public USING (true)`; se renombran por alineación). |

Sin drift (verificado, no requieren acción): columnas/tipos/resto de tablas (`orders`, `products`, `users` idénticas), PKs, FK `variants_product_id_fkey … ON DELETE CASCADE`, `users_role_check`, todos los índices, extensiones (`pgcrypto`, `unaccent`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `plpgsql` presentes en ambos).

## SQL de alineación (aplicar en orden, una sola transacción)

```sql
BEGIN;

-- 1) Tipo de precio a NUMERIC(10,2) (cast seguro: valores actuales enteros)
ALTER TABLE variants
  ALTER COLUMN price TYPE NUMERIC(10,2) USING price::NUMERIC(10,2);

-- 2) Normalizar policies de catálogo a los nombres del canon
DROP POLICY IF EXISTS "catalog_public_read" ON products;
DROP POLICY IF EXISTS "catalog_public_read" ON variants;

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to variants"
  ON variants FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage variants"
  ON variants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
```

## Verificación post-migración (solo SELECT)

```sql
SELECT column_name, data_type, numeric_precision, numeric_scale
  FROM information_schema.columns
 WHERE table_schema='public' AND table_name='variants' AND column_name='price';
-- esperado: numeric, 10, 2

SELECT tablename, policyname, roles, cmd
  FROM pg_policies
 WHERE schemaname='public' AND tablename IN ('products','variants')
 ORDER BY tablename, policyname;
-- esperado: 4 policies con los nombres del canon

SELECT COUNT(*) FROM variants;  -- esperado: 36 (sin pérdida de filas)
```

## Rollback

- Tipo de columna: `ALTER TABLE variants ALTER COLUMN price TYPE INTEGER USING price::INTEGER;`
  (solo válido si no se han insertado decimales desde la migración).
- Policies: re-crear `catalog_public_read` y dropear las del canon (ver historial de este doc).
