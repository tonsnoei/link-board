# LinkBoard

Een Symbaloo-achtige link manager: tegels met links, georganiseerd in tabbladen.
Statisch (HTML/CSS/JS, geen build-stap, geen framework), met een dun stukje
Python-server (`server.py`) die naast bestanden serveren ook favicons oplost
zoals een browser dat zou doen.

## Starten

```bash
./start.sh          # start op poort 8000 en opent de browser
./start.sh 9000      # optioneel: ander poortnummer
```

Of handmatig:

```bash
python3 server.py 8000
```

en open daarna `http://localhost:8000`.

## Functionaliteit

- **Tabbladen + grid van tegels**, zoals Symbaloo. Tegels en tabbladen zijn te
  verslepen (ook tegels tussen tabbladen).
- Tegel bewerken: naam, URL, kleur en icoon. Icoon-opties per tegel:
  - automatisch favicon van de site,
  - kiezen uit een ingebouwde iconenset (Tabler Icons),
  - of een eigen afbeelding uploaden.
- Zoekbalk bovenaan filtert de tegels van het actieve tabblad op naam.
- Licht/donker thema-knop.

## Opslag

Alle data (tabbladen, tegels, instellingen) wordt lokaal opgeslagen in de
**IndexedDB** van de browser. Er is geen server-side opslag; alles blijft op
je eigen apparaat totdat je expliciet exporteert.

## Export / import

- **Exporteren** slaat alle tabbladen en tegels op als JSON-bestand.
- **Importeren** vervangt de volledige huidige inhoud door die van het
  gekozen bestand (met een bevestigingsvraag vooraf).

### Automatisch opslaan naar bestand (alleen Chrome/Edge)

Bij het **exporteren** in een Chromium-browser (Chrome, Edge) kun je via de
bestandskiezer een locatie kiezen met de File System Access API. Vanaf dat
moment wordt elke wijziging (nieuwe tegel, verplaatsing, etc.) automatisch
naar datzelfde bestand weggeschreven — naast de opslag in IndexedDB. Onderaan
rechts zie je de synchronisatiestatus; na een paginaherlaad kan de browser om
hernieuwde toestemming vragen (klik op de statusbalk).

Deze functie is niet beschikbaar in Firefox/Safari: daar blijft alleen de
handmatige export (downloaden) werken.

## Iconen uitbreiden

Dit project bevat een curated subset (~260) van de [Tabler Icons](https://github.com/tabler/tabler-icons)
set (MIT-licentie) in `icons/*.svg`, met een `icons/manifest.json` die door de
iconenkiezer in de app wordt gebruikt.

Wil je meer iconen beschikbaar maken? Gebruik het meegeleverde Python-script
(vereist alleen een internetverbinding, geen dependencies):

```bash
# specifieke iconen toevoegen (namen zoals in de Tabler-icons repo, zonder .svg)
python3 tools/download_icons.py rocket umbrella cat

# iconen uit een tekstbestand (één naam per regel)
python3 tools/download_icons.py --names-file mijn-iconen.txt

# de VOLLEDIGE Tabler outline-set downloaden (~5900 iconen, kan even duren)
python3 tools/download_icons.py --all
```

Het script downloadt ontbrekende SVG's naar `icons/` en herschrijft daarna
automatisch `icons/manifest.json` op basis van wat er in die map staat.

## Projectstructuur

```
index.html            Paginaskelet (header, tabs, grid, modals)
css/                   base, layout, tiles, modal, theme — los per concern
js/
  db.js                IndexedDB-wrapper (generieke CRUD)
  state.js             In-memory state + persistente CRUD-acties
  render.js             Tekent tabbladen en tegel-grid
  tabs.js / tile.js      Modal-logica voor tabblad- en tegelbeheer
  iconPicker.js          Iconenkiezer-modal (leest icons/manifest.json)
  dnd.js                  Drag & drop voor tegels en tabbladen
  search.js               Zoekbalk-filter
  exportFormat.js          Export/import-JSON-formaat
  exportImport.js           Export- en import-knoppen
  fileSync.js               Automatisch opslaan via File System Access API
  theme.js                   Licht/donker thema
  confirm.js                  Generieke bevestigingsmodal
  utils.js                     Kleine helpers (id's, debounce, favicon-url)
icons/                 SVG-iconen + manifest.json
tools/download_icons.py  Los te draaien script om iconen te (her)downloaden
start.sh                Start de Python webserver en opent de browser
```

## Browserondersteuning

Werkt in elke moderne browser (Chrome, Edge, Firefox, Safari) voor de
kernfunctionaliteit. Automatisch opslaan naar bestand vereist de File System
Access API en werkt daarom alleen in Chromium-browsers.
