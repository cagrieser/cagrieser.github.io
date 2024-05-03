---
title: "SnakeGame Ransomware Analizi"
layout: post
---


SnakeGame.exe Dosyasının Statik ve Dinamik Analizi



#### Dosya Bilgileri

Sabancı Üniversitesi Siber Güvenlik Kulubü tarafından düzenelen SUCTF etkinliğinde yer alan Malware sorusunun Write-Up'ını içermektedir.
Dosyanın Statik ve Dinamik olarak analiz edilerek çözümlenmesi sağlanmıştır.

File olarak uygulamayı incelediğimizde dosya bilgileri aşağıda ki gibidir :

```
Snake_Game.exe: PE32 executable (GUI) Intel 80386 Mono/.Net assembly, for MS Windows, 3 sections
```

#### DIE İncelemesş

Dosya PE incelemesi aşağıda görülmektedir.Ayrıca incelenmeye karşı olarak .NET Reactor ile korunduğunu tespit edebiliriz.C# ile programlanan bu zararlı yazılımı ilk önce davranışlarını
tespit edebilmek için dinamik olarak incelememiz gerekmektedir.Daha sonra buna göre daha geniş çerçevede araştırmalarımza devam edebiliriz.

```js
Koruyucu: Eziriz .NET Reactor(6.x.x.x)[By Dr.FarFar]
Kütüphane: .NET(v4.0.30319)[-]
Bağlayıcı: Microsoft Linker(48.0)[GUI32]
```

![folder_s3](/img/ransomsnake.gif)
