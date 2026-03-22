# Güvenlik Politikası

## Desteklenen Sürümler

| Sürüm | Destek |
|-------|--------|
| 1.x   | Aktif  |

## Güvenlik Açığı Bildirimi

Tezgah'ın skill içeriklerinde veya CLI aracında bir güvenlik açığı bulduysanız, lütfen **GitHub Issues üzerinden herkese açık issue açmayın.**

Bunun yerine: **gunerfatih@gmail.com** adresine e-posta gönderin.

### Bildirimin İçermesi Gerekenler

- Etkilenen skill veya bileşen
- Açığın açıklaması
- Tekrar etme adımları (varsa)
- Potansiyel etkisi

### Süreç

1. Bildiriminizi 48 saat içinde onaylayacağız
2. Durumu değerlendirip düzeltme planı oluşturacağız
3. Düzeltme yayınlandığında sizi bilgilendireceğiz

### Kapsam

Tezgah bir skill setidir (kod üretim rehberi), çalışan bir uygulama değildir. Güvenlik açığı kapsamı:

- **Skill içeriklerinde güvensiz kod önerileri** (örn: SQL injection'a açık şema önerisi, güvensiz auth yapılandırması)
- **CLI aracında güvenlik sorunları** (örn: path traversal, dosya üzerine yazma)
- **Eksik güvenlik uyarıları** (skill'lerin belirtmesi gereken ama atladığı güvenlik riskleri)
