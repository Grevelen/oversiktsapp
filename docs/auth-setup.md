# Overs auth-oppsett

## Lokal plassering
Denne filen kan ligge i `docs/auth-setup.md`.

## Installert / nødvendig

```powershell
npx.cmd expo install expo-auth-session expo-web-browser
```

Supabase-klienten bruker i tillegg `@supabase/supabase-js`, `react-native-url-polyfill` og `expo-secure-store`.

## Supabase URL Configuration

- Site URL: `https://grevelen.github.io/oversiktsapp/`
- Redirect URL: `overs://auth/callback`

## Supabase Providers

### Apple
Aktiver Apple først etter at Service ID / Sign in with Apple-konfigurasjon og Supabase callback er ferdig satt opp.

### Google
Aktiver Google først etter at OAuth-klienten og Supabase callback er ferdig satt opp i Google Cloud.

## Viktig release-gate
Konto/skylagring skal ikke publiseres til production før:

- kontosletting er implementert,
- cloud-personvernerklæringen er publisert,
- `Om Overs` beskriver skylagring og familiedeling,
- App Store Connect App Privacy er oppdatert,
- husholdningsdeling er testet med to separate kontoer,
- RLS-test viser at en bruker ikke kan lese en annen husholdnings data.
