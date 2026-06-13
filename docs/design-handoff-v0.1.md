# Design Handoff v0.1

## Cel
Ten dokument ma byc zrodlem prawdy dla przyszlej implementacji UI.
Developer ma odtworzyc layout z referencji, a nie interpretowac go jako ogolny dashboard.

## Lista widokow
1. Dashboard rodzinny
2. Widok Julci
3. Widok Oliwci
4. Historia
5. Ustawienia
6. Modal dodawania zadania
7. Modal potwierdzania Mama / Tata

## Lista komponentow
- App header
- Child nav / family nav
- Family hero banner
- Child hero card
- Balance / savings panel
- Task card
- Task status chip
- Quick action button
- Parent unlocked badge
- Parent lock overlay
- History filter chips
- History row card
- Achievement tile
- Settings section card
- Parent auth modal
- Add task modal

## Layout rules
- Mobile first.
- Jedna glowna kolumna na mobile.
- Na tablet i desktop dopiero pojawia sie dodatkowy sidebar / druga kolumna.
- Najwazniejsze rzeczy musza byc widoczne above the fold.
- Karty musza miec duzo oddechu i miekkie zaokraglenia.
- Nie stosowac tabel jako podstawowego wzorca listy.

## Design tokens

### Kolory
- `ink` - tekst glowny
- `paper` - tlo kart i powierzchni
- `mint` - saldo, spokojne strefy
- `sky` - informacje, aktywnosc
- `sun` - plusy, sukcesy, nagrody
- `coral` - minusy, ostrzezenia
- `violet` - elementy premium / celebracyjne, tylko oszczednie

### Typografia
- Naglowki: duze, okragle, przyjazne.
- Body: czytelne, spokojne, bez nadmiaru font-weight.
- Etykiety: male uppercase tylko pomocniczo.

### Spacing
- Duze sekcje: 24-40px.
- Karty i elementy wewnetrzne: 12-20px.
- Chipy i badge: 8-12px.
- Mobile powinien czuc "oddech", nie sciane tekstu.

### Radius
- Karty: 24-32px.
- Panele hero: 28-36px.
- Chipy: 999px.

### Shadow / depth
- Subtelny, mieki cień.
- Glow tylko przy nagrodach i stanach sukcesu.
- Bez ostrych, adminowych ramek.

## Zasady dla avatarow Julci i Oliwci
- Avatar ma byc centralny i rozpoznawalny.
- Nie uzywac avatarow jako tła calej strony.
- Avatar moze byc umieszczony w karcie, hero i w miniaturach.
- Kazde dziecko ma osobny kolor przewodni i drobne akcenty.
- Avatar ma wspierac emocje, a nie zaslaniac content.

## Zasady dla trybu rodzica
- Tryb rodzica ma byc wyraznie odroznialny od trybu dziecka.
- Stan odblokowania musi byc widoczny.
- Rodzic otrzymuje szybkie, duze akcje, ale nie nadmiar kontroli w jednym miejscu.
- Auto-lock i manual lock musza byc widoczne jako element bezpieczenstwa.
- Zadna wazna operacja nie moze wygladac jak akcja dziecka.

## Zasady dla kart zadan
- Karta zadania:
  - nazwa,
  - krotki opis,
  - wartosc,
  - status,
  - frequency.
- Karta ma byc przyjazna, nie tabelaryczna.
- Dla zadan cyklicznych widoczny ma byc rytm.
- Przyciski edycji i zatwierdzania maja byc w kompaktowym, ale widocznym układzie.

## Zasady dla skarbonki
- Skarbonka ma byc hero assetem stanu dziecka.
- Zmiana salda powinna byc celebracyjna.
- Widoczna ma byc:
  - aktualna kwota,
  - suma zarobiona,
  - historia wplywow,
  - opcjonalny cel.
- Animacja po nagrodzie ma byc lekka i przyjemna.

## Zasady dla plusow / minusow
- Plusy i minusy maja byc szybkie do przyznania przez rodzica.
- Maja miec odrębne kolory i ikonografie.
- Predefiniowane akcje powinny byc widoczne jako pierwsza warstwa.
- Historia plusow/minusow ma byc latwa do przeskanowania.

## Zasady dla historii
- Historia ma wspierac filtrowanie po dziecku i kategorii.
- Wpisy powinny byc czytelne przy skanowaniu wzrokiem.
- Najnowsze wpisy maja byc najwyzej.
- Nagrody, zadania, plusy i minusy maja miec jasne rozroznienie wizualne.

## Kryteria akceptacji UI
- Dashboard nie wyglada jak prosty panel administracyjny.
- Widoczna jest wyrazna personalizacja Julci i Oliwci.
- Skarbonka jest mocnym elementem wizualnym.
- Tryb rodzica jest bezpieczny i czytelny.
- Zadania sa kartami, nie wierszami tabeli.
- UI dobrze dziala na mobile, tablet i desktop.
- Grafiki referencyjne nie sa uzyte jako background-image.
- Odbiorca powinien czuc produkt rodzinny, a nie narzedzie biurowe.
