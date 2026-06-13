# Design Mockups v0.1

To sa lekkie mockupy referencyjne. Nie sa czescia aplikacji produkcyjnej.
Cel: uchwycic layout, hierarchie i flow przed implementacja.

## 1. Dashboard rodzinny

```
[ Header: logo | Dashboard | Historia | Ustawienia ]

[ Hero: "Dwie tablice, jedna spokojna codziennosc." ]
[ Global summary chips ]

[ Julcia card ]   [ Oliwcia card ]
  avatar             avatar
  saldo              saldo
  aktywne zadania    aktywne zadania
  plusy              plusy
  minusy             minusy
  CTA do tablicy     CTA do tablicy
```

### Priorytet
- Najpierw dzieci.
- Potem saldo i aktywnosc.
- Na dole tylko krotka historia i cele.

## 2. Karta Julci

```
[ Avatar Julci ] [ Tytul ] [ status rodzica ]
[ Balance hero / skarbonka ]
[ Quick actions: Dodaj zadanie | Plus | Minus ]
[ Tasks stack ]
[ Side rail: historia | osiagniecia | podsumowanie ]
```

### Ton
- cieply, jasno-zielono/teal,
- delikatne glow,
- wiecej przestrzeni nad foldem.

## 3. Karta Oliwci

```
[ Avatar Oliwci ] [ Tytul ] [ status rodzica ]
[ Balance hero / skarbonka ]
[ Quick actions: Dodaj zadanie | Plus | Minus ]
[ Tasks stack ]
[ Side rail: historia | osiagniecia | podsumowanie ]
```

### Ton
- cieply, zlotawo-pomaranczowy,
- bardziej sloneczny,
- ta sama struktura co Julcia, inna osobowosc kolorystyczna.

## 4. Widok dziecka ze skarbonka i zadaniami

```
[ Child hero ]
[ balance card - duze saldo ]
[ progress row - active / done / rewards ]
[ task cards ]
[ achievements strip ]
[ savings history ]
```

### Zasada
- Skarbonka jest mocno widoczna.
- Zadania sa kafelkami, nie tabelą.
- Historia jest referencyjna, ale nie dominuje.

## 5. Tryb rodzica odblokowany

```
[ Parent unlocked banner ]
[ Sticky parent actions ]
[ Approve completion | Add task | Edit value | Add plus | Add minus | Lock now ]
[ Child content underneath ]
```

### Zasada
- Tryb rodzica musi byc czytelny od pierwszego spojrzenia.
- To overlay stanu i narzedzi, a nie osobny, zimny panel administracyjny.

## Layout map

### Mobile
- top header
- hero / summary
- jedna glowna karta dziecka
- szybkie akcje
- lista zadan
- skarbonka
- historia / osiagniecia
- sticky bottom nav lub compact action bar

### Tablet
- hero i summary w jednej sekcji
- karta dziecka + sidebar
- taski w szerokiej kolumnie
- history / achievements w kolumnie bocznej

### Desktop
- dwie kolumny dla dashboardu rodzinnego
- dziecko jako centralna karta, sidebar jako wspierajacy panel
- duzo "air" wokol glownego hero

## Design tokens - szkic

### Kolory
- `mint` - spokojne strefy i saldo
- `sky` - statusy i sekcje informacyjne
- `sun` - plusy, nagrody, sukcesy
- `coral` - minusy i ostrzezenia
- `ink` - tekst glowny
- `paper` - tlo i powierzchnie kart

### Radius
- `xl` dla kart
- `2xl` dla hero
- `full` dla chipow i pigułek

### Typografia
- gruba, okragla, przyjazna,
- duze naglowki,
- krotkie body,
- male uppercase labels tylko jako helper.

## Komponenty referencyjne
- Header
- Child hero card
- Balance card
- Task card
- Quick action buttons
- Parent auth modal
- History item
- Achievement tile
- Savings summary panel

## Co jest wazne dla developmentu pozniej
- Mockupy maja byc baza do kodu, nie dekoracja.
- Avatar nie moze stac sie background-image calego dashboardu.
- Każdy widok musi dzialac mobile-first.
- Sekcje musza byc rozpoznawalne bez nadmiaru tekstu.

