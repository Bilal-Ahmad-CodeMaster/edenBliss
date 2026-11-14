const photo = (id: string, width = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;

export const categorySeed = [
  {
    name: "Women",
    slug: "women",
    description:
      "Linen, silk, and wool cut with a long line. Pieces for days that begin slowly and stay well dressed.",
    imageUrl: photo("photo-1483985988355-763728e1935b"),
    parent: null,
  },
  {
    name: "Men",
    slug: "men",
    description:
      "Tailoring with a quiet shoulder and knitwear that keeps its shape. Cloth chosen for weight, not noise.",
    imageUrl: photo("photo-1507679799987-c73779587ccf"),
    parent: null,
  },
  {
    name: "Dresses",
    slug: "dresses",
    description: "Columns and midis in washed linen and fluid silk, finished with a hem that moves when you walk.",
    imageUrl: photo("photo-1496747611176-843222e1e57c"),
    parent: "women",
  },
  {
    name: "Blouses",
    slug: "blouses",
    description: "Soft necks, covered buttons, and silk that catches the light without shining.",
    imageUrl: photo("photo-1564257631407-4deb1f99d992"),
    parent: "women",
  },
  {
    name: "Skirts",
    slug: "skirts",
    description: "Pleats pressed by hand and waistbands cut to sit easily through a long afternoon.",
    imageUrl: photo("photo-1583496661160-fb5886a0aaaa"),
    parent: "women",
  },
  {
    name: "Trousers",
    slug: "trousers",
    description: "Wide legs and high rises in linen that creases honestly and cools the day.",
    imageUrl: photo("photo-1594633312681-425c7b97ccd1"),
    parent: "women",
  },
  {
    name: "Outerwear",
    slug: "outerwear",
    description: "Coats with a long line, cut to wear over a dress without hiding it.",
    imageUrl: photo("photo-1539533018447-63fcce2678e3"),
    parent: "women",
  },
  {
    name: "Tailoring",
    slug: "tailoring",
    description: "Blazers and coats with a clean chest, working buttons, and linings that feel like the cloth outside.",
    imageUrl: photo("photo-1594938298603-c8148c4dae35"),
    parent: "men",
  },
  {
    name: "Knitwear",
    slug: "knitwear",
    description: "Merino and cashmere in gauges you can see. Ribs that recover, shoulders that stay put.",
    imageUrl: photo("photo-1434389677669-e08b4cac3105"),
    parent: "men",
  },
] as const;

type ProductSeed = {
  title: string;
  slug: string;
  storyDescription: string;
  fabricAndCare: string;
  images: string[];
  outfitLookImages: string[];
  category: string;
  subCategory: string;
  basePrice: number;
  discountPercentage: number;
  isFeatured: boolean;
  stock: number[];
};

export const productSeed: ProductSeed[] = [
  {
    title: "Alabaster Linen Column",
    slug: "alabaster-linen-column",
    storyDescription:
      "A sleeveless column in stonewashed linen, cut to fall straight from the shoulder and break softly at the ankle. The cloth is garment-washed in small lots so the ivory stays warm, closer to raw linen than to paper white. Side seams are pressed open and the hem is weighted just enough to keep the line when you walk.",
    fabricAndCare:
      "100% European flax linen, 185 gsm. Cold hand wash or a gentle machine cycle in a mesh bag. Dry flat in shade. Iron on the reverse while the cloth is still damp. Do not tumble dry or bleach.",
    images: [
      photo("photo-1496747611176-843222e1e57c"),
      photo("photo-1515372039744-b8f02a3ae446"),
      photo("photo-1490481651871-ab68de25d43d"),
    ],
    outfitLookImages: [
      photo("photo-1509631179647-0177331693ae"),
      photo("photo-1469334031218-e382a71b716b"),
    ],
    category: "women",
    subCategory: "dresses",
    basePrice: 24800,
    discountPercentage: 0,
    isFeatured: true,
    stock: [6, 10, 8, 4, 2],
  },
  {
    title: "Obsidian Wool Overcoat",
    slug: "obsidian-wool-overcoat",
    storyDescription:
      "A full-length overcoat in dense charcoal wool, with a narrow notch lapel and a hidden button placket. The shoulder is softly padded, the sleeve is set to break at the wrist bone, and the lining is a breathable cupro in warm ivory. It is the coat you put on when the evening turns and you still want the silhouette of the dress underneath.",
    fabricAndCare:
      "80% wool, 20% silk, lined in cupro. Air between wears. Brush with a soft clothes brush. Spot clean. Professional dry clean only. Steam the lapel from the inside; never press a shine onto the cloth.",
    images: [
      photo("photo-1539533018447-63fcce2678e3"),
      photo("photo-1544022613-e87ca75a784a"),
      photo("photo-1487222477894-8943e31ef7b2"),
    ],
    outfitLookImages: [photo("photo-1529139574466-a303027c1d8b"), photo("photo-1483985988355-763728e1935b")],
    category: "women",
    subCategory: "outerwear",
    basePrice: 42000,
    discountPercentage: 0,
    isFeatured: true,
    stock: [3, 5, 5, 3, 2],
  },
  {
    title: "Botanical Silk Blouse",
    slug: "botanical-silk-blouse",
    storyDescription:
      "A covered-button blouse in sandwashed silk the colour of crushed sage. The neck is a soft band, not a collar, and the cuffs close with mother-of-pearl buttons dyed to match the cloth. It is cut with ease through the waist so it can be worn tucked into a trouser or loose over the Alabaster Column.",
    fabricAndCare:
      "100% sandwashed silk. Turn inside out. Cold hand wash with a silk-safe wash, or dry clean. Dry flat, away from sun. Iron on low from the reverse while slightly damp. Store on a padded hanger.",
    images: [
      photo("photo-1564257631407-4deb1f99d992"),
      photo("photo-1551163943-3f6a855d1153"),
      photo("photo-1525507119028-ed4c629a60a3"),
    ],
    outfitLookImages: [photo("photo-1515886657613-9f3515b0c78f")],
    category: "women",
    subCategory: "blouses",
    basePrice: 14500,
    discountPercentage: 15,
    isFeatured: false,
    stock: [8, 12, 9, 5, 3],
  },
  {
    title: "Raw Linen Wide Trouser",
    slug: "raw-linen-wide-trouser",
    storyDescription:
      "A high-rise trouser in undyed linen with a deep pleat and a leg that widens from the knee. The waistband is faced, not lined, so the cloth stays cool, and the hems are left long enough to break once over a sandal. Pockets are set into the side seam and bar-tacked by hand.",
    fabricAndCare:
      "100% linen, 210 gsm, garment washed. Machine wash cold with similar colours. Hang to dry. Iron damp on a hot linen setting. The crease will soften with wear; press it back only if you want the line.",
    images: [
      photo("photo-1594633312681-425c7b97ccd1"),
      photo("photo-1506629082955-511b1aa562c8"),
      photo("photo-1515886657613-9f3515b0c78f"),
    ],
    outfitLookImages: [photo("photo-1469334031218-e382a71b716b")],
    category: "women",
    subCategory: "trousers",
    basePrice: 16800,
    discountPercentage: 0,
    isFeatured: false,
    stock: [5, 9, 9, 6, 3],
  },
  {
    title: "Espresso Tailored Blazer",
    slug: "espresso-tailored-blazer",
    storyDescription:
      "A single-breasted blazer in espresso wool with a natural shoulder and a slightly suppressed waist. Two-button front, working cuff buttons, and a chest canvas that is half-floating so the jacket moves with you. The cloth is a year-round weight, dark enough for evening and quiet enough for the studio.",
    fabricAndCare:
      "100% wool twill, half-canvas construction, cupro lining. Brush after wear. Air overnight on a wide wooden hanger. Dry clean occasionally, never after every wear. Steam, do not iron, the lapel roll.",
    images: [
      photo("photo-1507679799987-c73779587ccf"),
      photo("photo-1594938298603-c8148c4dae35"),
      photo("photo-1617137968427-85924c800a22"),
    ],
    outfitLookImages: [photo("photo-1617127365659-c47fa864d8bc")],
    category: "men",
    subCategory: "tailoring",
    basePrice: 36500,
    discountPercentage: 0,
    isFeatured: true,
    stock: [4, 8, 8, 5, 3],
  },
  {
    title: "Ivory Merino Crew",
    slug: "ivory-merino-crew",
    storyDescription:
      "A fine-gauge merino crew in warm ivory, knitted with a compact shoulder and a rib that holds the hem in place. It is light enough to sit under the Espresso Blazer and substantial enough to be the whole outfit with the wide trouser. The yarn is extra-fine, so the hand is soft without looking fluffy.",
    fabricAndCare:
      "100% extra-fine merino wool, 16.5 micron. Hand wash cold with wool wash. Do not wring. Dry flat, reshaping the rib. Fold, never hang. Pilling can be lifted with a knit comb.",
    images: [
      photo("photo-1434389677669-e08b4cac3105"),
      photo("photo-1576566588028-4147f3842f27"),
      photo("photo-1617127365659-c47fa864d8bc"),
    ],
    outfitLookImages: [photo("photo-1488161628813-04466f872be2")],
    category: "men",
    subCategory: "knitwear",
    basePrice: 12500,
    discountPercentage: 0,
    isFeatured: false,
    stock: [7, 11, 10, 6, 4],
  },
  {
    title: "Sage Pleated Midi",
    slug: "sage-pleated-midi",
    storyDescription:
      "A midi skirt in botanical sage wool crepe, with knife pleats pressed from the hip and a grown-on waistband. The pleats are set so they open when you sit and fall closed when you stand. A short vent at the back hem lets the stride stay easy in a narrow shoe.",
    fabricAndCare:
      "100% wool crepe. Dry clean to keep the pleats. Between cleans, hang overnight from the waistband loops. Steam from a distance if the pleat opens. Avoid perfume directly on the cloth.",
    images: [
      photo("photo-1583496661160-fb5886a0aaaa"),
      photo("photo-1577900232427-18219b9166a0"),
      photo("photo-1490481651871-ab68de25d43d"),
    ],
    outfitLookImages: [photo("photo-1509631179647-0177331693ae"), photo("photo-1529139574466-a303027c1d8b")],
    category: "women",
    subCategory: "skirts",
    basePrice: 18900,
    discountPercentage: 20,
    isFeatured: true,
    stock: [4, 8, 7, 4, 2],
  },
  {
    title: "Midnight Cashmere Overshirt",
    slug: "midnight-cashmere-overshirt",
    storyDescription:
      "An overshirt in midnight cashmere blend, cut like a shirt and finished like a jacket. The collar sits under a blazer or stands on its own, and the cuffs are long enough to turn back once. Patch pockets are placed low, and every edge is bound so the knit cannot curl.",
    fabricAndCare:
      "70% cashmere, 30% silk. Fold and rest it between wears. Spot clean. Professional dry clean when needed. Keep cedar, not mothballs, in the drawer. Do not hang from the shoulders.",
    images: [
      photo("photo-1598033129183-c4f50c736f10"),
      photo("photo-1602810318383-e386cc2a3ccf"),
      photo("photo-1520975916090-3105956dac38"),
    ],
    outfitLookImages: [photo("photo-1490578474895-699cd4e2cf59"), photo("photo-1617137968427-85924c800a22")],
    category: "men",
    subCategory: "knitwear",
    basePrice: 27500,
    discountPercentage: 0,
    isFeatured: false,
    stock: [4, 7, 7, 5, 2],
  },
];
