# Current UI Audit v0.1

## Zakres audytu
Analiza obecnej implementacji UI w repo oraz jej zgodnosci z referencyjnymi wizualizacjami.

## Co wyglada dobrze
- Struktura aplikacji jest kompletna: dashboard, tablice dzieci, historia, ustawienia.
- Layout jest responsywny i dziala sensownie na mobile, tablet i desktop.
- Lokalny stan i zapisywanie danych sa spiete w spojny model.
- Obecne karty sa juz estetyczniejsze niz prosty dashboard bootstrapowy.
- Widoczna jest proba budowania rodzinnego brandingu przez kolor, ikonki i zaokraglenia.

## Co wyglada zle
- UI nadal sprawia wrazenie zbyt "systemowego", a nie produktowego.
- Zbyt wiele elementow ma podobny poziom wizualnej wagi.
- Karty sa ladne, ale za bardzo rowne i przewidywalne.
- Chore listy dalej przypominaja administracyjna tablice, a nie produkt dla rodziny.
- Emocjonalnosc i "dziecieca atrakcyjnosc" sa za slabe w porownaniu z referencjami.
- Widok rodzica jest zbyt skondensowany; brakuje wyraznej, dedykowanej sceny.

## Gdzie widok jest zbyt bootstrapowy
- Powtarzalne biale karty z delikatnym obramowaniem.
- Zbyt wiele podobnych chipow i pigulek bez mocniejszej hierarchii.
- Zbyt liniowy rytm layoutu w szczegolnosci w sekcjach zadan.
- Slabe odroznienie "hero", "summary" i "content" w calym ekranie.
- Przyciski sa czyste, ale nie maja wystarczajacego, rodzinnego charakteru.

## Gdzie brakuje personalizacji
- Dzieci sa odrozniane glownie kolorem, ale nie wizerunkiem systemowym.
- Brakuje silnego, centralnego avatara jako punktu identyfikacji.
- Sama nazwa dziecka nie buduje wystarczajaco unikalnej strefy.
- Skarbonka i historia nie sa wystarczajaco mocno "przypisane" do konkretnego dziecka.

## Gdzie brakuje atrakcyjnosci dla dzieci
- Za malo zabawy w balansie, nagrodach i mikrostanach.
- Za malo "wow" po wykonaniu zadania lub przyznaniu nagrody.
- Zadania sa czytelne, ale nie sa wystarczajaco przyjazne i zabawowe wizualnie.
- Widok nie daje czucia "wlasnego pokoju / wlasnej tablicy".

## Gdzie brakuje profesjonalnego UI dla doroslych
- Rodzic potrzebuje wiekszej pewnosci, ze akcje sa zatwierdzone i bezpieczne.
- Tryb administracyjny powinien byc bardziej jasny i mniej schowany.
- Historia zmian i saldo powinny byc bardziej czytelne jako narzedzie kontroli.
- Obecny UI jest ladny, ale nie komunikuje wystarczajaco dobrze zaufania i kontroli.

## Gdzie obecna implementacja odbiega od wczesniejszych wizualizacji
- Referencyjne grafiki byly bardziej efektowne, bardziej ilustracyjne i bardziej emotional-first.
- Obecny UI ma mniej scenografii i mniej mocno prowadzonego hero.
- Wczesniejsze wizualizacje mocniej eksponowaly avatar dziecka i skarbonke jako centralne motywy.
- Aktualna implementacja idzie w strone spokojnego dashboardu, a nie dopracowanego produktu rodzinnego.

## Elementy, które należy zaprojektować od nowa
- Dashboard rodzinny.
- Centralne karty Julci i Oliwci.
- Hero i topbar dla widoku dziecka.
- Karty zadaniowe.
- Sekcja skarbonki.
- Sekcje plusow i minusow.
- Historia z lepsza hierarchia i filtrowaniem.
- Tryb rodzica oraz jednorazowe odblokowanie.
- Modal dodawania zadania.
- Modal potwierdzania haslem Mama / Tata.

## Co jest wazne technicznie
- W kodzie nie powinno byc traktowania referencyjnych grafik jako background-image.
- Referencje UI musza zostac baza layoutu, nie dekoracja.
- Nazwy konceptowe w nowym kierunku to Julcia i Oliwcia.
- Obecny stan kodu jeszcze tego nie odzwierciedla w pelni, wiec wymaga odtworzenia wizualnego od podstaw.
