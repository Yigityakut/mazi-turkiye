-- Alan adı alınana kadar web GitHub Pages'te (*.vercel.app Türkiye'den erişilemiyor). Meydan okuma linkleri buradan üretilir.
update public.app_config set value = '"https://yigityakut.github.io/maziturkiye"'::jsonb where key = 'public_web_url';
