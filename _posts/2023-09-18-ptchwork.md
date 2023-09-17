---
title: "PatchWork Sorusu Çözümü "
layout: post
---


PatchWork Dosyasının Reverse Çözümü



#### Dosya Bilgileri

File olarak uygulamayı incelediğimizde dosya bilgileri aşağıda ki gibidir :

```
ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, 
BuildID[sha1]=bd54832bd17c6e91e740ff54e618b08e31ed3621, for GNU/Linux 3.2.0, not stripped
```

#### Radare2 İle Patch

Çalıştırdığımızda ise ; 
```js
Trampolines are quite fun!; I love to jump! 
You should try jumping too! It'll sure be more fun than reversing the flag manually.
```

Result sonucunu alıyoruz.

Burada bayrak dissamble edilerek kodu incelenebilir.
Radare2 ile `aa` , `s main` komutları takibinde `VV` komutu ile grafiksel olarak inceleyebiliriz.Daha sonra ise `q` ile çıkış yapabiliriz.

![folder_s3](/img/PatchWork1.png)

Görselde görüldüğü üzere main() fonksiyonunun çalışma prensibi Graph olarak yer almaktadır.Buradan yola çıkarak code_0x116C adresine yönlendirildiği görülmektedir.
0 ile 0 karşılaştırması yapıldığından dolayı Give_Flag() fonksiyonuna tam olarak geçiş sağlanamamaktadır.

![folder_s3](/img/PatchWork2.png)

Burada ise `0x0000116c` adresine gittiğimizde `JUMP` olarak `0x0000116a` adresine atlamamız gerekmektedir.
```js wa jmp 0x0000116c@0x0000116a``` komutu ile atlama işlemi gerçekleştirdikten sonra tekrardan dosyayı çalıştırdığımızda ise ;

>bayrağa ulaşıyoruz : 

```js
Trampolines are quite fun!; I love to jump! 
You should try jumping too! It'll sure be more fun than reversing the flag manually.
PCTF{JuMp_uP_4nd_g3t_d0Wn}
```

Give_Flag() fonksiyonu incelenerekte çözüme ulaşılabilir.

#### Give_Flag() Fonksiyonunun İncelenmesi

```js
void give_flag(void)
{
  undefined8 *puVar1; // İşaretçi tanımlanır
  undefined8 local_38; // 8 byte'lık değişkenler tanımlanır
  undefined8 local_30;
  undefined8 local_28;
  undefined2 local_20;
  undefined local_1e;
  undefined8 *local_18; // İşaretçiler tanımlanır
  undefined8 *local_10;
  
  // Değişkenlere sabit değerler atanır
  local_38 = 0x9dc59acb96a493a0;
  local_30 = 0xb4be84afa0c5afc0;
  local_28 = 0xa780b4afc483b7af;
  local_20 = 0xcdbe;
  local_1e = 0;
  local_10 = &local_38; // İşaretçi local_38'e ayarlanır

  // İlk döngü: local_10 işaretçisi NULL karakteri ('\0') bulana kadar döner
  while (*(char *)local_10 != '\0') {
    puVar1 = (undefined8 *)((long)local_10 + 1); // İşaretçiyi bir sonraki karaktere kaydır
    *(char *)local_10 = *(char *)local_10 + -0x50; // Karakterin ASCII değerini 80 (0x50) azalt
    local_10 = puVar1; // İşaretçiyi güncelle
  }
  puts((char *)&local_38); // Değiştirilmiş dizeyi yazdır

  local_18 = &local_38; // İşaretçiyi tekrar local_38'e ayarla

  // İkinci döngü: local_18 işaretçisi NULL karakteri ('\0') bulana kadar döner
  while (*(char *)local_18 != '\0') {
    puVar1 = (undefined8 *)((long)local_18 + 1); // İşaretçiyi bir sonraki karaktere kaydır
    *(char *)local_18 = *(char *)local_18 + 'P'; // Karakterin ASCII değerine 'P' ekleyin
    local_18 = puVar1; // İşaretçiyi güncelle
  }
  return; // İşlev sona erer
}
```

Bu Kod bloğunu daha okunabilir hale getirmek için ve C olarak derlenerek çalıştırabileceğimiz bir program haline getirerek çözüme ulaşabiliriz.

```js
#include <stdio.h>

void give_flag() {
    unsigned long long local_38 = 0x9dc59acb96a493a0ULL;
    unsigned long long local_30 = 0xb4be84afa0c5afc0ULL;
    unsigned long long local_28 = 0xa780b4afc483b7afULL;
    unsigned short local_20 = 0xcdbe;
    unsigned short local_1e = 0;
    unsigned long long local_10[] = {local_38, local_30, local_28, local_20, local_1e};
    char result[41]; // 40 karakter uzunluğunda sonuç + 1

    for (int i = 0; i < 5; i++) {
        unsigned long long value = local_10[i];
        unsigned char byteArray[8];

        for (int j = 0; j < 8; j++) {
            byteArray[j] = (unsigned char)(value & 0xFFULL);
            value >>= 8;
        }

        for (int j = 0; j < 8; j++) {
            byteArray[j] -= 0x50;
        }

        for (int j = 0; j < 8; j++) {
            result[i * 8 + j] = byteArray[j];
        }
    }

    result[40] = '\0'; // Sonuç dizesini sonlandır

    printf("%s\n", result);
}

int main() {
    give_flag();
    return 0;
}
```

Sonuç : 

![folder_s3](/img/PatchWork3.png)

Bu Kod bloğunu açıklayabilmeye çalışalım ;

İlgili büyük tamsayılar `unsigned long long` veri türünde değişkenlere atanır. Bu tamsayılar programın ana mantığını temsil eder.
`unsigned short` veri türünde iki tane daha değişken tanımlanır: `local_20` ve `local_1e`. Bu iki değişken, `2 baytlık` (16 bit) tamsayıları temsil eder.
`unsigned long long` veri türündeki tamsayılar bir dizi olan `local_10` içine yerleştirilir.
Bir sonuç dizesi olan result tanımlanır. Bu dize sonucun depolanacağı yerdir. `41` karakter uzunluğundadır çünkü sonuna bir `null` karakteri eklemek için bir karakter daha gereklidir.
Burada ki `result[41]` değiştirilebilir tabiki fakat böyle çözüme ulaştığımızda dolayı değiştirmiyorum.
Bir döngü başlatılır. Bu döngü, `local_10` dizisindeki her büyük tamsayıyı işler.
Her büyük tamsayı, `8 bayta` dönüştürülür ve bu baytlar `byteArray` dizisine atanır. Bu işlem, büyük tamsayının her baytını ayırır.
Ardından, her bayttan `0x50 (80)` çıkarılır. Bu, baytları `ASCII` karakterlere dönüştürmek için kullanılır.
Elde edilen ASCII karakterler, sonucu oluşturmak için result dizisine eklenir.
Son olarak, result dizisinin sonuna null karakter `('\0')` eklenir. Bu, C dizilerinin sonunu belirtir.
Sonuç, printf kullanılarak ekrana yazdırılır.
main işlevi tanımlanır ve give_flag işlemini çağırır. Programın ana giriş noktasıdır.
Bu program, büyük tamsayıları baytlara dönüştürerek ve baytları ASCII karakterlere dönüştürerek sonucu oluşturur ve sonucu ekrana yazdırır. 
Sonuç, ```"PCTF{JuMp_uP_4nd_g3t_d0Wn}"``` olacaktır.

![folder_s3](/img/patchwork.gif)
