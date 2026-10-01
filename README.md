# Harcama Defteri

Günlük harcamaları dört alanla kaydeden, mobil öncelikli bir gider defteri. Veriler tarayıcıda (localStorage) tutulur; sunucu gerekmez.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) açın.

Üretim derlemesi:

```bash
npm run build
npx serve out
```

## Kullanım

1. **+ Harcama Ekle** — yer, miktar, ödeme yöntemi, kategori.
2. Ana ekranda **Bu Ay** toplamı ve son harcamalar.
3. **Tümü** — arama ve tarih / kategori / ödeme filtresi.
4. Bir kayda dokunun — düzenle veya sil.
5. **Özet** — seçilen ayın toplamı ve kırılımlar.
6. **Ayarlar** — kategori ve ödeme yöntemlerini yönetin.

İlk açılışta örnek harcamalar yüklenir.
