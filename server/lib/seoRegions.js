/**
 * Region slug → visningsnamn och SEO-metadata.
 * Slug används i URL: /lastbilsjobb/stockholm
 */
export const regionPages = [
  { slug: "stockholm",        name: "Stockholm",         desc: "Lastbilsjobb i Stockholms län — CE, C och distribution." },
  { slug: "skane",            name: "Skåne",             desc: "Lastbilsjobb i Skåne — fjärrkörning, distribution och tankbil." },
  { slug: "vastra-gotaland",  name: "Västra Götaland",   desc: "Lastbilsjobb i Västra Götaland — Göteborg och hela regionen." },
  { slug: "halland",          name: "Halland",           desc: "Lastbilsjobb i Halland — CE och C-tjänster längs västkusten." },
  { slug: "ostergotland",     name: "Östergötland",      desc: "Lastbilsjobb i Östergötland — Linköping, Norrköping och omnejd." },
  { slug: "jonkoping",        name: "Jönköping",         desc: "Lastbilsjobb i Jönköpings län — logistikregion mitt i Sverige." },
  { slug: "kronoberg",        name: "Kronoberg",         desc: "Lastbilsjobb i Kronobergs län — Växjö och Småland." },
  { slug: "kalmar",           name: "Kalmar",            desc: "Lastbilsjobb i Kalmar län — Öland och sydöstra Sverige." },
  { slug: "blekinge",         name: "Blekinge",          desc: "Lastbilsjobb i Blekinge — Karlskrona och sydkusten." },
  { slug: "gotland",          name: "Gotland",           desc: "Lastbilsjobb på Gotland — lokaltransport och distribution." },
  { slug: "sodermanland",     name: "Södermanland",      desc: "Lastbilsjobb i Södermanlands län — Eskilstuna och Nyköping." },
  { slug: "orebro",           name: "Örebro",            desc: "Lastbilsjobb i Örebro län — logistikknutpunkt i Mellansverige." },
  { slug: "vastmanland",      name: "Västmanland",       desc: "Lastbilsjobb i Västmanland — Västerås och hela länet." },
  { slug: "dalarna",          name: "Dalarna",           desc: "Lastbilsjobb i Dalarna — Falun, Borlänge och omnejd." },
  { slug: "varmland",         name: "Värmland",          desc: "Lastbilsjobb i Värmland — Karlstad och omnejd." },
  { slug: "uppsala",          name: "Uppsala",           desc: "Lastbilsjobb i Uppsala — distribution och fjärrtransport." },
  { slug: "gavleborg",        name: "Gävleborg",         desc: "Lastbilsjobb i Gävleborg — Gävle, Sandviken och norrut." },
  { slug: "vasternorrland",   name: "Västernorrland",    desc: "Lastbilsjobb i Västernorrland — Sundsvall och Härnösand." },
  { slug: "jamtland",         name: "Jämtland",          desc: "Lastbilsjobb i Jämtlands län — Östersund och fjällen." },
  { slug: "vasterbotten",     name: "Västerbotten",      desc: "Lastbilsjobb i Västerbotten — Umeå och skogstransport." },
  { slug: "norrbotten",       name: "Norrbotten",        desc: "Lastbilsjobb i Norrbotten — Luleå och hela det nordligaste länet." },
];

/** Slå upp region-objekt från URL-slug */
export function getRegionBySlug(slug) {
  return regionPages.find((r) => r.slug === slug) ?? null;
}

/** Slå upp slug från visningsnamn (t.ex. från job.region) */
export function getSlugByName(name) {
  return regionPages.find((r) => r.name === name)?.slug ?? null;
}
