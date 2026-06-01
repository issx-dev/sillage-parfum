import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso Legal — SILLAGE",
  description: "Aviso legal y condiciones de uso de SILLAGE Perfumería de Lujo.",
};

export default function AvisoLegalPage() {
  return (
    <main className="pt-32 pb-16 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl mb-6">Aviso Legal</h1>
        <p className="text-gray-mid leading-relaxed">Página en construcción.</p>
      </div>
    </main>
  );
}