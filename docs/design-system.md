# Design System

Źródło: audit referencji z `src/assets/julia-portrait.png` oraz `src/assets/oliwia-portrait.png`.

## Założenia

- Mobile-first.
- Layout ma być czysty, kartowy i czytelny.
- Grafiki referencyjne służą wyłącznie jako wzorzec layoutu, nie jako tła.
- UI ma wyglądać jak dopracowany produkt rodzinny, nie jak panel administracyjny.

## Paleta kolorów

### Bazowe

- `page`: `#f3fbf7` - spokojne, bardzo jasne tło.
- `surface`: `#ffffff` - główne karty i panele.
- `ink`: `#123020` - główny tekst i mocne CTA.
- `muted`: `#5b7169` - tekst drugiego poziomu.
- `border`: `rgba(18, 48, 32, 0.08)` - cienkie, miękkie obramowania.
- `shadow`: `0 20px 50px rgba(29, 76, 56, 0.12)` - delikatne cienie.

### Akcenty

- `mint`: `#3ccf91`
- `mintSoft`: `#e7faf1`
- `sky`: `#59b7ff`
- `skySoft`: `#eaf5ff`
- `sun`: `#ffd45e`
- `sunSoft`: `#fff6d9`
- `coral`: `#ff8d7a`
- `coralSoft`: `#fff0eb`

### Dzieci

- Julia: chłodny mint / teal z lekkim ciepłym akcentem.
- Oliwia: bardziej słoneczny / błękitny kontrast z ciepłym żółtym.
- Kolory dziecka mają różnicować widoki, ale nie dominować nad czytelnością.

## Typografia

- Nagłówki: `Fredoka`.
- Tekst UI: `Nunito Sans`.
- H1 / hero: duży, krótki, bez długich zdań.
- Karty statystyk: mały label, mocna liczba.
- Przyciski i badge: gruby krój, małe litery lub uppercase tam, gdzie wymaga tego referencja.

## Spacing

- Bazowy rytm: `4px`.
- Główne odstępy między sekcjami: `16-20px`.
- Padding kart: `16-20px`, na desktopie `20-24px`.
- Prominentne hero / panel główny: `24-32px` radius i większy wewnętrzny oddech.

## Border radius

- Karty główne: `28-34px`.
- Mniejsze panele i chips: `18-24px`.
- Badges i pigułki: `9999px`.

## Cienie i obwódki

- Karty używają cienkiej obwódki i miękkiego cienia.
- Shadow ma być raczej produktowy niż dramatyczny.
- Nie stosować ciężkich ramek do każdej sekcji.

## Komponenty

### App shell

- Górny pasek z marką po lewej.
- Desktopowa nawigacja w prawej części topbara.
- Mobile bottom navigation z czterema głównymi widokami.

### Dashboard rodzinny

- Dwie duże karty dzieci.
- Każda karta ma:
  - nazwę dziecka
  - saldo skarbonki
  - liczbę aktywnych zadań
  - plusy
  - minusy
  - CTA do wejścia do tablicy
  - małą sekcję ostatnich wpływów
  - małą sekcję osiągnięć

### Panele dziecka

- Hero z nazwą dziecka, krótkim opisem i trzema głównymi akcjami.
- Sekcje:
  - saldo / wzrost skarbonki
  - statystyki
  - szybkie akcje plus / minus
  - zadania aktywne
  - zadania wykonane
  - historia wpływów
  - osiągnięcia
  - panel boczny z szybkim bilansem

### Skarbonka

- Wyraźnie widoczny balance card.
- Historia wpływów w formie krótkich wierszy lub kart.
- Po naliczeniu nagrody ma pojawić się lekka animacja / flash.

### Plusy i minusy

- Gotowe presety w formie dużych chipów lub buttons.
- Jedno kliknięcie ma wystarczyć do rozpoczęcia akcji.
- Plusy i minusy powinny być wizualnie przeciwstawne, ale spójne.

### Zadania

- Status chips:
  - `Do wykonania`
  - `W trakcie`
  - `Wykonane`
- Każda karta zadania pokazuje:
  - nazwę
  - opis
  - kwotę
  - datę utworzenia
  - częstotliwość
  - akcje: wykonaj / przywróć / kopiuj / edytuj / usuń

### Osiągnięcia

- Małe, zrozumiałe karty z progiem i statusem.
- Widoczny stan odblokowania lub blokady.

### Formularze rodzica

- Modal dodawania zadania
- Modal potwierdzenia hasłem `Mama` / `Tata`
- Pola mają być duże i wygodne na mobile.

## Mobile-first

- Najpierw projekt dla 390px szerokości.
- Na mobile:
  - topbar ma być lekki
  - dashboard powinien stackować karty dzieci
  - board ma mieć pojedynczy, pełny flow
  - nawigacja ma być w dolnym pasku

## Wzorzec implementacyjny

- Layout i komponenty muszą wynikać z kodu, nie z obrazków.
- Grafiki dzieci mogą pojawiać się tylko jako ilustracyjne avatary, nigdy jako pełnoekranowe tła lub pseudo-dashboardy.
- Wszystkie sekcje muszą zachować czytelny hierarchiczny układ i własne panele.
