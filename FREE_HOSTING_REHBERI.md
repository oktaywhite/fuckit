# 🚀 FUCKIT Arena - Ücretsiz Hosting (Yayınlama) Rehberi

Bu projeyi (Next.js + Prisma) tamamen **ücretsiz** bir şekilde internete açmak için en kolay ve en sorunsuz yöntem **Vercel** (Siteyi barındırmak için) ve **Neon** veya **Supabase** (Veritabanını barındırmak için) kullanmaktır.

Şu an projede `SQLite` kullanıyorsun. Ancak Vercel gibi ücretsiz servisler "sunucusuz (serverless)" çalıştığı için, site her uyku moduna geçip uyandığında SQLite dosyan silinir (verilerin kaybolur). Bu yüzden sadece arkadaşların arasında oynayacak dahi olsan, veritabanını internette tutabileceğin ücretsiz bir PostreSQL servisine geçirmemiz gerekiyor. 

Hiç merak etme, bu işlem çok basit! Aşağıdaki adımları sırasıyla uygula:

---

## 1. Adım: Ücretsiz Veritabanı Açma (Neon.tech)

En hızlı ve kolay ücretsiz veritabanı sağlayıcısı Neon'dur.

1. [neon.tech](https://neon.tech/) adresine git ve ücretsiz kayıt ol (Github veya Google ile girebilirsin).
2. Yeni bir proje oluştur (Proje adına `fuckit-arena` diyebilirsin).
3. Karşına bir bağlantı adresi (Connection String) çıkacak. Şuna benzer bir şeydir:
   `postgresql://kullanici:sifre@ep-xxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Bu adresi **kopyala** ve kaybetme.

---

## 2. Adım: Projeyi PostgreSQL'e Çevirme

Projenin içindeki `prisma/schema.prisma` dosyasını aç ve en üstteki `datasource db` kısmını şu şekilde değiştir:

**Eski Hali:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Yeni Hali:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Daha sonra ana klasördeki `.env` dosyanı aç (yoksa oluştur) ve içine Neon'dan kopyaladığın linki yapıştır:
```env
DATABASE_URL="postgresql://kullanici:sifre@ep-xxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

Terminali aç ve veritabanını internetteki yeni yerine kurmak için şu komutu çalıştır:
```bash
npx prisma db push
```

*(Eğer hata verirse klasördeki `prisma/migrations` klasörünü silip tekrar dene).*

---

## 3. Adım: Projeyi GitHub'a Yükleme

Vercel'in siteyi yayınlayabilmesi için kodlarının GitHub'da olması gerekiyor.

1. [github.com](https://github.com/)'a gir ve hesabın yoksa aç.
2. Yeni bir **Private** (Gizli) repository (depo) oluştur. Güvenlik önemli değil dedin ama kodlarının sadece sende kalması iyidir.
3. Bilgisayarında projeyi açtığın klasörde terminale şu komutları sırasıyla yaz (kendi github linkine göre düzenle):
   ```bash
   git init
   git add .
   git commit -m "ilk yukleme"
   git branch -M main
   git remote add origin https://github.com/SENIN_KULLANICI_ADIN/SENIN_DEPO_ADIN.git
   git push -u origin main
   ```

---

## 4. Adım: Vercel'de Yayınlama (Siteyi Canlıya Alma)

Şimdi projemizi internete açıyoruz!

1. [vercel.com](https://vercel.com/)'a git ve GitHub hesabınla giriş yap.
2. Sağ üstten **"Add New..." > "Project"** seçeneğine tıkla.
3. Ekranda az önce GitHub'a yüklediğin depoyu göreceksin, yanındaki **"Import"** butonuna bas.
4. Açılan ayarlarda **"Environment Variables"** (Çevre Değişkenleri) kısmını bul.
5. `DATABASE_URL` yazıp değerine Neon'dan aldığın uzun veritabanı linkini yapıştır ve **Add** butonuna bas.
6. Ve büyük mavi **"Deploy"** butonuna tıkla!

Ortalama 1-2 dakika içinde siten derlenecek ve Vercel sana `https://fuckit-arena-xxx.vercel.app` gibi bir link verecek. Bu linki arkadaşlarına atıp dilediğiniz gibi oynayabilirsiniz! 

---

### Ekstra Notlar
- Vercel ve Neon'un ücretsiz sınırları (Free Tier) aylık on binlerce tık ve veriye dayanır. Sadece arkadaşlarınla kullanacağın için limitleri aşman imkansızdır, sonsuza dek ücretsiz kalır.
- Koda bir güncelleme yaptığında sadece terminale `git add .`, `git commit -m "guncelleme"`, `git push` yazman yeterli. Vercel bunu otomatik algılayıp siteni güncelleyecektir.
