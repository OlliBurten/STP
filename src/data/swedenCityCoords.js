/**
 * Swedish city → {lat, lon} lookup.
 * Used to compute dx/dy offsets for the zoomed county view in SwedenJobMap.
 *
 * Projection derived from official Wikimedia county SVG (viewBox 0 0 290 660):
 *   svgX = lon * 14.928 - 120.2
 *   svgY = lat * -50.985 + 3469.8
 *
 * dx/dy = city SVG position minus county bounding-box centroid (SWE_LAN_BOX[code].cx/cy)
 */

export const CITY_COORDS = {
  // Stockholm (AB)
  "Stockholm": [18.064, 59.332],
  "Södertälje": [17.626, 59.195],
  "Norrtälje": [18.704, 59.758],
  "Huddinge": [17.984, 59.237],
  "Järfälla": [17.837, 59.432],
  "Nacka": [18.163, 59.311],
  "Solna": [18.001, 59.360],
  "Sundbyberg": [17.972, 59.362],
  "Tyresö": [18.229, 59.244],
  "Lidingö": [18.137, 59.366],
  "Täby": [18.069, 59.444],
  "Upplands Väsby": [17.907, 59.519],
  "Vallentuna": [18.077, 59.535],
  "Haninge": [18.143, 59.168],
  "Nynäshamn": [17.948, 58.904],

  // Uppsala (C)
  "Uppsala": [17.645, 59.858],
  "Enköping": [17.079, 59.635],
  "Tierp": [17.514, 60.341],
  "Östhammar": [18.367, 60.264],
  "Knivsta": [17.793, 59.726],
  "Håbo": [17.527, 59.697],

  // Södermanland (D)
  "Eskilstuna": [16.510, 59.370],
  "Nyköping": [16.992, 58.753],
  "Katrineholm": [16.208, 58.995],
  "Strängnäs": [17.030, 59.378],
  "Gnesta": [17.323, 59.046],

  // Östergötland (E)
  "Linköping": [15.617, 58.411],
  "Norrköping": [16.177, 58.594],
  "Mjölby": [15.130, 58.326],
  "Motala": [15.039, 58.539],
  "Finspång": [15.767, 58.706],
  "Kinda": [15.603, 57.999],

  // Jönköping (F)
  "Jönköping": [14.157, 57.781],
  "Huskvarna": [14.269, 57.788],
  "Värnamo": [14.040, 57.184],
  "Nässjö": [14.694, 57.654],
  "Vetlanda": [15.079, 57.430],
  "Tranås": [14.978, 58.037],

  // Kronoberg (G)
  "Växjö": [14.805, 56.877],
  "Ljungby": [13.940, 56.832],
  "Alvesta": [14.556, 56.899],
  "Markaryd": [13.594, 56.462],

  // Kalmar (H)
  "Kalmar": [16.357, 56.661],
  "Oskarshamn": [16.447, 57.265],
  "Västervik": [16.638, 57.758],
  "Nybro": [15.909, 56.744],
  "Vimmerby": [15.853, 57.666],

  // Gotland (I)
  "Visby": [18.295, 57.637],

  // Blekinge (K)
  "Karlskrona": [15.587, 56.161],
  "Karlshamn": [14.864, 56.171],
  "Ronneby": [15.277, 56.210],
  "Sölvesborg": [14.574, 56.052],

  // Skåne (M)
  "Malmö": [13.002, 55.605],
  "Helsingborg": [12.695, 56.046],
  "Kristianstad": [14.154, 56.031],
  "Lund": [13.191, 55.706],
  "Landskrona": [12.831, 55.870],
  "Hässleholm": [13.764, 56.159],
  "Ängelholm": [12.862, 56.243],
  "Trelleborg": [13.157, 55.376],
  "Ystad": [13.820, 55.429],
  "Eslöv": [13.304, 55.840],
  "Vellinge": [13.017, 55.474],
  "Burlöv": [13.103, 55.632],

  // Halland (N)
  "Halmstad": [12.856, 56.674],
  "Falkenberg": [12.491, 56.906],
  "Varberg": [12.237, 57.106],
  "Kungsbacka": [12.076, 57.483],
  "Laholm": [13.047, 56.511],

  // Västra Götaland (O)
  "Göteborg": [11.967, 57.707],
  "Borås": [12.940, 57.722],
  "Trollhättan": [12.288, 58.284],
  "Skövde": [13.845, 58.389],
  "Uddevalla": [11.921, 58.353],
  "Mölndal": [12.014, 57.656],
  "Lidköping": [13.159, 58.505],
  "Mariestad": [13.825, 58.709],
  "Vänersborg": [12.323, 58.381],
  "Kungsbacka": [12.076, 57.483],
  "Lerum": [12.270, 57.771],
  "Kungälv": [11.976, 57.870],
  "Stenungsund": [11.823, 58.073],
  "Alingsås": [12.533, 57.929],
  "Partille": [12.106, 57.739],
  "Härryda": [12.175, 57.652],
  "Mark": [12.563, 57.527],
  "Falköping": [13.553, 58.179],
  "Tibro": [14.162, 58.422],
  "Töreboda": [14.122, 58.698],

  // Värmland (S)
  "Karlstad": [13.507, 59.379],
  "Kristinehamn": [14.108, 59.310],
  "Arvika": [12.589, 59.653],
  "Filipstad": [14.164, 59.713],
  "Hagfors": [13.648, 60.031],
  "Sunne": [13.146, 59.840],

  // Örebro (T)
  "Örebro": [15.187, 59.274],
  "Kumla": [15.134, 59.128],
  "Karlskoga": [14.524, 59.327],
  "Hallsberg": [15.108, 59.065],
  "Lindesberg": [15.226, 59.592],

  // Västmanland (U)
  "Västerås": [16.544, 59.613],
  "Köping": [15.999, 59.513],
  "Sala": [16.608, 59.920],
  "Fagersta": [15.793, 60.003],
  "Arboga": [15.841, 59.394],

  // Dalarna (W)
  "Falun": [15.633, 60.606],
  "Borlänge": [15.437, 60.486],
  "Ludvika": [15.186, 60.149],
  "Mora": [14.548, 61.006],
  "Avesta": [16.169, 60.144],
  "Hedemora": [15.986, 60.277],
  "Leksand": [14.990, 60.732],
  "Rättvik": [15.117, 60.888],

  // Gävleborg (X)
  "Gävle": [17.142, 60.675],
  "Sandviken": [16.774, 60.617],
  "Söderhamn": [17.060, 61.300],
  "Hudiksvall": [17.113, 61.728],
  "Bollnäs": [16.416, 61.349],
  "Ljusdal": [16.095, 61.831],

  // Västernorrland (Y)
  "Sundsvall": [17.307, 62.391],
  "Härnösand": [17.937, 62.632],
  "Timrå": [17.328, 62.489],
  "Kramfors": [17.780, 62.932],
  "Örnsköldsvik": [18.714, 63.290],

  // Jämtland (Z)
  "Östersund": [14.642, 63.178],
  "Åre": [13.082, 63.397],
  "Strömsund": [15.546, 63.851],
  "Krokom": [14.462, 63.319],

  // Västerbotten (AC)
  "Umeå": [20.263, 63.826],
  "Skellefteå": [20.953, 64.750],
  "Lycksele": [18.671, 64.598],
  "Vilhelmina": [16.656, 64.625],
  "Storuman": [17.108, 65.095],

  // Norrbotten (BD)
  "Luleå": [22.150, 65.584],
  "Kiruna": [20.228, 67.856],
  "Piteå": [21.478, 65.317],
  "Boden": [21.690, 65.825],
  "Gällivare": [20.657, 67.133],
  "Haparanda": [24.135, 65.836],
};

/**
 * SVG-projektion (viewBox 0 0 290 660) — KALIBRERAD AFFIN.
 *
 * Tidigare användes en linjär lon-enbart-projektion som ignorerade att
 * meridianerna konvergerar norrut → öst-kusten/Gotland hamnade fel (upp till
 * ~26 enheter). Den här affina transformen är minstakvadrat-fittad mot kartans
 * faktiska län-positioner (läns geo-center → läns SVG-center), så svgX beror på
 * BÅDE longitud och latitud. Alla testade städer hamnar nu inom sitt län.
 */
const PX = [22.1013, -3.8187, -6.005];   // svgX = PX·[lon, lat, 1]
const PY = [-0.2532, -48.7359, 3355.232]; // svgY = PY·[lon, lat, 1]

export function cityToSVG(lon, lat) {
  return {
    x: PX[0] * lon + PX[1] * lat + PX[2],
    y: PY[0] * lon + PY[1] * lat + PY[2],
  };
}

/**
 * Returns dx/dy offset from the county centroid for a given city name.
 * countyCx/countyCy: the county's centroid from SWE_LAN_BOX.
 * Returns null if city not found.
 */
export function cityOffset(cityName, countyCx, countyCy) {
  const coords = CITY_COORDS[cityName];
  if (!coords) return null;
  const [lon, lat] = coords;
  const { x, y } = cityToSVG(lon, lat);
  return {
    dx: Math.round((x - countyCx) * 10) / 10,
    dy: Math.round((y - countyCy) * 10) / 10,
  };
}
