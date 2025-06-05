# 🔔 ASPEN Digital Alarms PWA

Sistema de alarmes inteligente para horários ASPEN Digital com notificações push, funcionalidade offline e interface moderna.

## 📱 Funcionalidades

### ⚡ PWA Completo
- 📄 **Manifest.json** configurado
- ⚙️ **Service Worker** para funcionamento offline
- 🔔 **Push Notifications** mesmo em segundo plano
- 📱 **Instalação como app** nativo
- 🎨 **Interface responsiva** e moderna

### 🔊 Sistema de Alarmes
- ⏰ **20 horários pré-configurados** baseados no padrão ASPEN
- 🔊 **Alertas sonoros** harmoniosos com controle de volume
- 👁️ **Pop-ups visuais** com animações
- 📱 **Notificações push** persistentes
- 🎯 **Próximo alarme** com countdown

### 🛠️ Recursos Avançados
- 🔆 **Wake Lock** - mantém tela ativa
- 📵 **Funciona offline** após carregamento
- 💾 **Salva configurações** automaticamente
- 📊 **Log de alarmes** disparados
- ⚡ **Atalhos de teclado** (Espaço = start/stop, T = testar)

## 📂 Estrutura de Arquivos

```
aspen-alarms/
├── index.html              # Arquivo principal
├── manifest.json           # Configuração PWA
├── sw.js                   # Service Worker
├── css/
│   └── styles.css          # Estilos principais
├── js/
│   └── app.js              # JavaScript principal
├── icons/                  # Ícones PWA (vários tamanhos)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-32x32.png
│   ├── favicon-16x16.png
│   ├── badge-72x72.png
│   ├── shortcut-start.png
│   ├── shortcut-test.png
│   ├── action-snooze.png
│   └── action-dismiss.png
├── sounds/
│   └── alarm.mp3           # Som opcional
├── screenshots/
│   ├── mobile.png
│   └── desktop.png
└── README.md               # Este arquivo
```

## 🚀 Como Usar

### 1️⃣ Hospedar o PWA

#### GitHub Pages (Recomendado)
```bash
1. Crie repositório no GitHub
2. Faça upload de todos os arquivos
3. Settings → Pages → Source: Deploy from branch
4. Branch: main → Save
5. URL: https://seuusuario.github.io/aspen-alarms
```

#### Netlify
```bash
1. Acesse netlify.com
2. Arraste pasta do projeto → Deploy
3. URL automática gerada
```

#### Vercel
```bash
1. Acesse vercel.com
2. Import Git Repository ou upload direto
3. Deploy automático
```

### 2️⃣ Gerar APK

#### PWA Builder (Microsoft)
```bash
1. Acesse pwabuilder.com
2. Cole URL do PWA hospedado
3. Start → Package → Android → Download APK
```

#### Bubblewrap (Google)
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://seusite.com/manifest.json
bubblewrap build
```

### 3️⃣ Instalar no Mobile

#### Android
1. Abra no Chrome → Menu → "Adicionar à tela inicial"
2. Ou baixe APK → Configurações → Permitir fontes desconhecidas → Instalar

#### iOS
1. Abra no Safari → Compartilhar → "Adicionar à Tela de Início"

## 📋 Horários Configurados

### Padrão ASPEN Digital:
- **📍 Isolado:** 08:30
- **🟢 Bloco 1:** 09:50, 10:10, 10:30, 10:50
- **🟡 Bloco 2:** 12:10, 12:30, 12:50, 13:10  
- **🔵 Bloco 3:** 14:30, 14:50, 15:10, 15:30
- **🟠 Bloco 4:** 16:50, 17:10, 17:30, 17:50
- **🔴 Bloco 5:** 19:10, 19:30, 19:50

*Intervalos de 20 minutos com pausas de 1h20min entre blocos*

## 🎯 Como Personalizar

### Alterar Horários
Edite o array `alarmTimes` em `js/app.js`:
```javascript
this.alarmTimes = [
  '08:30', '09:50', // Adicione seus horários aqui
  // ... resto dos horários
];
```

### Personalizar Cores
Modifique as variáveis CSS em `css/styles.css`:
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #FF6B6B;
}
```

### Adicionar Sons Personalizados
1. Coloque arquivo MP3 na pasta `sounds/`
2. Modifique função `createAlarmSound()` em `js/app.js`

## 🔧 Recursos Técnicos

### Compatibilidade
- ✅ Chrome/Edge 67+
- ✅ Firefox 60+
- ✅ Safari 13+
- ✅ Android WebView 67+
- ✅ iOS Safari 13+

### APIs Utilizadas
- **Service Worker** - Cache e offline
- **Web App Manifest** - Instalação PWA
- **Notifications API** - Push notifications
- **Screen Wake Lock** - Manter tela ativa
- **Web Audio API** - Sons personalizados
- **Vibration API** - Vibração mobile
- **Local Storage** - Salvar configurações

### Performance
- 📦 **Tamanho total:** ~50KB (sem ícones)
- ⚡ **Carregamento:** <2s em 3G
- 🔋 **Bateria:** Otimizado para baixo consumo
- 💾 **Cache:** Funciona 100% offline

## 📱 Screenshots

### Mobile
![Mobile](screenshots/mobile.png)

### Desktop  
![Desktop](screenshots/desktop.png)

## 🐛 Solução de Problemas

### Notificações não funcionam
1. Verifique se permitiu notificações no navegador
2. Em Chrome: Configurações → Privacidade → Notificações
3. Certifique-se que site está em HTTPS

### Som não toca
1. Clique em "Testar" para ativar Audio Context
2. Verifique volume do sistema e do app
3. Alguns navegadores bloqueiam áudio sem interação do usuário

### PWA não instala
1. Verifique se manifest.json está acessível
2. Site deve estar em HTTPS
3. Chrome DevTools → Application → Manifest (verificar erros)

### Alarmes não disparam em segundo plano
1. Mantenha aba/app aberto
2. Ative notificações push
3. No Android: desative otimização de bateria para o navegador

## 📄 Licença

MIT License - Livre para uso pessoal e comercial.

## 🤝 Contribuição

1. Fork do projeto
2. Crie branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abra Pull Request

## 📞 Suporte

- 🐛 **Issues:** [GitHub Issues](https://github.com/compueber/aspen-alarms/issues)

## 🔄 Changelog

### v2.0.0 (Atual)
- ✅ PWA completo com Service Worker
- ✅ Notificações push persistentes
- ✅ Interface redesenhada
- ✅ Wake Lock para manter tela ativa
- ✅ Arquitetura modular separada

### v1.0.0
- ✅ Sistema básico de alarmes
- ✅ Interface responsiva
- ✅ Sons harmoniosos

---

🔔 **ASPEN Digital Alarms** - Sistema profissional de alarmes PWA  
Desenvolvido com ❤️ para máxima eficiência e experiência do usuário.
