# Overs

Overs er en personlig økonomiapp bygget med Expo og React Native. Appen samler budsjett, forsikringer, abonnement, sparing og økonomisk innsikt i én oversikt.

## Status
Prosjektet er i aktiv utvikling, versjon 0.1.0. Data lagres lokalt med AsyncStorage. Appen har førstegangsoppsett og starter med tomme økonomidata.

## Struktur
```text
app/
  index.tsx
src/
  overs/
    model.ts
    styles.ts
```
Kun faktiske ruter ligger under `app/`. Hjelpefiler ligger under `src/`.

## Lokal utvikling
```powershell
npm install
npx expo start
```

## EAS
EAS-prosjektet er konfigurert som `@grevelen/overs`, og `preview` bruker intern distribusjon.
