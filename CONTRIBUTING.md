# Katkıda Bulunma Rehberi

Tezgah'a katkıda bulunmak istediğin için teşekkürler! Bu rehber, katkı sürecini açıklar.

## Nasıl Katkıda Bulunabilirim?

### Hata Bildirimi

- [GitHub Issues](https://github.com/komunite/tezgah/issues) üzerinden bildirin
- Hangi skill'de sorun olduğunu belirtin
- Mümkünse beklenen davranış ile gerçekleşen davranışı açıklayın

### Mevcut Skill'leri İyileştirme

- Güncelliğini yitirmiş bilgileri düzeltin (API değişiklikleri, fiyat güncellemeleri vb.)
- Yeni gotcha'lar veya best practice'ler ekleyin
- Türkiye bağlamına özel bilgileri güncelleyin

### Yeni Skill Ekleme

Tezgah'a yeni skill eklemek istiyorsanız:

1. `skills/<skill-adi>/SKILL.md` dosyası oluşturun
2. YAML frontmatter'da `name` ve `description` alanlarını doldurun
3. Mevcut skill'lerin formatını takip edin
4. Bağımlılıkları ve bağlı skill'leri belirtin

#### Skill Dosya Formatı

```markdown
---
name: skill-adi
description: >
  Skill'in ne yaptığını ve ne zaman tetiklenmesi gerektiğini açıklayan
  detaylı açıklama. Claude Code bu açıklamayı kullanarak skill'i doğru
  zamanda aktifleştirir.
---

# Skill Başlığı

Skill içeriği...
```

#### Skill Yazım İlkeleri

- **Türkçe yazın.** Tüm skill içeriği Türkçe olmalı.
- **Pratik olun.** Teorik bilgi değil, uygulanabilir adımlar verin.
- **Gotchas bölümü ekleyin.** Pratikten gelen uyarılar çok değerli.
- **Bağımlılıkları belirtin.** Skill hangi diğer skill'lere bağlı?
- **Türkiye bağlamını düşünün.** Yerel kısıtlamalar ve avantajlar neler?

### Çeviri

Skill'leri başka dillere çevirmek istiyorsanız:

- `skills/<skill-adi>/SKILL.<dil-kodu>.md` formatını kullanın (örn: `SKILL.en.md`)
- CLI'da dil desteği için PR açın

## Geliştirme Ortamı

```bash
# Repo'yu klonla
git clone https://github.com/komunite/tezgah.git
cd tezgah

# CLI'ı test et
node bin/tezgah.js list
node bin/tezgah.js --help

# Testleri çalıştır
npm test
```

## Pull Request Süreci

1. Repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin
4. Branch'inizi push edin (`git push origin yeni-ozellik`)
5. Pull Request açın

### PR Kontrol Listesi

- [ ] Mevcut skill formatına uygun mu?
- [ ] Türkçe yazım kurallarına dikkat edildi mi?
- [ ] CHANGELOG.md güncellendi mi?
- [ ] `npm test` başarılı mı?

## Davranış Kuralları

Bu proje [Davranış Kuralları](CODE_OF_CONDUCT.md) ile yönetilir. Katılarak bu kurallara uymayı kabul edersiniz.

## Sorularınız mı Var?

[GitHub Discussions](https://github.com/komunite/tezgah/discussions) üzerinden soru sorabilirsiniz.
