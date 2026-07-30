/**
 * Logo Catalog (seed source)
 *
 * The hand-curated list of categories and the brands inside them. Only slugs live
 * here — the display name and brand colour are pulled from the `simple-icons`
 * package at seed time, so a typo becomes a hard error instead of a broken image.
 *
 * This file is only ever imported by the seed script, never by the app. Once the
 * data is in Postgres the app reads it from there.
 *
 * IMPORTANT: every slug listed here was verified against the simple-icons dataset.
 * SimpleIcons removes brands whose licence does not allow redistribution, so before
 * adding a name run `npm run db:seed` — it fails loudly on an unknown slug.
 */

export interface CatalogCategory {
  slug: string;
  name: string;
  logos: string[];
}

export const CATALOG: CatalogCategory[] = [
  {
    slug: 'tech',
    name: 'Tech & Apps',
    logos: [
      'apple', 'google', 'samsung', 'intel', 'nvidia', 'amd', 'cisco', 'dell',
      'hp', 'lenovo', 'asus', 'acer', 'xiaomi', 'huawei', 'oneplus', 'sony',
      'lg', 'android', 'github', 'gitlab', 'docker', 'figma', 'notion', 'zoom',
      'dropbox', 'stackoverflow', 'wordpress', 'shopify', 'sap', 'vercel',
      'cloudflare', 'firefox', 'googlechrome', 'safari', 'opera', 'linux',
      'ubuntu', 'qualcomm', 'razer', 'jbl', 'bose', 'panasonic', 'toshiba',
      'nokia', 'motorola', 'oppo', 'vivo', 'honor', 'dji', 'wacom', 'arduino',
      'raspberrypi', 'sennheiser', 'beatsbydre', 'audiotechnica', 'steelseries',
      'corsair', 'hyperx', 'msi', 'seagate', 'kingstontechnology',
    ],
  },
  {
    slug: 'social',
    name: 'Social Media',
    logos: [
      'facebook', 'instagram', 'x', 'tiktok', 'snapchat', 'pinterest', 'reddit',
      'whatsapp', 'telegram', 'discord', 'tumblr', 'threads', 'wechat', 'line',
      'viber', 'signal', 'mastodon', 'bluesky', 'quora', 'medium', 'vk',
      'sinaweibo', 'flickr', 'behance', 'dribbble', 'deviantart', 'patreon',
      'substack', 'clubhouse', 'kakaotalk', 'messenger',
    ],
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    logos: [
      'bmw', 'audi', 'volkswagen', 'porsche', 'ferrari', 'lamborghini', 'tesla',
      'toyota', 'honda', 'nissan', 'mazda', 'subaru', 'hyundai', 'kia', 'ford',
      'chevrolet', 'jeep', 'volvo', 'renault', 'peugeot', 'citroen', 'fiat',
      'opel', 'skoda', 'seat', 'mini', 'bugatti', 'maserati', 'astonmartin',
      'rollsroyce', 'bentley', 'suzuki', 'mitsubishi', 'dacia', 'ducati',
      'cadillac', 'chrysler', 'infiniti', 'acura', 'mclaren', 'polestar',
      'lucid', 'vauxhall', 'iveco', 'scania', 'man', 'mahindra',
    ],
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    logos: [
      'playstation', 'steam', 'epicgames', 'ubisoft', 'ea', 'rockstargames',
      'activision', 'riotgames', 'valve', 'unity', 'unrealengine', 'roblox',
      'fortnite', 'leagueoflegends', 'counterstrike', 'dota2', 'valorant',
      'pubg', 'sega', 'squareenix', 'konami', 'cdprojekt', 'itchdotio',
      'gogdotcom', 'origin', 'battledotnet', 'gamejolt', 'humblebundle', 'ign',
      'metacritic', 'twitch', 'kick',
    ],
  },
  {
    slug: 'streaming',
    name: 'Streaming & Music',
    logos: [
      'netflix', 'hbo', 'max', 'appletv', 'paramountplus', 'crunchyroll',
      'youtube', 'spotify', 'applemusic', 'soundcloud', 'deezer', 'tidal',
      'pandora', 'audible', 'imdb', 'rottentomatoes', 'cnn', 'nbc', 'fox',
      'vimeo', 'dailymotion', 'plex', 'kodi', 'sonos', 'shazam', 'lastdotfm',
      'bandcamp', 'napster', 'iheartradio', 'youtubemusic', 'sky', 'starz',
      'showtime', 'viaplay', 'dazn', 'fubo',
    ],
  },
  {
    slug: 'finance',
    name: 'Finance & Payments',
    logos: [
      'visa', 'mastercard', 'americanexpress', 'paypal', 'stripe', 'klarna',
      'revolut', 'wise', 'n26', 'robinhood', 'coinbase', 'binance', 'bitcoin',
      'ethereum', 'hsbc', 'barclays', 'chase', 'bankofamerica', 'wellsfargo',
      'goldmansachs', 'deutschebank', 'westernunion', 'payoneer', 'venmo',
      'cashapp', 'monzo', 'nubank', 'mercadopago', 'discover', 'jcb',
      'tradingview', 'quickbooks', 'xero', 'adyen', 'square', 'afterpay',
      'moneygram', 'zelle', 'alipay', 'paytm', 'phonepe', 'googlepay',
      'applepay', 'samsungpay',
    ],
  },
  {
    slug: 'travel',
    name: 'Travel & Airlines',
    logos: [
      'airbnb', 'bookingdotcom', 'expedia', 'tripadvisor', 'trivago', 'uber',
      'lyft', 'grab', 'turkishairlines', 'emirates', 'qatarairways', 'lufthansa',
      'britishairways', 'airfrance', 'klm', 'ryanair', 'easyjet', 'delta',
      'americanairlines', 'unitedairlines', 'southwestairlines',
      'singaporeairlines', 'etihadairways', 'aeroflot', 'pegasusairlines',
      'wizzair', 'iberia', 'marriott', 'hilton', 'deutschebahn', 'sncf',
      'nationalrail', 'airasia', 'airindia', 'jetblue', 'qantas', 'ana',
      'japanairlines', 'norwegian', 'tui', 'airtransat', 'airchina',
      'chinasouthernairlines', 'chinaeasternairlines',
    ],
  },
  {
    slug: 'fashion',
    name: 'Fashion & Retail',
    logos: [
      'nike', 'adidas', 'puma', 'reebok', 'underarmour', 'newbalance',
      'thenorthface', 'hermes', 'zara', 'handm', 'uniqlo', 'dior', 'fila',
      'ikea', 'ebay', 'etsy', 'aliexpress', 'target', 'zalando', 'wish',
      'carrefour', 'tesco', 'aldinord', 'lidl', 'mediamarkt', 'rakuten',
      'farfetch', 'vinted', 'stockx', 'macys', 'otto', 'veepee', 'samsclub',
    ],
  },
  {
    slug: 'food',
    name: 'Food & Drink',
    logos: [
      'mcdonalds', 'burgerking', 'kfc', 'starbucks', 'tacobell', 'cocacola',
      'redbull', 'deliveroo', 'ubereats', 'doordash', 'justeat', 'zomato',
      'swiggy', 'hellofresh', 'jameson', 'instacart', 'glovo', 'foodpanda',
      'postmates', 'yelp', 'untappd', 'vivino', 'ifood',
    ],
  },
  {
    slug: 'sports',
    name: 'Sports & Fitness',
    logos: [
      'fifa', 'nba', 'mlb', 'nhl', 'premierleague', 'wwe', 'ufc', 'strava',
      'garmin', 'fitbit', 'peloton', 'runkeeper', 'komoot', 'alltrails',
    ],
  },
];

// ---------------------------------------------------------------------------
// Difficulty tiers
// ---------------------------------------------------------------------------

/** Household names almost anyone recognises at a glance. */
export const EASY_LOGOS = new Set([
  'apple', 'google', 'samsung', 'intel', 'nvidia', 'sony', 'lg', 'android',
  'github', 'firefox', 'googlechrome', 'safari', 'linux', 'ubuntu', 'nokia',
  'motorola', 'xiaomi', 'huawei', 'dell', 'hp', 'bmw', 'audi', 'volkswagen',
  'porsche', 'ferrari', 'lamborghini', 'tesla', 'toyota', 'honda', 'nissan',
  'hyundai', 'kia', 'ford', 'chevrolet', 'jeep', 'volvo', 'renault', 'peugeot',
  'fiat', 'mini', 'facebook', 'instagram', 'x', 'tiktok', 'snapchat',
  'pinterest', 'reddit', 'whatsapp', 'telegram', 'discord', 'youtube', 'netflix',
  'spotify', 'imdb', 'playstation', 'steam', 'mcdonalds', 'burgerking', 'kfc',
  'starbucks', 'cocacola', 'redbull', 'nike', 'adidas', 'puma', 'ikea', 'ebay',
  'zara', 'visa', 'mastercard', 'paypal', 'bitcoin', 'airbnb', 'uber', 'fifa',
  'nba', 'tacobell', 'twitch', 'sega', 'wwe', 'ufc', 'hbo', 'cnn', 'shazam',
  'americanexpress',
]);

/** Niche brands that only enthusiasts or locals will place. */
export const HARD_LOGOS = new Set([
  'vercel', 'cloudflare', 'sap', 'qualcomm', 'wacom', 'arduino', 'raspberrypi',
  'audiotechnica', 'kingstontechnology', 'seagate', 'hyperx', 'corsair',
  'steelseries', 'msi', 'honor', 'vivo', 'oppo', 'dji', 'sinaweibo', 'mastodon',
  'bluesky', 'clubhouse', 'kakaotalk', 'viber', 'vk', 'substack', 'behance',
  'dribbble', 'deviantart', 'iveco', 'scania', 'man', 'mahindra', 'vauxhall',
  'lucid', 'polestar', 'acura', 'infiniti', 'chrysler', 'dacia', 'cdprojekt',
  'itchdotio', 'gogdotcom', 'battledotnet', 'gamejolt', 'humblebundle',
  'metacritic', 'kick', 'napster', 'lastdotfm', 'bandcamp', 'iheartradio',
  'viaplay', 'starz', 'showtime', 'fubo', 'dazn', 'plex', 'kodi', 'n26',
  'monzo', 'nubank', 'mercadopago', 'payoneer', 'adyen', 'xero', 'quickbooks',
  'jcb', 'moneygram', 'zelle', 'phonepe', 'paytm', 'afterpay', 'tradingview',
  'wizzair', 'pegasusairlines', 'aeroflot', 'airtransat',
  'chinasouthernairlines', 'chinaeasternairlines', 'japanairlines', 'ana',
  'nationalrail', 'sncf', 'deutschebahn', 'iberia', 'norwegian', 'tui',
  'airindia', 'glovo', 'foodpanda', 'postmates', 'untappd', 'vivino', 'ifood',
  'instacart', 'swiggy', 'zomato', 'justeat', 'hellofresh', 'jameson',
  'farfetch', 'vinted', 'stockx', 'veepee', 'samsclub', 'otto', 'aldinord',
  'mediamarkt', 'macys', 'komoot', 'alltrails', 'runkeeper', 'peloton',
  'fitbit',
]);

/**
 * Alternative names that should also count as correct. Only matters for a
 * free-text answer mode; the multiple-choice round compares against `name`.
 */
export const ACCEPTED_ALIASES: Record<string, string[]> = {
  x: ['Twitter'],
  facebook: ['Meta'],
  max: ['HBO Max'],
  handm: ['H&M', 'HM'],
  sinaweibo: ['Weibo'],
  googlechrome: ['Chrome'],
  bookingdotcom: ['Booking'],
  itchdotio: ['Itch'],
  gogdotcom: ['GOG'],
  lastdotfm: ['Last FM'],
  battledotnet: ['Battle net', 'Blizzard'],
  americanexpress: ['Amex'],
  mcdonalds: ['McDonalds'],
  ea: ['Electronic Arts'],
  ana: ['All Nippon Airways'],
  cdprojekt: ['CD Projekt Red'],
};

/** Returns the 1-3 difficulty rating for a logo slug. */
export function difficultyFor(slug: string): number {
  if (EASY_LOGOS.has(slug)) return 1;
  if (HARD_LOGOS.has(slug)) return 3;
  return 2;
}
