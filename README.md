# Meu app — app Android e iOS

Projeto gerado pelo url2app. Ele abre **https://native-web-builder.lovable.app/teste-nativo** dentro de um app nativo
(Capacitor) com as funções do celular que você escolheu.

## O que você precisa

- Node.js 20 ou superior
- Android Studio (para gerar o APK/AAB)
- Um Mac com Xcode (para gerar o app iOS) — exigência da Apple
- Contas de desenvolvedor: Google Play (uma vez, US$ 25) e Apple (US$ 99/ano)

## Passo a passo

```bash
npm install
npm run add:android
npm run add:ios                     # somente no Mac
npm run sync
npm run open:android                # abre o Android Studio
npm run open:ios                    # abre o Xcode
```

No Android Studio: menu **Build > Generate Signed Bundle / APK**.
No Xcode: menu **Product > Archive**.

Sempre que mudar algo, rode `npm run sync` de novo.

## Build na nuvem (sem Android Studio / sem Mac)

No url2app, a aba "Build na nuvem" faz tudo sozinha: cria o repositório, envia estes
arquivos e inicia a build. Você não precisa de Android Studio nem de Mac.

Sem certificados cadastrados sai um **APK de teste** (Android) e um app iOS **sem
assinatura** — bons para testar no aparelho, mas não aceitos pelas lojas.

Para publicar nas lojas, cadastre no Codemagic:

1. A keystore do Android no grupo de variáveis `android_signing`
   (`CM_KEYSTORE`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`).
2. O certificado da Apple em **Teams > Code signing identities**
   (exige conta Apple Developer, US$ 99/ano).

Com a keystore presente, a mesma build passa a gerar AAB e APK assinados.

## Ícone e splash

Coloque um `icon.png` de 1024x1024 na pasta `resources/` e rode `npx capacitor-assets generate`.

## Funções que todo app já vem com elas

`AppNative.toast`, `AppNative.haptics` (vibração), `AppNative.dialog` (alerta,
confirmação, pergunta), `AppNative.clipboard`, `AppNative.device` (modelo, bateria,
idioma), `AppNative.app` (versão, botão voltar, app em segundo plano, fechar),
`AppNative.keyboard`, `AppNative.statusBar`, `AppNative.orientation`,
`AppNative.storage`, `AppNative.openUrl`, `AppNative.isOnline` e
`AppNative.onNetworkChange`.

## Funções nativas ativadas

- **Notificações push** — `AppNative.push.register()`
- **Câmera e galeria** — `AppNative.camera.takePhoto()`
- **Compartilhar** — `AppNative.share({ title, text, url })`
- **Geolocalização** — `AppNative.location.current()`
- **Biometria** — `AppNative.biometrics.verify()`
- **Leitor de QR code** — `AppNative.scanner.scan()`
- **Downloads de arquivos** — `AppNative.download(url, nomeDoArquivo)`
- **Deep links / links universais** — `AppNative.onDeepLink(callback)`
- **Compras dentro do app** — `AppNative.purchases.buy(produtoId)`

Cole esta linha no HTML do seu site (antes de `</body>`):

```html
<script src="https://native-web-builder.lovable.app/api/public/bridge/67a39f0d-7a29-4bb6-936f-fdec82e6bab8.js"></script>
```

Esse endereço é servido pelo url2app e acompanha as funções que você ativar.
Se preferir hospedar você mesmo, use o arquivo `bridge/app-native.js` desta pasta.


Exemplo no seu site:

```js
if (window.AppNative?.isApp) {
  const foto = await AppNative.camera.takePhoto();
  console.log(foto.dataUrl);
}
```

## Notificações push

1. Crie um projeto no Firebase e baixe o `google-services.json` (Android) e o
   `GoogleService-Info.plist` (iOS).
2. Coloque-os em `android/app/` e no projeto `ios/App/App` pelo Xcode.
3. No Xcode, ative **Push Notifications** e **Background Modes > Remote notifications**.
4. No seu site: `AppNative.push.register((token) => enviarTokenParaSeuServidor(token));`
## Compras dentro do app

Use uma chave do RevenueCat e chame `AppNative.purchases.configure("SUA_CHAVE")`.
Cadastre os produtos no Google Play Console e no App Store Connect antes de testar.

## Configuração aplicada

- Identificador: `app.meuapp.mobile`
- Orientação: retrato
- Tela cheia: não
- Modo offline: sim (tela própria sem internet)
- Links externos no navegador: sim
- Puxar para atualizar: sim
