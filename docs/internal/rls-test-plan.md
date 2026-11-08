# Overs RLS-test

1. Konto A aktiverer Min sky og oppretter gruppe A.
2. Konto B aktiverer Min sky og oppretter gruppe B.
3. Verifiser at konto A ikke kan lese `user_data` for B.
4. Verifiser at konto A ikke kan lese `household_data` for gruppe B.
5. Generer gruppekode fra A og bli med fra B.
6. Verifiser at B nå kan lese og oppdatere gruppe A, men fortsatt ikke As private `user_data`.
7. Fjern B fra gruppen og verifiser at tilgang til gruppe A forsvinner umiddelbart.
8. Test utløpt/brukte koder og gjentatte feil kodeforsøk.
