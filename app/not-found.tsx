import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="pt-28 sm:pt-32 pb-16 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-6xl text-gold mb-4">404</h1>
        <h2 className="font-serif text-2xl mb-4">Página no encontrada</h2>
        <p className="text-gray-mid mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
