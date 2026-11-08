# App Store Connect – App Privacy for Overs

Oppdater svarene før ekstern TestFlight/App Store-distribusjon.

## Data knyttet til brukeren
- Kontaktinformasjon: e-postadresse og eventuelt navn fra Apple/Google/e-postinnlogging.
- Brukerinnhold: økonomidata brukeren registrerer, inkludert inntekter, utgifter, sparing, forsikringer og abonnement.
- Bruker-ID: Supabase Auth user ID.

## Formål
- Appfunksjonalitet: konto, sikkerhetskopiering, synkronisering mellom egne enheter og gruppedeling.
- Sikkerhet: autentisering, tilgangskontroll og konfliktkontroll.

## Ikke brukt til
- Tredjepartsannonsering.
- Utviklerens annonsering eller markedsføring.
- Sporing på tvers av andre selskapers apper/nettsteder.

## Kontroll før innsending
- Supabase/Expo SDK-enes faktiske datapraksis må kontrolleres mot gjeldende privacy manifests og avtaler.
- Kontosletting må være tilgjengelig inne i appen.
- Privacy Policy URL må peke til den publiserte nye erklæringen.
