# 81 il: Natural Earth adı -> (Türkçe ad, plaka, bölge)
# Bölgeler: Marmara, Ege, Akdeniz, İç Anadolu, Karadeniz, Doğu Anadolu, Güneydoğu Anadolu
M, E, A, I, K, D, G = "Marmara", "Ege", "Akdeniz", "İç Anadolu", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu"
PROVINCES = {
 "Adana": ("Adana", 1, A), "Adiyaman": ("Adıyaman", 2, G), "Afyonkarahisar": ("Afyonkarahisar", 3, E),
 "Agri": ("Ağrı", 4, D), "Amasya": ("Amasya", 5, K), "Ankara": ("Ankara", 6, I), "Antalya": ("Antalya", 7, A),
 "Artvin": ("Artvin", 8, K), "Aydin": ("Aydın", 9, E), "Balikesir": ("Balıkesir", 10, M), "Bilecik": ("Bilecik", 11, M),
 "Bingöl": ("Bingöl", 12, D), "Bitlis": ("Bitlis", 13, D), "Bolu": ("Bolu", 14, K), "Burdur": ("Burdur", 15, A),
 "Bursa": ("Bursa", 16, M), "Çanakkale": ("Çanakkale", 17, M), "Çankiri": ("Çankırı", 18, I), "Çorum": ("Çorum", 19, K),
 "Denizli": ("Denizli", 20, E), "Diyarbakir": ("Diyarbakır", 21, G), "Edirne": ("Edirne", 22, M), "Elazig": ("Elazığ", 23, D),
 "Erzincan": ("Erzincan", 24, D), "Erzurum": ("Erzurum", 25, D), "Eskisehir": ("Eskişehir", 26, I), "Gaziantep": ("Gaziantep", 27, G),
 "Giresun": ("Giresun", 28, K), "Gümüshane": ("Gümüşhane", 29, K), "Hakkari": ("Hakkâri", 30, D), "Hatay": ("Hatay", 31, A),
 "Isparta": ("Isparta", 32, A), "Mersin": ("Mersin", 33, A), "Istanbul": ("İstanbul", 34, M), "Izmir": ("İzmir", 35, E),
 "Kars": ("Kars", 36, D), "Kastamonu": ("Kastamonu", 37, K), "Kayseri": ("Kayseri", 38, I), "Kirklareli": ("Kırklareli", 39, M),
 "Kirsehir": ("Kırşehir", 40, I), "Kocaeli": ("Kocaeli", 41, M), "Konya": ("Konya", 42, I), "Kütahya": ("Kütahya", 43, E),
 "Malatya": ("Malatya", 44, D), "Manisa": ("Manisa", 45, E), "K. Maras": ("Kahramanmaraş", 46, A), "Mardin": ("Mardin", 47, G),
 "Mugla": ("Muğla", 48, E), "Mus": ("Muş", 49, D), "Nevsehir": ("Nevşehir", 50, I), "Nigde": ("Niğde", 51, I),
 "Ordu": ("Ordu", 52, K), "Rize": ("Rize", 53, K), "Sakarya": ("Sakarya", 54, M), "Samsun": ("Samsun", 55, K),
 "Siirt": ("Siirt", 56, G), "Sinop": ("Sinop", 57, K), "Sivas": ("Sivas", 58, I), "Tekirdag": ("Tekirdağ", 59, M),
 "Tokat": ("Tokat", 60, K), "Trabzon": ("Trabzon", 61, K), "Tunceli": ("Tunceli", 62, D), "Sanliurfa": ("Şanlıurfa", 63, G),
 "Usak": ("Uşak", 64, E), "Van": ("Van", 65, D), "Yozgat": ("Yozgat", 66, I), "Zinguldak": ("Zonguldak", 67, K),
 "Aksaray": ("Aksaray", 68, I), "Bayburt": ("Bayburt", 69, K), "Karaman": ("Karaman", 70, I), "Kinkkale": ("Kırıkkale", 71, I),
 "Batman": ("Batman", 72, G), "Sirnak": ("Şırnak", 73, G), "Bartın": ("Bartın", 74, K), "Ardahan": ("Ardahan", 75, D),
 "Iğdir": ("Iğdır", 76, D), "Yalova": ("Yalova", 77, M), "Karabük": ("Karabük", 78, K), "Kilis": ("Kilis", 79, G),
 "Osmaniye": ("Osmaniye", 80, A), "Düzce": ("Düzce", 81, K),
}
# Haritada gösterilecek büyük şehirler (il merkezi koordinatları)
CITIES = [
 ("İstanbul", 41.0082, 28.9784, 1), ("Ankara", 39.9334, 32.8597, 1), ("İzmir", 38.4237, 27.1428, 1),
 ("Bursa", 40.1885, 29.0610, 2), ("Antalya", 36.8969, 30.7133, 1), ("Adana", 37.0000, 35.3213, 2),
 ("Konya", 37.8746, 32.4932, 2), ("Gaziantep", 37.0662, 37.3833, 2), ("Diyarbakır", 37.9144, 40.2306, 2),
 ("Trabzon", 41.0027, 39.7168, 1), ("Samsun", 41.2867, 36.33, 2), ("Erzurum", 39.9043, 41.2679, 2),
 ("Van", 38.5012, 43.3729, 2), ("Kayseri", 38.7205, 35.4826, 2), ("Eskişehir", 39.7767, 30.5206, 3),
 ("Edirne", 41.6771, 26.5557, 3), ("Çanakkale", 40.1553, 26.4142, 3), ("Muğla", 37.2153, 28.3636, 3),
 ("Sivas", 39.7477, 37.0179, 3), ("Malatya", 38.3552, 38.3095, 3), ("Şanlıurfa", 37.1591, 38.7969, 3),
 ("Hatay", 36.2021, 36.1600, 3), ("Mersin", 36.8121, 34.6415, 3), ("Kars", 40.6013, 43.0975, 3),
 ("Sinop", 42.0231, 35.1531, 3), ("Denizli", 37.7765, 29.0864, 3), ("Nevşehir", 38.6244, 34.7239, 3),
 ("Rize", 41.0201, 40.5234, 3), ("Mardin", 37.3212, 40.7245, 3), ("Kastamonu", 41.3887, 33.7827, 3),
]
