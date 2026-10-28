import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";

/**
 * Campos del formulario de cupón (crear + editar comparten todo menos el
 * código, que en edición es fijo y viaja en hidden).
 */
export interface CouponFormValues {
  code: string;
  percentOff: number;
  firstOrderOnly: boolean;
  active: boolean;
}

function CheckRow({
  id,
  name,
  label,
  hint,
  defaultChecked,
}: {
  id: string;
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 shrink-0 accent-[#8a6d2b]"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-warm-900">
          {label}
        </label>
        <p className="text-xs text-warm-500">{hint}</p>
      </div>
    </div>
  );
}

export function CouponFormFields({ initial }: { initial?: CouponFormValues }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="c-code" className="mb-1 block text-sm font-medium text-warm-900">
          Código
        </label>
        {initial ? (
          <>
            <input type="hidden" name="code" value={initial.code} />
            <p className="rounded-card border border-warm-300 bg-warm-100 px-3 py-2 font-mono text-sm font-bold text-warm-900">
              {initial.code}
            </p>
            <p className="mt-1 text-xs text-warm-500">El código no se puede cambiar una vez creado.</p>
          </>
        ) : (
          <>
            <Input
              id="c-code"
              name="code"
              required
              minLength={3}
              maxLength={24}
              placeholder="VERANO15"
              autoComplete="off"
              className="font-mono uppercase"
            />
            <p className="mt-1 text-xs text-warm-500">Mayúsculas, dígitos y guiones.</p>
          </>
        )}
      </div>
      <div>
        <label htmlFor="c-percent" className="mb-1 block text-sm font-medium text-warm-900">
          Descuento (%)
        </label>
        <Input
          id="c-percent"
          name="percentOff"
          type="number"
          required
          min={1}
          max={90}
          step={1}
          defaultValue={initial?.percentOff ?? 10}
          className="max-w-32"
        />
        <p className="mt-1 text-xs text-warm-500">Entre 1% y 90%. Se aplica sobre el total con bundles.</p>
      </div>
      <CheckRow
        id="c-first"
        name="firstOrderOnly"
        label="Solo primer pedido"
        hint="Como BIENVENIDA10: exige email sin pedidos previos."
        defaultChecked={initial?.firstOrderOnly ?? false}
      />
      <CheckRow
        id="c-active"
        name="active"
        label="Activo"
        hint="Desactívalo para retirarlo sin borrarlo."
        defaultChecked={initial?.active ?? true}
      />
    </div>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button type="submit" size="sm">
      {children}
    </Button>
  );
}
