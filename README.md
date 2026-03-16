# Omröstning - Rocket.Chat Poll App

En svensk omröstnings-app för Rocket.Chat med stöd för:
- Enkel röst (ett val) OCH flerval
- Valbar anonymitet  
- Tidsgräns med auto-stängning
- Ändra röst genom att klicka igen
- Realtids progress bars

## Installation

1. Ladda ner senaste `.zip` från Releases
2. I Rocket.Chat: Admin → Apps → Private Apps → Upload App
3. Aktivera appen

## Användning

### Med modal (rekommenderat)
```
/omrostning
```
Öppnar ett formulär där du kan konfigurera:
- Fråga
- 2-5 alternativ
- Röstningstyp (enkel/flerval)
- Anonymitet (öppen/anonym)
- Visa resultat (alltid/efter avslut)
- Tidsgräns (ingen/5min/15min/30min/1h/2h/24h)

### Snabbsyntax
```
/omrostning "Vad ska vi äta?" "Pizza" "Tacos" "Sushi"
```

### Alias
```
/rost
```

## Features

### Progress Bars
```
██████████░░░░░ 66.7% (2)
```

### Röstning
- Klicka "Rösta" för att rösta
- Klicka igen för att ångra din röst
- Vid enkel röst: byter automatiskt till nytt alternativ

### Anonymitet
- **Öppen:** Visar namn på de som röstat
- **Anonym:** Visar endast antal röster

### Tidsgräns
- Omröstningen stängs automatiskt när tiden är slut
- Röstknapparna försvinner och resultatet visas

## Utveckling

```bash
# Installera beroenden
npm install

# Kompilera TypeScript
npm run build

# Paketera app
npm run package
# eller
rc-apps package --experimental-native-compiler
```

## Licens

MIT - Team Våffla
