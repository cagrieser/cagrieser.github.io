---
title: "Kapsul CTF Malware Çözümü"
layout: post
---


s3_obf.exe Zararlı Dosyasının Statik ve Dinamik Write-Up



#### Meta Verileri

```
-------------------------------   METADATA    -------------------------------                                                      
File name:                        s3_obf.exe                    
Upload time:                      2023-06-22 23:03:45           
File size:                        148172 byte                   
File type:                        PE32+ executable (console) x86-64, for MS Windows, 17 sections
MD5:                              0ce004c783993f5818a5661a71e8d89a
SHA1:                             f9eb4321c4b8a21f3937322015a135fb992c2776
SHA256:                           2180ee927dc4816b76295c5dad7975e30f33718178f2b2eb86003e9145bd82d0

-------------------------------    HEADER     -------------------------------                                                      
Signature:                        PE                          
Machine:                          MACHINE_TYPES.AMD64           
Number of sections:               17                            
Time Date stamp:                  1686793185                    
Pointer to symbols:               109056                        
Number of symbols:                1764                          
Size of optional header:          240                           
Characteristics:                  LARGE_ADDRESS_AWARE - RELOCS_STRIPPED - EXECUTABLE_IMAGE - LINE_NUMS_STRIPPED

-------------------------------  OPT HEADER   -------------------------------                                                      
Magic:                            PE64                          
Major linker version:             2                             
Minor linker version:             24                            
Size of code:                     12800                         
Size of initialized data:         24576                         
Size of uninitialized data:       3584                          
Entry point:                      0x1500                        
Base of code:                     0x1000                        

-------------------------------   SECTIONS    -------------------------------      
```

#### API Çağrıları

Dosya Çalıştırıldığında bazı şüpheli API'ları çağırdığı görülmektedir.

```
RegOpenKeyEx
RegOpenKey
RegCloseKey
CreateToolhelp32Snapshot
IsDebuggerPresent
GetTickCount
VirtualProtect
GetModuleFileNameA
Process32Next
Process32First
CreateDirectory
UnhandledExceptionFilter
GetTempPath
GetStartupInfo
TerminateProcess
Sleep
CreateFile
```

Burada dikkatimiz çeken API çağrıları bunlardan oluşmaktadır.

>RegOpenKeyEx: Windows kayıt defterinde belirli bir anahtarın açılmasını sağlar.
>RegCloseKey: Windows kayıt defterinde açılan bir anahtarın kapatılmasını sağlar.
>CreateDirectory: Belirtilen bir dizin oluşturur.
>GetTempPath: Geçici dosyaların oluşturulacağı dizinin yolunu döndürür.
>GetStartupInfo: Başlatılan bir uygulamanın başlangıç bilgilerini alır.
>CreateFile: Bir dosyayı açmak veya oluşturmak için kullanılır.

Buradan anlaşılacağı şudur ki Temp dizininde geçici dosya yaratılacağı dizin yolu ve bazı dosyalar oluşturabileceği ve açabileceği sonucu çıkmaktadır.

Bulunan stringler incelendiğinde ise 
```js
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/

``` 

Alphabet's CharSet bulunmaktadır.
Burada anlaşılacağı üzere bir Base64 gibi bir çözümleyici kullanılabilir olmasıdır.Fakat program akışında bununla alakalı bir işlev gerçekleşmiyor olabilir.

`GetSystemTimeAsFileTime` ve `GetSystemTime` kullanarak sistem zaman bilgilerinide elde etmektedir.

### Derleyici Bilgileri
Dosyaya statik analiz yaptığımızda ;

```
Derleyici: MinGW(GCC: (GNU) 4.9.2)[-]
Bağlayıcı: GNU linker ld (GNU Binutils)(2.24)[Konsol64,console]
Kaplama: Binary
PE32+ executable (console) x86-64, for MS Windows 
```

Sonuçları çıkmaktadır.

### Dinamik Analiz
Dosyayı dinamik olarak çalıştırdığımızda 100 civarı klasör ve tek dosya yarattığını görmekteyiz.

![folder_s3](/img/folder_s3.png)

Bunların hepsini ayrı ayrı incelemek zahmetli olacaktır bu yüzden bir python scripti ile klasör içerisine girip tüm dosyaları okuyup çıktısını alabiliriz.

Aşağıda ki script ile bunu yapabiliriz.

```python
import os
from colorama import Fore, Style

def dosyalari_oku(klasor_yolu):
    for klasor_adı in os.listdir(klasor_yolu):
        klasor_yol = os.path.join(klasor_yolu, klasor_adı)
        if os.path.isdir(klasor_yol):
            dosya_listesi = os.listdir(klasor_yol)
            dosya_var_mi = False
            for dosya_adı in dosya_listesi:
                dosya_yolu = os.path.join(klasor_yol, dosya_adı)
                if os.path.isfile(dosya_yolu):
                    with open(dosya_yolu, "r") as dosya:
                        icerik = dosya.read()
                        print(f"{Fore.RED}{klasor_adı} : {Fore.GREEN}{icerik}{Style.RESET_ALL}")
                        dosya_var_mi = True
            if not dosya_var_mi:
                print(f"{Fore.RED}{klasor_adı} : Dosya bulunamadı.{Style.RESET_ALL}")

klasor_yolu = input("Klasör yolunu girin: ")  
dosyalari_oku(klasor_yolu)
```

Dosya çıktısı olarak karşımıza tüm klasörlerden neredeyse `nononono` diye bir string ifade çıkmaktadır fakat `6yPlhiGZR` dosyasında farklı şekilde 4 adet Hexadecimal veri göze çarpmaktadır.

![s3_hex](/img/s3_hex.png)

```
664D57356849747B51374F365F4C5B73665C7C7A5E373E79
664D5735684D523B517E3D3566495770534C4F36674C5736676E3A6F67373542                                                                   
664D57356849747B51374F365F4C4B705F5C697567494E7A5E373E79                                                                           
664D57356849747B51374F365F4C4B705F5C697567483A6F67373542  
```

Hex kodları decode işlemi gerçekleştirdiğimizde ise karşımızı şu sonuçlar gelmektedir.

```python
bytearray.fromhex("664D57356849747B51374F365F4C5B73665C7C7A5E373E79").decode();
bytearray.fromhex("664D5735684D523B517E3D3566495770534C4F36674C5736676E3A6F67373542").decode();
bytearray.fromhex("664D57356849747B51374F365F4C4B705F5C697567494E7A5E373E79").decode();
bytearray.fromhex("664D57356849747B51374F365F4C4B705F5C697567483A6F67373542").decode();
```

```
'fMW5hIt{Q7O6_L[sf\\|z^7>y'
'fMW5hMR;Q~=5fIWpSLO6gLW6gn:og75B'
'fMW5hIt{Q7O6_LKp_\\iugINz^7>y'
'fMW5hIt{Q7O6_LKp_\\iugH:og75B'
```

### Şifreleme Teknikleri

Biraz Crpytology olarak araştırma yaptığımızda birazda deneme yaptığımızda sonuç olarak 2.İfadenin ASCII Shift +5 olduğunuz görmekteyiz.

![s3_ascii](/img/s3_ascii.png)

`aHR0cHM6Ly80aDRkNGJ1bGR1bi5jb20=` bu ifade diğer çıkan sonuçlara göre biraz tanıdık gelmektedir yani Base64 şifrelemesi olabileceğini düşünebiliriz.

`echo "aHR0cHM6Ly80aDRkNGJ1bGR1bi5jb20=" | base64 --decode` komutu girdiğimizde karşımıza sonuç olarak `https://4h4d4buldun.com` URL adresi çıkmaktadır.
sonuç olarak cevabımızda bu olmaktadır.


Ghidra aracı ile Dissamble işlemi yaparak bu işlemleri gerçekleştiren kod yapısınada ulaşmaktayız.

```js

void _Z12asdzxcaasdxzi(int param_1)

{
  int iVar1;
  HANDLE hObject;
  FILE *pFVar2;
  undefined *puVar3;
  undefined *puVar4;
  undefined local_388 [9];
  undefined local_37f [7];
  undefined local_378 [9];
  undefined local_36f [7];
  CHAR local_368 [272];
  char local_258 [272];
  undefined8 local_148;
  undefined8 local_140;
  undefined8 local_138;
  undefined8 local_130;
  undefined8 local_128;
  undefined8 local_120;
  undefined8 local_118;
  undefined4 local_110;
  undefined2 local_10c;
  undefined local_10a;
  
  local_148 = 0x6867666564636261;
  local_140 = 0x706f6e6d6c6b6a69;
  local_138 = 0x7877767574737271;
  local_130 = 0x4645444342417a79;
  local_110 = 0x37363534;
  local_128 = 0x4e4d4c4b4a494847;
  local_10c = 0x3938;
  local_120 = 0x565554535251504f;
  local_10a = 0;
  local_118 = 0x333231305a595857;
  puVar3 = local_378;
  do {
    iVar1 = rand();
    puVar4 = puVar3 + 1;
    *puVar3 = *(undefined *)((longlong)&local_148 + (longlong)(iVar1 % 0x3e));
    puVar3 = puVar4;
  } while (puVar4 != local_36f);
  local_36f[0] = 0;
  local_148 = 0x6867666564636261;
  local_110 = 0x37363534;
  local_140 = 0x706f6e6d6c6b6a69;
  local_138 = 0x7877767574737271;
  local_10a = 0;
  local_130 = 0x4645444342417a79;
  local_128 = 0x4e4d4c4b4a494847;
  local_120 = 0x565554535251504f;
  local_118 = 0x333231305a595857;
  local_10c = 0x3938;
  puVar3 = local_388;
  do {
    iVar1 = rand();
    puVar4 = puVar3 + 1;
    *puVar3 = *(undefined *)((longlong)&local_148 + (longlong)(iVar1 % 0x3e));
    puVar3 = puVar4;
  } while (puVar4 != local_37f);
  local_37f[0] = 0;
  GetTempPathA(0x104,local_368);
  snprintf(local_258,0x104,"%s%s",local_368);
  CreateDirectoryA(local_258,(LPSECURITY_ATTRIBUTES)0x0);
  snprintf((char *)&local_148,0x104,"%s\\%s",local_258);
  hObject = CreateFileA((LPCSTR)&local_148,0x40000000,0,(LPSECURITY_ATTRIBUTES)0x0,2,0x80,
                        (HANDLE)0x0);
  if (hObject != (HANDLE)0xffffffffffffffff) {
    CloseHandle(hObject);
    if (param_1 == 1) {
      pFVar2 = fopen((char *)&local_148,"w");
      fwrite("664D57356849747B51374F365F4C5B73665C7C7A5E373E79\n664D5735684D523B517E3D3566495770534 C4F36674C5736676E3A6F67373542\n664D57356849747B51374F365F4C4B705F5C697567494E7A5E373E79\n664D5 7356849747B51374F365F4C4B705F5C697567483A6F67373542\n"
             ,1,0xe4,pFVar2);
      fclose(pFVar2);
      return;
    }
    pFVar2 = fopen((char *)&local_148,"w");
    fwrite("nonononononononono",1,0x12,pFVar2);
    fclose(pFVar2);
  }
  return;
}

```

### Debugger Bypass İşlemleri 

`GetTempPathA,CreateDirectoryA,CreateFileA,rand()` ifadelerinden anlaşılacağı üzere rastgele yaratılan dosyaları içerisine veriler yazılmaktadır.
Tek bir adet dosya içerisine Hexadecimal veriler diğerlerine ise `"nonononononononono"` ifadesi yazıldığı görülmektedir.

Araştırmaya bir başka konu ise `"IsDebuggerPresent"` dir.Bu API genelde Debugger işlemlerini engelleme amaçlı kullanılmaktadır.

IsDebuggerPresent: Çalışan bir programın hata ayıklama (debugging) amaçlı olarak başka bir program tarafından kontrol edilip edilmediğini belirler.

IDA ile inceleme yaptığımızda yeniden bazı Hexadecimal bir çok veri ile karşılaştığımız görülmektedir.Bunlar incelendiğinde ise ;


![s3_ida](/img/s3_ida.png)

Örnek olarak `"7469697C74707376697632697C69"` değerini aldığımızda sonuç olarak "mqqyrmx}hifykkiv2i|" çıkmaktadır.
ASCII Shift ile `"peexplorer.exe"` uygulamasının engellendiğini ve çalışmada sorun yaşadığı görülmektedir.
`"7B6D726865777132697C69"` değerinin sonucu ise `"{mrhewq2i|i"` olarak çıkmaktadır buda aynı şekilde ASCII Shift +4 "windasm.exe" olarak çıkmaktadır.

![s3_target](/img/s3_target.png)

### Şifrelenmiş Verilerin Çözümlenmesi

`void UndefinedFunction_00403a3a(void)` fonksiyonunda bu işlemlerin gerçekleştiğini görmekteyiz.Hepsini inceleyecek olursak.

`(?<=_Z11fsadfvxdsdaPKci\(")(.*)(?=",)` REGEX'i ile bu Hexadecimal verilerin hepsini alalım.

```python
import re

def regex_eslesmelerini_al(regex_deseni, dosya_yolu):
    with open(dosya_yolu, 'r') as dosya:
        metin = dosya.read()
        eslesmeler = re.findall(regex_deseni, metin)
        return eslesmeler

regex_deseni = r'(?<=_Z11fsadfvxdsdaPKci\(")(.*)(?=",)'
dosya_yolu = 'veriler.txt'  
sonuclar = regex_eslesmelerini_al(regex_deseni, dosya_yolu)

for sonuc in sonuclar:
    print(sonuc)
```
	
Scripti ile tüm hex verilerini çıkartıyoruz.Tabi kolaylık olması için tüm verileri "Hex To Text" ilede kolayca alabiliriz.

```python
def ascii_shift_4_decode(cipher_text):
    decrypted_text = ""
    for char in cipher_text:
        if char.isascii():
            shifted_char = chr((ord(char) - 4) % 128)
            decrypted_text += shifted_char
        else:
            decrypted_text += char
    return decrypted_text

dosya_yolu = "liste.txt"  

with open(dosya_yolu, 'r') as dosya:
    liste = dosya.read().splitlines()

for eleman in liste:
    cozulmus_metin = ascii_shift_4_decode(eleman.strip())
    print("Çözülmüş Metin:", cozulmus_metin)
    print()
```

### Hata Ayıklama Uygulamalarının Tespiti

Komutu ile otomatik olarak çıkarttığımız Hex verilerini Ascii +4 Shift yaptığımızda ;

```
Çözülmemiş Metin: {mviwlevo2i|i
Çözülmüş Metin: wireshark.exe
Çözülmemiş Metin: mhe2i|i
Çözülmüş Metin: ida.exe
Çözülmemiş Metin: spp}hfk2i|i
Çözülmüş Metin: ollydbg.exe
Çözülmemiş Metin: tvsgqsr2i|i
Çözülmüş Metin: procmon.exe
Çözülmemiş Metin: tvsgi|t2i|i
Çözülmüş Metin: procexp.exe
Çözülmemiş Metin: zspexmpmx}2i|i
Çözülmüş Metin: volatility.exe
Çözülmemiş Metin: jmhhpiv2i|i
Çözülmüş Metin: fiddler.exe
Çözülmemiş Metin: tiwxyhms2i|i
Çözülmüş Metin: pestudio.exe
Çözülmemiş Metin: gygoss2i|i
Çözülmüş Metin: cuckoo.exe
Çözülmemiş Metin: qep{evif}xiw2i|i
Çözülmüş Metin: malwarebytes.exe
Çözülmemiş Metin: vikwlsx2i|i
Çözülmüş Metin: regshot.exe
Çözülmemiş Metin: |:8hfk2i|i
Çözülmüş Metin: x64dbg.exe
Çözülmemiş Metin: hrWt}2i|i
Çözülmüş Metin: dnSpy.exe
Çözülmemiş Metin: wrsvx2i|i
Çözülmüş Metin: snort.exe
Çözülmemiş Metin: werhfs|mi2i|i
Çözülmüş Metin: sandboxie.exe
Çözülmemiş Metin: eyxsvyrw2i|i
Çözülmüş Metin: autoruns.exe
Çözülmemiş Metin: zq{evi2i|i
Çözülmüş Metin: vmware.exe
Çözülmemiş Metin: zfs|wivzmgi2i|i
Çözülmüş Metin: vboxservice.exe
Çözülmemiş Metin: zqxsspwh2i|i
Çözülmüş Metin: vmtoolsd.exe
Çözülmemiş Metin: {mviwlevo1kxo2i|i
Çözülmüş Metin: wireshark-gtk.exe
Çözülmemiş Metin: xgthyqt2i|i
Çözülmüş Metin: tcpdump.exe
Çözülmemiş Metin: tvsgchyqt2i|i
Çözülmüş Metin: proc_dump.exe
Çözülmemiş Metin: w}wmrxivrepw2i|i
Çözülmüş Metin: sysinternals.exe
Çözülmemiş Metin: {mrhfk2i|i
Çözülmüş Metin: windbg.exe
Çözülmemiş Metin: TvsgiwwLegoiv2i|i
Çözülmüş Metin: ProcessHacker.exe
Çözülmemiş Metin: tvsgiwwqsrmxsv2i|i
Çözülmüş Metin: processmonitor.exe
Çözülmemiş Metin: tvsgiww|t2i|i
Çözülmüş Metin: processxp.exe
Çözülmemiş Metin: tvsgiwwzmi{iv2i|i
Çözülmüş Metin: processviewer.exe
Çözülmemiş Metin: tvsgiww1i|tpsviv2i|i
Çözülmüş Metin: process-explorer.exe
Çözülmemiş Metin: vehevi62i|i
Çözülmüş Metin: radare2.exe
Çözülmemiş Metin: }eve2i|i
Çözülmüş Metin: yara.exe
Çözülmemiş Metin: timh2i|i
Çözülmüş Metin: peid.exe
Çözülmemiş Metin: i|imrjsti2i|i
Çözülmüş Metin: exeinfope.exe
Çözülmemiş Metin: spp}hyqt2i|i
Çözülmüş Metin: ollydump.exe
Çözülmemiş Metin: jmvii}i2i|i
Çözülmüş Metin: fireeye.exe
Çözülmemiş Metin: zqve}2i|i
Çözülmüş Metin: vmray.exe
Çözülmemiş Metin: gygosswerhfs|2i|i
Çözülmüş Metin: cuckoosandbox.exe
Çözülmemiş Metin: }eve1t}xlsr2i|i
Çözülmüş Metin: yara-python.exe
Çözülmemiş Metin: gpeqez2i|i
Çözülmüş Metin: clamav.exe
Çözülmemiş Metin: wstlsw2i|i
Çözülmüş Metin: sophos.exe
Çözülmemiş Metin: qgejii2i|i
Çözülmüş Metin: mcafee.exe
Çözülmemiş Metin: w}qerxig2i|i
Çözülmüş Metin: symantec.exe
Çözülmemiş Metin: oewtivwo}2i|i
Çözülmüş Metin: kaspersky.exe
Çözülmemiş Metin: ezewx2i|i
Çözülmüş Metin: avast.exe
Çözülmemiş Metin: fmxhijirhiv2i|i
Çözülmüş Metin: bitdefender.exe
Çözülmemiş Metin: iwix2i|i
Çözülmüş Metin: eset.exe
Çözülmemiş Metin: xvirhqmgvs2i|i
Çözülmüş Metin: trendmicro.exe
Çözülmemiş Metin: terhe2i|i
Çözülmüş Metin: panda.exe
Çözülmemiş Metin: {mrhs{w1hijirhiv2i|i
Çözülmüş Metin: windows-defender.exe
Çözülmemiş Metin: qep{evierep}wmw2i|i
Çözülmüş Metin: malwareanalysis.exe
Çözülmemiş Metin: vizivwmrkxsspw2i|i
Çözülmüş Metin: reversingtools.exe
Çözülmemiş Metin: jsvirwmgxsspw2i|i
Çözülmüş Metin: forensictools.exe
Çözülmemiş Metin: werhfs|xsspw2i|i
Çözülmüş Metin: sandboxtools.exe
Çözülmemiş Metin: hifykkmrkxsspw2i|i
Çözülmüş Metin: debuggingtools.exe
Çözülmemiş Metin: zqxsspw2i|i
Çözülmüş Metin: vmtools.exe
Çözülmemiş Metin: zmvxyepfs|2i|i
Çözülmüş Metin: virtualbox.exe
Çözülmemiş Metin: zqtpe}iv2i|i
Çözülmüş Metin: vmplayer.exe
Çözülmemiş Metin: zekverx2i|i
Çözülmüş Metin: vagrant.exe
Çözülmemiş Metin: uiqy2i|i
Çözülmüş Metin: qemu.exe
Çözülmemiş Metin: zmvxyeptg2i|i
Çözülmüş Metin: virtualpc.exe
Çözülmemiş Metin: zqtvsxigx2i|i
Çözülmüş Metin: vmprotect.exe
Çözülmemiş Metin: yt|2i|i
Çözülmüş Metin: upx.exe
Çözülmemiş Metin: tii|tpsviv2i|i
Çözülmüş Metin: peexplorer.exe
Çözülmemiş Metin: mqqyrmx}hifykkiv2i|i
Çözülmüş Metin: immunitydebugger.exe
Çözülmemiş Metin: spp}wgvmtx2i|i
Çözülmüş Metin: ollyscript.exe
Çözülmemiş Metin: {mrhewq2i|i
Çözülmüş Metin: windasm.exe
Çözülmemiş Metin: vehevikym2i|i
Çözülmüş Metin: radaregui.exe
Çözülmemiş Metin: spp}kvetl2i|i
Çözülmüş Metin: ollygraph.exe
Çözülmemiş Metin: mheu2i|i
Çözülmüş Metin: idaq.exe
Çözülmemiş Metin: mhe:82i|i
Çözülmüş Metin: ida64.exe
Çözülmemiş Metin: mheu:82i|i
Çözülmüş Metin: idaq64.exe
Çözülmemiş Metin: hrwt}2i|i
Çözülmüş Metin: dnspy.exe
Çözülmemiş Metin: wrsvx2i|i
Çözülmüş Metin: snort.exe
Çözülmemiş Metin: xewoqkv2i|i
Çözülmüş Metin: taskmgr.exe
Çözülmemiş Metin: qwgsrjmk2i|i
Çözülmüş Metin: msconfig.exe
Çözülmemiş Metin: qwmrjs762i|i
Çözülmüş Metin: msinfo32.exe
Çözülmemiş Metin: rixwxex2i|i
Çözülmüş Metin: netstat.exe
Çözülmemiş Metin: xewopmwx2i|i
Çözülmüş Metin: tasklist.exe

```

### Sonuç

Sonuçları karşımıza çıkmaktadır.Bu uygulamalar eğer aktif ise düzgün çalışmayacaktır.
"Process32Next","Process32First","CreateToolhelp32Snapshot" WınAPI kullanılarak System Process verilerine ulaşarak karşılaştırma yapmaktadır.
Bu Windows API'lar aracılığı ile sistem süreçleri hakkında bilgi sahibi olmaktadır.Buradan çıkarılacak çözümleyici sonuç ise söylenebilir ki 
Zararlı yazılım HEX olarak verilen değerleri ASCII +4 ile Encode işlemi gerçekleştirmiştir.Karmaşıklık amacı ilede böyle bir işlem gerçekleştirmiştir.

Yapılan Statik ve Dinamik incelemeler sonucu ise gerekli sonuçlara ulaşılmıştır.

CEVAP : `https://4h4d4buldun.com` 