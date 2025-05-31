# ⏱️ YouTube Timestamper

Een handige Chrome-extensie voor contentmakers en livestreamers.  
Toont de **huidige timestamp** van de YouTube-video die je bekijkt, en laat je eenvoudig een **snapshot** of een **clip** maken van dat moment.

## 🎯 Functionaliteit

- ✅ Toont real-time de timestamp van je YouTube-video (bijv. `01:12:34`)
- ✅ Kopieert de timestamp naar je klembord met één klik
- ✅ Neemt een **screenshot** van het videobeeld op dat exacte moment
- ✅ (Experimenteel) Maakt een korte **clip** van het huidige punt in de video (indien ondersteund)

## 🧪 Voorbeeldgebruik

Stel je kijkt een livestream en wilt het moment vastleggen waarop er een wicket valt.  
Met deze extensie kun je:

1. De timestamp kopiëren (`23:14`)
2. Een snapshot nemen van het videobeeld
3. Optioneel een clip maken (bijv. van 10 seconden vanaf dat moment)

Ideaal voor highlight-compilaties, social media of als notitie tijdens live-commentaar.

## 🔧 Installatie

1. Clone deze repository:

   ```bash
   git clone https://github.com/<jouwgebruikersnaam>/youtube-timestamper.git
   ```

2. Ga in Chrome naar `chrome://extensions/`
3. Zet rechtsboven **Developer mode** aan
4. Klik op **Load unpacked**
5. Selecteer de map van dit project

## 🛠 Gebruik

1. Open een YouTube-video of livestream
2. Klik op het extensie-icoon
3. Je ziet de huidige timestamp
4. Gebruik de knoppen om:
   - 📋 Timestamp te kopiëren
   - 📸 Snapshot te maken
   - 🎞️ Clip te starten (indien beschikbaar)

## 📁 Projectstructuur

```
youtube-timestamper/
├── manifest.json
├── background.js (optioneel)
├── content.js
├── popup.html
├── popup.js
├── styles.css
└── icons/
```

## 🧠 TODO / Roadmap

- [ ] Hotkeys instellen voor snelle timestamp/snapshot
- [ ] Integratie met Google Drive of lokaal opslaan
- [ ] Betere clip-functionaliteit via YouTube API

## 📜 Licentie

MIT © [Jouw Naam]
