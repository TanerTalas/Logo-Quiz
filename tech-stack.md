# Logo Quiz — Tech Stack

## Özet
Next.js (React + Node) · Tailwind CSS · PostgreSQL (Supabase) · Drizzle ORM

## Frontend
- **React** — UI kütüphanesi (Next.js içinde)
- **Next.js** — fullstack React framework'ü
  - Express'in yerini alır (Node altta çalışmaya devam eder)
  - Dosya tabanlı routing: `app/page.js` → `/`, `app/api/logos/route.js` → `/api/logos`
  - Sunucuda render (SSR) → SEO + hızlı ilk açılış
  - Deploy: Vercel (ücretsiz tier yeterli)
- **Tailwind CSS** — utility-first CSS
  - Modernist tasarım token'ları `tailwind.config`'e taşınacak:
    - Renkler: bg `#f3f2f2`, text `#201e1d`, accent `#ec3013`
    - Radius: 0 (hiçbir köşe yuvarlanmaz)
    - Font: Archivo (heading + body)
    - 2px divider kuralları, flush-left buton etiketleri

## Backend / Veri
- **PostgreSQL** — ilişkisel veritabanı
  - Hosting: **Supabase** (ücretsiz tier: 500MB DB + storage + auth)
- **Supabase Storage** — logo görselleri burada durur; DB'de sadece URL tutulur
- **Drizzle ORM** — tip güvenli sorgular, SQL'e yakın sözdizim, migration yönetimi

## Taslak DB şeması
```
categories: id, name, slug, icon
logos:      id, category_id, name, image_url, difficulty (1-3),
            accepted_answers (text[]), created_at
scores:     id, player_name, category_id, score, duration_ms, created_at
```

## API endpoint taslağı
```
GET  /api/categories          → kategori listesi
GET  /api/logos?category=X    → kategorideki logolar (cevaplar hariç!)
POST /api/guess               → cevap kontrolü sunucuda (hile önlemi)
POST /api/scores              → skor kaydet
GET  /api/scores?category=X   → leaderboard
```

## Gizli bilgiler (.env)
- Şifre, DB bağlantı adresi, API anahtarları → `.env.local` dosyasında tutulur
- `.gitignore`'a eklenir → GitHub'a asla gitmez
- Kodda `process.env.DATABASE_URL` ile okunur
- Next.js `.env.local`'ı otomatik yükler (Express'teki `dotenv` paketine gerek yok)
- Kural: `NEXT_PUBLIC_` önekiyle başlamayan hiçbir değişken tarayıcıya gitmez —
  sadece sunucuda (API route'larda) okunabilir. DB şifresine asla `NEXT_PUBLIC_` koyma!

```
# .env.local örneği
DATABASE_URL=postgresql://user:sifre@db.supabase.co:5432/postgres
SUPABASE_SERVICE_KEY=eyJhbG...
```

## Sonrası için notlar
- Cevap doğrulama sunucuda yapılmalı (client'a accepted_answers gönderme)

