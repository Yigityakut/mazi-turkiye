// Ortak üst ve alt bilgi (bağımlılıksız)
document.querySelectorAll("[data-header]").forEach((el) => {
  el.outerHTML = `<header class="site wrap"><a class="brand" href="/"><img src="/assets/icon.png" alt=""><b>Mazi Türkiye</b></a>
  <nav><a href="/destek/">Destek</a><a href="/kaynaklar/">Kaynaklar</a></nav></header>`;
});
document.querySelectorAll("[data-footer]").forEach((el) => {
  el.outerHTML = `<footer class="site wrap"><div><a href="/gizlilik/">Gizlilik</a><a href="/kvkk/">KVKK</a><a href="/kosullar/">Kullanım koşulları</a><a href="/kaynaklar/">Kaynaklar ve lisanslar</a><a href="/hesap-silme/">Hesap silme</a><a href="/destek/">Destek</a><a href="/en/privacy/">Privacy (EN)</a></div>
  <p>© ${new Date().getFullYear()} Mazi Türkiye. Fotoğraflar kamu malı veya açık lisanslı arşivlerden; her fotoğrafın atfı uygulamada ve <a href="/kaynaklar/">kaynaklar</a> sayfasında.</p></footer>`;
});
window.MAZI = {
  supabaseUrl: "https://ybhiddgwunzyquzrbzaf.supabase.co",
  key: "sb_publishable_YfIE8Fo1LCbF7DFH8kIR2g_gu-PbdtO",
  appStore: "https://apps.apple.com/tr/app/id0000000000",          // TODO: App Store kaydından sonra
  playStore: "https://play.google.com/store/apps/details?id=com.maziturkiye.app",
  async rpc(fn, args) {
    const r = await fetch(`${this.supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: "POST", headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(args ?? {}),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  storeLink() { return /android/i.test(navigator.userAgent) ? this.playStore : this.appStore; },
};
