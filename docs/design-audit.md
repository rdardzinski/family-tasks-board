# Design Audit

Data audytu: 2026-06-13  
Tryb: design-led reimplementation  
Zakres: dashboard rodzinny, tablica Julii, tablica Oliwii, historia, ustawienia rodzica, modal dodawania zadania, modal potwierdzenia hasłem

## 1. Referencje UI znalezione w repo

Poniższe pliki są referencjami layoutu i hierarchii, a nie grafikami dekoracyjnymi do osadzenia w interfejsie:

- [`src/assets/julia-portrait.png`](/home/rdardzinski/workspace/repos/family-tasks-board/src/assets/julia-portrait.png) - pełny mockup dashboardu rodzinnego z desktopem i mobilem, użyty jako visual specification dla pierwszego ekranu.
- [`src/assets/oliwia-portrait.png`](/home/rdardzinski/workspace/repos/family-tasks-board/src/assets/oliwia-portrait.png) - pełny mockup tablicy dziecka, użyty jako visual specification dla widoku Julii / Oliwii.

Pliki pomocnicze, które nie są referencją layoutu:

- [`public/favicon.svg`](/home/rdardzinski/workspace/repos/family-tasks-board/public/favicon.svg) - asset aplikacji.
- [`public/icons.svg`](/home/rdardzinski/workspace/repos/family-tasks-board/public/icons.svg) - asset ikon / symboli.
- [`src/assets/hero.png`](/home/rdardzinski/workspace/repos/family-tasks-board/src/assets/hero.png) - abstrakcyjny placeholder, nie jest referencją głównego layoutu.
- [`src/assets/react.svg`](/home/rdardzinski/workspace/repos/family-tasks-board/src/assets/react.svg) i [`src/assets/vite.svg`](/home/rdardzinski/workspace/repos/family-tasks-board/src/assets/vite.svg) - pozostałości po starterze, nie powinny brać udziału w produkcji UI.

W repo nie ma osobnego katalogu ze screenshotami projektu. Jako materiał QA istnieją dodatkowe zrzuty ekranu w `reports/family-tasks-board/`, ale są to artefakty testowe, nie referencje produktowe.

## 2. Aktualne różnice między designem a implementacją

### Dashboard

- Referencja pokazuje dwa duże, samodzielne panele dzieci, z własną hierarchią, statystykami i CTA.
- Aktualna implementacja używa tych samych PNG jako dużych miniaturek/kolumn obrazkowych wewnątrz kart. To zamienia referencję layoutu w dekoracyjne tło.
- W referencji karty są czytelne jako produkt rodzinny, a nie jako kolaż z obrazkami. Obecny render jest zbyt ilustracyjny i odciąga uwagę od salda, zadań i akcji.

### Tablica dziecka

- Referencja pokazuje hero z jasnym, kodowym tłem, avatar w rogu, wyraźny bilans, duże przyciski oraz oddzielne sekcje zadań i historii.
- Aktualna implementacja znów osadza mockup referencyjny jako obraz po lewej stronie hero, zamiast odtworzyć układ w kodzie.
- Mobile w referencji ma własną hierarchię: krótszy hero, prostszy top nav, większe przyciski i listę kart. Obecna wersja zachowuje podobną strukturę, ale nadal opiera się na obrazowym pseudo-preview.

### Historia i ustawienia

- Referencje sugerują spokojne, kartowe sekcje z dużymi filtrami, krótkim tekstem i wyraźnym podsumowaniem.
- Obecna aplikacja ma już lepszą czytelność niż startowy build, ale nie jest wystarczająco wierna referencji w proporcjach i w roli obrazów.

## 3. Błędne użycie grafik jako tła / dekoracji

Najważniejszy błąd architektoniczny:

- [`src/App.tsx:957-965`](/home/rdardzinski/workspace/repos/family-tasks-board/src/App.tsx#L957) - `julia-portrait.png` jest renderowany jako duży obraz w lewej części karty dashboardu.
- [`src/App.tsx:1054-1066`](/home/rdardzinski/workspace/repos/family-tasks-board/src/App.tsx#L1054) - `oliwia-portrait.png` jest renderowany jako duży obraz w hero tablicy dziecka.

Skutek:

- Referencja layoutu staje się dekoracją.
- Layout traci kodową strukturę i wygląda jak prezentacja z wklejonymi podglądami.
- Dashboard i board nie są budowane z tych samych komponentów, które pokazuje projekt.

## 4. Komponenty do odtworzenia kodem

Poniższe elementy muszą zostać zbudowane jako React/Tailwind, a nie jako obrazki:

- globalny app shell z nagłówkiem i nawigacją
- dashboard rodzinny z dwoma kartami dzieci
- karta dziecka z balansem, liczbą zadań, plusami i minusami
- hero tablicy dziecka
- statystyki skarbonki
- sekcja szybkich akcji plus / minus
- sekcja zadań aktywnych i wykonanych
- sekcja historii wpływów / zdarzeń
- sekcja osiągnięć
- panel ustawień rodzica
- modal dodawania / edycji zadania
- modal potwierdzania hasłem Mama / Tata
- mobile bottom navigation

## 5. Wniosek audytu

Referencje UI są dobre i kompletne jako źródło layoutu, ale bieżąca implementacja używa ich niezgodnie z celem. Następny krok musi usunąć obrazkowe pseudo-dashboardy i odtworzyć cały interfejs jako kodową kompozycję komponentów.
