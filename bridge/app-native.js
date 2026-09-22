/* AppNative — ponte entre o seu site e as funções nativas do app.
 * Inclua este arquivo no seu site:  <script src="/app-native.js"></script>
 * Tudo aqui só funciona dentro do app; no navegador comum isApp === false.
 */
(function () {
  var Cap = window.Capacitor;
  var isApp = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var P = (Cap && Cap.Plugins) || {};

  function need(name) {
    if (!isApp || !P[name]) throw new Error("Função nativa indisponível: " + name);
    return P[name];
  }

  var AppNative = {
    isApp: isApp,
    platform: isApp ? Cap.getPlatform() : "web",

    // Barra de status e splash
    hideSplash: function () { return isApp && P.SplashScreen ? P.SplashScreen.hide() : Promise.resolve(); },

    // Rede
    isOnline: function () {
      return isApp && P.Network ? P.Network.getStatus().then(function (s) { return s.connected; })
        : Promise.resolve(navigator.onLine);
    },
    onNetworkChange: function (cb) {
      if (!isApp || !P.Network) {
        var on = function () { cb(navigator.onLine); };
        window.addEventListener("online", on); window.addEventListener("offline", on);
        return function () { window.removeEventListener("online", on); window.removeEventListener("offline", on); };
      }
      var h = P.Network.addListener("networkStatusChange", function (s) { cb(s.connected); });
      return function () { Promise.resolve(h).then(function (x) { x.remove(); }); };
    },

    // Vibração / feedback tátil
    haptics: {
      impact: function (style) { return need("Haptics").impact({ style: style || "MEDIUM" }); },
      notification: function (type) { return need("Haptics").notification({ type: type || "SUCCESS" }); },
      vibrate: function (ms) { return need("Haptics").vibrate({ duration: ms || 300 }); },
      selection: function () { return need("Haptics").selectionStart(); }
    },

    // Mensagem rápida nativa
    toast: function (text, duration) {
      return need("Toast").show({ text: String(text), duration: duration || "short" });
    },

    // Caixas de diálogo nativas
    dialog: {
      alert: function (message, title) { return need("Dialog").alert({ title: title || "", message: String(message) }); },
      confirm: function (message, title) {
        return need("Dialog").confirm({ title: title || "", message: String(message) })
          .then(function (r) { return !!r.value; });
      },
      prompt: function (message, title) {
        return need("Dialog").prompt({ title: title || "", message: String(message) })
          .then(function (r) { return r.cancelled ? null : r.value; });
      }
    },

    // Área de transferência
    clipboard: {
      write: function (text) { return need("Clipboard").write({ string: String(text) }); },
      read: function () { return need("Clipboard").read().then(function (r) { return r.value; }); }
    },

    // Informações do aparelho
    device: {
      info: function () { return need("Device").getInfo(); },
      id: function () { return need("Device").getId().then(function (r) { return r.identifier || r.uuid; }); },
      battery: function () { return need("Device").getBatteryInfo(); },
      language: function () { return need("Device").getLanguageCode().then(function (r) { return r.value; }); }
    },

    // Ciclo de vida do app
    app: {
      info: function () { return need("App").getInfo(); },
      exit: function () { return need("App").exitApp(); },
      minimize: function () { return need("App").minimizeApp ? need("App").minimizeApp() : Promise.resolve(); },
      onBackButton: function (cb) {
        if (!isApp || !P.App) return function () {};
        var h = P.App.addListener("backButton", function (e) { cb(e); });
        return function () { Promise.resolve(h).then(function (x) { x.remove(); }); };
      },
      onStateChange: function (cb) {
        if (!isApp || !P.App) return function () {};
        var h = P.App.addListener("appStateChange", function (s) { cb(s.isActive); });
        return function () { Promise.resolve(h).then(function (x) { x.remove(); }); };
      }
    },

    // Teclado
    keyboard: {
      hide: function () { return isApp && P.Keyboard ? P.Keyboard.hide() : Promise.resolve(); },
      show: function () { return isApp && P.Keyboard ? P.Keyboard.show() : Promise.resolve(); },
      onResize: function (cb) {
        if (!isApp || !P.Keyboard) return function () {};
        var a = P.Keyboard.addListener("keyboardWillShow", function (i) { cb(i.keyboardHeight); });
        var b = P.Keyboard.addListener("keyboardWillHide", function () { cb(0); });
        return function () {
          Promise.resolve(a).then(function (x) { x.remove(); });
          Promise.resolve(b).then(function (x) { x.remove(); });
        };
      }
    },

    // Barra de status
    statusBar: {
      setColor: function (hex) { return need("StatusBar").setBackgroundColor({ color: hex }); },
      setStyle: function (style) { return need("StatusBar").setStyle({ style: style || "DARK" }); },
      hide: function () { return need("StatusBar").hide(); },
      show: function () { return need("StatusBar").show(); }
    },

    // Orientação da tela
    orientation: {
      current: function () { return need("ScreenOrientation").orientation().then(function (r) { return r.type; }); },
      lock: function (type) { return need("ScreenOrientation").lock({ orientation: type || "portrait" }); },
      unlock: function () { return need("ScreenOrientation").unlock(); }
    },

    // Armazenamento nativo (fica salvo mesmo limpando o cache do site)
    storage: {
      set: function (key, value) { return need("Preferences").set({ key: key, value: JSON.stringify(value) }); },
      get: function (key) {
        return need("Preferences").get({ key: key }).then(function (r) {
          try { return r.value === null ? null : JSON.parse(r.value); } catch (e) { return r.value; }
        });
      },
      remove: function (key) { return need("Preferences").remove({ key: key }); },
      clear: function () { return need("Preferences").clear(); }
    },

    // Abrir link no navegador do sistema / navegador interno
    openUrl: function (url) {
      if (isApp && P.Browser) return P.Browser.open({ url: url });
      window.open(url, "_blank");
      return Promise.resolve();
    },

    share: function (opts) { return need("Share").share(opts || {}); },
    camera: {
      takePhoto: function (opts) {
        return need("Camera").getPhoto(Object.assign(
          { quality: 80, resultType: "dataUrl", source: "CAMERA" }, opts || {}));
      },
      pickImage: function (opts) {
        return need("Camera").getPhoto(Object.assign(
          { quality: 80, resultType: "dataUrl", source: "PHOTOS" }, opts || {}));
      }
    },
    location: {
      current: function () { return need("Geolocation").getCurrentPosition({ enableHighAccuracy: true }); },
      watch: function (cb) { return need("Geolocation").watchPosition({ enableHighAccuracy: true }, cb); }
    },
    biometrics: {
      available: function () { return need("BiometricAuth").checkBiometry(); },
      verify: function (reason) {
        return need("BiometricAuth").authenticate({ reason: reason || "Confirme sua identidade" })
          .then(function () { return true; })
          .catch(function () { return false; });
      }
    },
    scanner: {
      scan: function () {
        var S = need("BarcodeScanner");
        return S.requestPermissions().then(function () { return S.scan(); })
          .then(function (r) { return (r.barcodes && r.barcodes[0] && r.barcodes[0].rawValue) || null; });
      }
    },
    push: {
      register: function (onToken, onMessage) {
        var Push = need("PushNotifications");
        return Push.requestPermissions().then(function (res) {
          if (res.receive !== "granted") return null;
          if (onToken) Push.addListener("registration", function (t) { onToken(t.value); });
          if (onMessage) Push.addListener("pushNotificationReceived", onMessage);
          return Push.register();
        });
      },
      // Notificação local (aparece no aparelho sem precisar de servidor)
      notify: function (title, body, seconds) {
        var LN = need("LocalNotifications");
        return LN.requestPermissions().then(function () {
          return LN.schedule({
            notifications: [{
              id: Math.floor(Math.random() * 100000),
              title: String(title || ""),
              body: String(body || ""),
              schedule: seconds ? { at: new Date(Date.now() + seconds * 1000) } : undefined
            }]
          });
        });
      }
    },
    download: function (url, fileName) {
      var FS = need("Filesystem");
      return fetch(url).then(function (r) { return r.blob(); }).then(function (blob) {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onerror = reject;
          reader.onload = function () {
            var base64 = String(reader.result).split(",")[1];
            resolve(FS.writeFile({ path: fileName, data: base64, directory: "DOCUMENTS" }));
          };
          reader.readAsDataURL(blob);
        });
      });
    },
    onDeepLink: function (cb) {
      if (!isApp || !P.App) return function () {};
      var h = P.App.addListener("appUrlOpen", function (e) { cb(e.url); });
      return function () { h.then(function (x) { x.remove(); }); };
    },
    purchases: {
      configure: function (apiKey, appUserId) {
        return need("Purchases").configure({ apiKey: apiKey, appUserID: appUserId || null });
      },
      offerings: function () { return need("Purchases").getOfferings(); },
      buy: function (packageToBuy) { return need("Purchases").purchasePackage({ aPackage: packageToBuy }); },
      restore: function () { return need("Purchases").restorePurchases(); }
    },
  };

  // Links externos abrem no navegador do sistema
  if (isApp && P.Browser) {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!/^https?:/i.test(href)) return;
      if (new URL(href, location.href).host === location.host) return;
      e.preventDefault();
      P.Browser.open({ url: href });
    }, true);
  }

  window.AppNative = AppNative;
  if (isApp && P.SplashScreen) {
    window.addEventListener("load", function () { setTimeout(function () { P.SplashScreen.hide(); }, 300); });
  }
})();
