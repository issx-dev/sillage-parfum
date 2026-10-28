export interface PerfumePack {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice: number;
  badge: string;
  itemsCount: number;
  image: string;
  productIds: string[];
}

export const CURATED_PACKS: PerfumePack[] = [
  {
    id: "pack-el-essentials",
    name: "Pack Él — Essentials",
    subtitle: "Trío Masculino Imparable",
    description: "Los 3 best-sellers masculinos del catálogo Chogan: Sauvage (094), One Million (001) y Acqua Di Gio (002).",
    price: 84.00,
    originalPrice: 105.00,
    badge: "Ahorra 21€",
    itemsCount: 3,
    image: "/images/products/chogan-black-authentic-studio-4k.png",
    productIds: ["men-sauvage", "men-one-million", "men-acqua-di-gio"]
  },
  {
    id: "pack-ella-essentials",
    name: "Pack Ella — Essentials",
    subtitle: "Trío Femenino Icónico",
    description: "Las fragancias más deseadas: Libre (122), Good Girl (131) y La Vie Est Belle (042).",
    price: 84.00,
    originalPrice: 105.00,
    badge: "Ahorra 21€",
    itemsCount: 3,
    image: "/images/products/chogan-white-authentic-studio-4k.png",
    productIds: ["women-libre", "women-good-girl", "women-la-vie-est-belle"]
  },
  {
    id: "pack-iconos",
    name: "Pack Iconos — Alta Selección",
    subtitle: "4 Fragancias Emblemáticas",
    description: "Combina lo mejor de dos mundos: Sauvage, One Million, Libre y Good Girl.",
    price: 115.00,
    originalPrice: 140.00,
    badge: "Packs Élite",
    itemsCount: 4,
    image: "/images/products/chogan-black-authentic-studio-4k.png",
    productIds: ["men-sauvage", "men-one-million", "women-libre", "women-good-girl"]
  },
  {
    id: "pack-descubrimiento",
    name: "Pack Descubrimiento 3x30ml",
    subtitle: "Prueba y Encuentra tu Firma",
    description: "Tres perfumes de 30ml para descubrir tu aroma ideal sin comprometerte a un tamaño grande.",
    price: 42.00,
    originalPrice: 54.00,
    badge: "Bestseller Entrada",
    itemsCount: 3,
    image: "/images/products/chogan-black-authentic-studio-4k.png",
    productIds: ["men-bleu-de-chanel", "women-black-opium", "women-la-vie-est-belle"]
  },
  {
    id: "pack-premium",
    name: "Pack Nicho & Luxury",
    subtitle: "Alta Perfumería Privada",
    description: "Tres joyas de autor: Baccarat Rouge 540 (118), Aventus (068) y Naxos (137).",
    price: 145.00,
    originalPrice: 161.00,
    badge: "Edición Nicho",
    itemsCount: 3,
    image: "/images/products/chogan-gold-authentic-studio-4k.png",
    productIds: ["unisex-baccarat-rouge", "unisex-aventus", "luxury-naxos"]
  }
];
