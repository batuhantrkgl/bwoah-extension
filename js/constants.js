/**
 * Application Constants and Mappings
 */

export const DRIVER_MAPPING = {
  1: "Max Verstappen",
  4: "Lando Norris",
  16: "Charles Leclerc",
  44: "Lewis Hamilton",
  63: "George Russell",
  81: "Oscar Piastri",
  14: "Fernando Alonso",
  18: "Lance Stroll",
  22: "Yuki Tsunoda",
  23: "Alex Albon",
  55: "Carlos Sainz",
  27: "Nico Hulkenberg",
  31: "Esteban Ocon",
  10: "Pierre Gasly",
  30: "Liam Lawson",
  87: "Oliver Bearman",
  38: "Gabriel Bortoleto",
  6: "Isack Hadjar",
  43: "Franco Colapinto",
  7: "Jack Doohan",
  12: "Andrea Kimi Antonelli",
  77: "Valtteri Bottas",
  24: "Zhou Guanyu",
  20: "Kevin Magnussen",
  11: "Sergio Perez"
};

export const TEAM_NAME_MAPPING = {
  "Ferrari": "Scuderia Ferrari HP",
  "Red Bull": "Oracle Red Bull Racing",
  "Mercedes": "Mercedes-AMG Petronas F1 Team",
  "McLaren": "McLaren Formula 1 Team",
  "Aston Martin": "Aston Martin Aramco F1 Team",
  "Alpine F1 Team": "BWT Alpine F1 Team",
  "Williams": "Williams Racing",
  "RB F1 Team": "Visa Cash App RB F1 Team",
  "Haas F1 Team": "MoneyGram Haas F1 Team",
  "Sauber": "Stake F1 Team Kick Sauber",
  "Kick Sauber": "Stake F1 Team Kick Sauber",
  "Audi": "Audi F1 Team",
  "Cadillac F1 Team": "Cadillac F1 Team"
};

export const TEAM_URL_SLUGS = {
  "Ferrari": "ferrari",
  "Red Bull": "red-bull-racing",
  "Mercedes": "mercedes",
  "McLaren": "mclaren",
  "Aston Martin": "aston-martin",
  "Alpine F1 Team": "alpine",
  "Williams": "williams",
  "RB F1 Team": "rb",
  "Haas F1 Team": "haas",
  "Sauber": "kick-sauber",
  "Kick Sauber": "kick-sauber",
  "Audi": "audi",
  "Cadillac F1 Team": "cadillac"
};

export const CIRCUIT_SLUGS = {
  "monaco": "monaco",
  "bahrain": "bahrain",
  "saudi": "saudi_arabia",
  "australia": "australia",
  "australian": "australia",
  "japan": "japan",
  "japanese": "japan",
  "china": "china",
  "chinese": "china",
  "miami": "miami",
  "emilia": "emilia_romagna",
  "imola": "emilia_romagna",
  "canada": "canada",
  "canadian": "canada",
  "spain": "spain",
  "spanish": "spain",
  "barcelona": "spain",
  "austria": "austria",
  "austrian": "austria",
  "britain": "great_britain",
  "british": "great_britain",
  "silverstone": "great_britain",
  "hungary": "hungary",
  "hungarian": "hungary",
  "belgium": "belgium",
  "belgian": "belgium",
  "spa": "belgium",
  "netherlands": "netherlands",
  "dutch": "netherlands",
  "zandvoort": "netherlands",
  "italy": "italy",
  "italian": "italy",
  "monza": "italy",
  "azerbaijan": "baku",
  "baku": "baku",
  "singapore": "singapore",
  "united states": "usa",
  "usa": "usa",
  "cota": "usa",
  "austin": "usa",
  "mexico": "mexico",
  "mexican": "mexico",
  "brazil": "brazil",
  "brazilian": "brazil",
  "interlagos": "brazil",
  "las vegas": "las_vegas",
  "qatar": "qatar",
  "lusail": "qatar",
  "abu dhabi": "abu_dhabi",
  "yas marina": "abu_dhabi"
};

export const F1_CIRCUITS_DATA = {
  "bahrain": {
    name: "Bahrain International Circuit",
    location: "Sakhir, Bahrain",
    firstGrandPrix: "2004",
    laps: "57",
    length: "5.412 km",
    raceDistance: "308.24 km",
    lapRecord: "1:31.447 (Pedro de la Rosa)"
  },
  "saudi_arabia": {
    name: "Jeddah Corniche Circuit",
    location: "Jeddah, Saudi Arabia",
    firstGrandPrix: "2021",
    laps: "50",
    length: "6.174 km",
    raceDistance: "308.45 km",
    lapRecord: "1:30.734 (Lewis Hamilton)"
  },
  "australia": {
    name: "Albert Park Circuit",
    location: "Melbourne, Australia",
    firstGrandPrix: "1996",
    laps: "58",
    length: "5.278 km",
    raceDistance: "306.12 km",
    lapRecord: "1:19.813 (Charles Leclerc)"
  },
  "japan": {
    name: "Suzuka International Racing Course",
    location: "Suzuka, Japan",
    firstGrandPrix: "1987",
    laps: "53",
    length: "5.807 km",
    raceDistance: "307.47 km",
    lapRecord: "1:30.983 (Lewis Hamilton)"
  },
  "china": {
    name: "Shanghai International Circuit",
    location: "Shanghai, China",
    firstGrandPrix: "2004",
    laps: "56",
    length: "5.451 km",
    raceDistance: "305.07 km",
    lapRecord: "1:32.238 (Michael Schumacher)"
  },
  "miami": {
    name: "Miami International Autodrome",
    location: "Miami, USA",
    firstGrandPrix: "2022",
    laps: "57",
    length: "5.412 km",
    raceDistance: "308.33 km",
    lapRecord: "1:29.708 (Max Verstappen)"
  },
  "emilia_romagna": {
    name: "Autodromo Enzo e Dino Ferrari",
    location: "Imola, Italy",
    firstGrandPrix: "1980",
    laps: "63",
    length: "4.909 km",
    raceDistance: "309.05 km",
    lapRecord: "1:15.484 (Lewis Hamilton)"
  },
  "monaco": {
    name: "Circuit de Monaco",
    location: "Monte Carlo, Monaco",
    firstGrandPrix: "1950",
    laps: "78",
    length: "3.337 km",
    raceDistance: "260.29 km",
    lapRecord: "1:12.909 (Lewis Hamilton)"
  },
  "canada": {
    name: "Circuit Gilles-Villeneuve",
    location: "Montreal, Canada",
    firstGrandPrix: "1978",
    laps: "70",
    length: "4.361 km",
    raceDistance: "305.27 km",
    lapRecord: "1:13.078 (Valtteri Bottas)"
  },
  "spain": {
    name: "Circuit de Barcelona-Catalunya",
    location: "Barcelona, Spain",
    firstGrandPrix: "1991",
    laps: "66",
    length: "4.657 km",
    raceDistance: "307.24 km",
    lapRecord: "1:16.330 (Max Verstappen)"
  },
  "austria": {
    name: "Red Bull Ring",
    location: "Spielberg, Austria",
    firstGrandPrix: "1970",
    laps: "71",
    length: "4.318 km",
    raceDistance: "306.45 km",
    lapRecord: "1:05.619 (Carlos Sainz)"
  },
  "great_britain": {
    name: "Silverstone Circuit",
    location: "Silverstone, UK",
    firstGrandPrix: "1950",
    laps: "52",
    length: "5.891 km",
    raceDistance: "306.20 km",
    lapRecord: "1:27.097 (Max Verstappen)"
  },
  "hungary": {
    name: "Hungaroring",
    location: "Budapest, Hungary",
    firstGrandPrix: "1986",
    laps: "70",
    length: "4.381 km",
    raceDistance: "306.63 km",
    lapRecord: "1:16.627 (Lewis Hamilton)"
  },
  "belgium": {
    name: "Circuit de Spa-Francorchamps",
    location: "Spa, Belgium",
    firstGrandPrix: "1950",
    laps: "44",
    length: "7.004 km",
    raceDistance: "308.05 km",
    lapRecord: "1:44.701 (Sergio Perez)"
  },
  "netherlands": {
    name: "Circuit Zandvoort",
    location: "Zandvoort, Netherlands",
    firstGrandPrix: "1952",
    laps: "72",
    length: "4.259 km",
    raceDistance: "306.59 km",
    lapRecord: "1:11.097 (Lewis Hamilton)"
  },
  "italy": {
    name: "Autodromo Nazionale Monza",
    location: "Monza, Italy",
    firstGrandPrix: "1950",
    laps: "53",
    length: "5.793 km",
    raceDistance: "306.72 km",
    lapRecord: "1:21.046 (Rubens Barrichello)"
  },
  "baku": {
    name: "Baku City Circuit",
    location: "Baku, Azerbaijan",
    firstGrandPrix: "2016",
    laps: "51",
    length: "6.003 km",
    raceDistance: "306.05 km",
    lapRecord: "1:43.009 (Charles Leclerc)"
  },
  "singapore": {
    name: "Marina Bay Street Circuit",
    location: "Marina Bay, Singapore",
    firstGrandPrix: "2008",
    laps: "62",
    length: "4.940 km",
    raceDistance: "306.14 km",
    lapRecord: "1:34.486 (Daniel Ricciardo)"
  },
  "usa": {
    name: "Circuit of The Americas",
    location: "Austin, USA",
    firstGrandPrix: "2012",
    laps: "56",
    length: "5.513 km",
    raceDistance: "308.41 km",
    lapRecord: "1:36.169 (Charles Leclerc)"
  },
  "mexico": {
    name: "Autódromo Hermanos Rodríguez",
    location: "Mexico City, Mexico",
    firstGrandPrix: "1963",
    laps: "71",
    length: "4.304 km",
    raceDistance: "305.35 km",
    lapRecord: "1:17.774 (Valtteri Bottas)"
  },
  "brazil": {
    name: "Autódromo José Carlos Pace (Interlagos)",
    location: "São Paulo, Brazil",
    firstGrandPrix: "1973",
    laps: "71",
    length: "4.309 km",
    raceDistance: "305.88 km",
    lapRecord: "1:10.540 (Valtteri Bottas)"
  },
  "las_vegas": {
    name: "Las Vegas Strip Circuit",
    location: "Las Vegas, USA",
    firstGrandPrix: "2023",
    laps: "50",
    length: "6.201 km",
    raceDistance: "309.96 km",
    lapRecord: "1:34.876 (Oscar Piastri)"
  },
  "qatar": {
    name: "Lusail International Circuit",
    location: "Lusail, Qatar",
    firstGrandPrix: "2021",
    laps: "57",
    length: "5.419 km",
    raceDistance: "308.61 km",
    lapRecord: "1:22.384 (Max Verstappen)"
  },
  "abu_dhabi": {
    name: "Yas Marina Circuit",
    location: "Abu Dhabi, UAE",
    firstGrandPrix: "2009",
    laps: "58",
    length: "5.281 km",
    raceDistance: "306.18 km",
    lapRecord: "1:25.637 (Max Verstappen)"
  }
};

export const IMAGE_CACHE_SIZE = 30;
export const IMAGE_CACHE_KEY = 'bwoahImageCache';
export const SHOWN_IMAGES_KEY = 'bwoahShownImages';
export const FAILED_IMAGES_KEY = 'bwoahFailedImages';
export const REDDIT_CACHE_KEY = 'bwoahRedditCache';
export const WALLPAPER_META_KEY = 'bwoahWallpaperMeta';
export const REDDIT_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
export const RACE_SCHEDULE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
