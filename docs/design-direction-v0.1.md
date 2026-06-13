# Design Direction v0.1

## Kierunek ogolny
Family Tasks Board ma wygladac jak nowoczesny, cieply, premium produkt rodzinny.

Nie:
- nie panel administracyjny,
- nie prosty bootstrap dashboard,
- nie dekoracyjne tlo z obrazkiem,
- nie system wierszy i tabel.

Tak:
- rodzinny produkt z emocja,
- lekkie, kolorowe, ale spokojne karty,
- duze avatary i mocna personalizacja,
- mobile-first z bardzo mocnym pierwszym ekranem.

## Nazewnictwo produktu
- Julia -> Julcia
- Oliwia -> Oliwcia

To ma byc widoczne w warstwie projektowej, komunikacji i docelowo w UI.

## Zasady wizualne
- Duza hierarchia typografii.
- Mniej tekstu, wiecej sygnalow wizualnych.
- Karty o wiekszym promieniu i wiekszym oddechu.
- Subtelne gradienty, nie agresywne kolory.
- Mocne strefy kolorystyczne per dziecko.
- Avatary jako centrum personalizacji.
- Skarbonka jako hero element, nie drobny widget.
- Akcje rodzica jako wyrazne, szybkie i bezpieczne CTA.
- Dziecko ma czuc postep, nie administracje.

## Proponowany UX dla trybów

### Tryb dziecka
- Widok tylko do podgladu i motywacji.
- Zadania, saldo, plusy, minusy i achievements sa widoczne.
- Akcje wykonawcze nie powinny wygladac jak self-service do pieniędzy.
- Zamiast "oznacz wykonane" dziecko moze wyslac prosbe o zatwierdzenie.
- CTA dla dziecka:
  - "Popros o zatwierdzenie"
  - "Pokaż postep"
  - "Zobacz skarbonke"

### Tryb rodzica
- Pojawia sie po jednorazowym odblokowaniu haslem Mama lub Tata.
- Akcje rodzica sa wyeksponowane jako panel narzedziowy nad trecia.
- Rodzic moze:
  - zatwierdzic wykonanie zadania,
  - przyznac plus / minus,
  - dodac zadanie,
  - edytowac wartosc zadania,
  - cofnac wykonanie.

### Jednorazowe odblokowanie rodzica
- Wejscie przez modal / sheet z dwoma duzymi wyborami: Mama i Tata.
- Po poprawnym wpisaniu stan rodzica jest aktywny przez ograniczony czas.
- Widoczny licznik lub status "Rodzic odblokowany".
- Manualny przycisk "Zablokuj teraz".
- Auto-lock po czasie bezczynnosci albo po wyjsciu z widoku.

## Widoki

### 1. Dashboard rodzinny
Cel: jeden spokojny widok startowy dla rodzica.
- Dwie duze karty: Julcia i Oliwcia.
- Na karcie dziecka:
  - avatar,
  - saldo skarbonki,
  - aktywne zadania,
  - plusy,
  - minusy.
- Gora ekranu:
  - delikatny rodzinny hero,
  - krotki opis,
  - mały globalny summary.

### 2. Widok Julci
Cel: miec wlasna przestrzen dziecka.
- Hero z avatar-em Julci.
- Duzy blok saldo / wzrost / skarbonka.
- Szybkie akcje rodzica w pierwszym rzucie oka.
- Zadania jako karty z czytelnymi statusami.
- Historia i osiagniecia w prawej lub dolnej strefie zalezne od viewportu.

### 3. Widok Oliwci
Cel: ta sama struktura, ale inny ton wizualny.
- Inny kolor przewodni.
- Inny avatar i drobne akcenty ilustracyjne.
- Ta sama architektura informacji, ale osobna tozsamosc.

### 4. Modal dodania zadania
Cel: szybkie tworzenie bez poczucia formularza admina.
- Jedna kolumna na mobile.
- Wysokie pola input i mocny primary CTA.
- Typ zadania jako segmented control:
  - jednorazowe,
  - codzienne,
  - tygodniowe.
- Nagroda jako czytelny input z podpowiedzia.
- Opcjonalny opis.
- Wersja rodzica tylko po odblokowaniu.

### 5. Tryb rodzica
Cel: mocny sygnal "teraz zarzadzasz".
- Wyrazny badge aktywnego trybu.
- Inne tony przyciskow administracyjnych.
- Dodatkowy pasek szybkich akcji.
- Kontrolki sa wieksze, ale nie krzykliwe.

### 6. Historia
Cel: przeglad bez sciany tekstu.
- Filtry w formie pigułek.
- Osobny side summary.
- Karty wpisow zamiast listy surowych rekordow.
- Wpisy nagrod, plusow, minusow i zadan rozrozniamy kolorem oraz ikoną.

### 7. Skarbonka
Cel: jeden z najmocniejszych punktow widoku.
- Duza, wizualnie przyjemna karta salda.
- Widoczny przyrost, ostatnie wplywy, suma zarobiona.
- Delikatna animacja po nagrodzie.
- Skarbonka ma wygladac jak "serce ekonomii" dziecka.

### 8. Plusy i minusy
Cel: szybkie, jednoznaczne akcje rodzica.
- Predefiniowane akcje jako duze, szybkie chipy / buttons.
- Jedno klikniecie z mocna czytelnoscia.
- Oddzielny kolor dla plusow i minusow.
- Historia plusow/minusow ma byc widoczna pod akcjami.

### 9. Osiagniecia
Cel: motywacja i celebracja progresu.
- Niewielka, ale wyrazna sekcja medali / kart.
- Progi:
  - pierwsze zadanie,
  - 10 wykonanych zadan,
  - 50 zl w skarbonce,
  - 7 dni aktywnosci.
- Osiagniecia powinny dawać poczucie drogi, nie tylko checklisty.

### 10. Ustawienia
Cel: spokojna, zaufana sekcja rodzica.
- Informacje o trybie rodzica.
- Ustawienia danych lokalnych.
- Reset / eksport / przyszle sync.
- Minimalna ilosc tekstu, wyrazne sekcje.

## Co ma byc zauwazalne po pierwszym wejściu
- To aplikacja dla rodziny, nie dla biura.
- Julcia i Oliwcia sa osobnymi swiatami.
- Rodzic ma kontrole, ale nie obciaza interfejsu.
- Dziecko ma motywacje, kolory i poczucie postepu.

