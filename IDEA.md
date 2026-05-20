> Zusammenfassung
> MVP KraftKurve: eine lokal-first, self-hosted PWA fürs Fitnessstudio-Tracking (Training + Protein-Tracking), multi-user-fähig, als Open-Source-Basis für einen späteren Service mit Preismodell.

# 1. Zielbild MVP (Funktionsumfang)

## 1.1 Kern-Ziele
- Trainings im Studio schnell loggen
- Fortschritt bei Kraftübungen visualisieren
- Tägliche Proteinaufnahme protokollieren
- Mehrere Nutzer auf einer Instanz verwalten
- Offline nutzbar, Daten primär lokal vorhalten, sobald Gerät wieder online wird auf einen eigenen Server gesynced

## 1.2 Wichtige User-Rollen
- Endnutzer: trackt Training und Protein, nutzt PWA auf dem Handy.
- Instanz-Admin (für self-hosted, z. B. du oder Studio): richtet Server/Domain ein, verwaltet Nutzer.

# 2. Features im MVP

## 2.1 Trainingstracking (KraftKurve-Kern)

### User Stories

- Ich wähle mein heutiges Workout (z. B. Push-Tag) und logge Sätze, Wiederholungen, Gewicht.
- Ich sehe für jede Übung, was ich beim letzten Mal gemacht habe.
- Ich sehe eine einfache Grafik, wie sich mein Gewicht oder Volumen bei einer Übung entwickelt.

### MVP-Features

- Übungskatalog mit Basis-Attributen: Name, Kategorie, Muskelgruppe, optional Gerätetyp.
- Trainingssession anlegen: Datum, optional Studio, Notiz.
- Pro Session: Liste von Übungen, pro Übung mehrere Sätze mit Wiederholungen und Gewicht.
- Ansicht “Letztes Mal”: Vorschlag der letzten Werte für dieselbe Übung.
- Simple Progress-Ansichten:
  - pro Übung: Verlauf der Bestleistung (z. B. höchstes Arbeitsgewicht)
  - pro Woche: Trainingsanzahl.

## 2.2 Ernährungsprotokoll (Fokus Protein)

### User Stories

- Ich gebe meine Mahlzeiten ein und sehe, wie viel Protein ich heute schon habe.
- Ich habe ein Tagesziel für Protein und sehe, wie nah ich dran bin.

### MVP-Features

- Tagesübersicht Ernährung: Datum, Liste von Einträgen.
- Eintragstypen: “Lebensmittel / Mahlzeit” mit Name, geschätzte Portion, Proteinmenge.
- Einfacher manuell gepflegter “Favoriten”-Katalog:
  - z. B. Hähnchenbrust, Magerquark, Whey-Shake, mit vordefinierter Proteinmenge pro Portion.
- Tagesziel Protein in Gramm pro Nutzer (einstellbar).
- Visualisierung: Fortschrittsbalken “heute aufgenommene Proteine / Tagesziel”.

## 2.3 Multi-User & Authentifizierung

### MVP-Features

- Nutzerregistrierung (optional: durch Admin oder Self-Signup).
- Login mit E-Mail und Passwort.
- Pro Nutzer: eigene Daten (Trainings, Ernährung, Ziele).
- Instanz-Admin-Rolle mit:
  - Nutzerliste anzeigen
  - Nutzer aktivieren/deaktivieren

## 2.4 PWA & lokal-first

### MVP-Features

- PWA:
    - Installierbar auf Homescreen.
- Offline-fähig:
- Trainings und Ernährungseinträge können offline erstellt/geändert werden.
- Lokale Datenspeicherung (z. B. IndexedDB / lokal verschlüsselte Datenbank):
- App arbeitet immer auf einem lokalen Daten-Cache.
- Sync-Mechanismus:
  - Hintergrundsync, wenn Internet verfügbar ist.
  - Konfliktstrategie im MVP: “Last write wins” pro Eintrag.

# 3. Seiten & Flows (UI-Struktur)

## 3.1 Hauptansichten

### Dashboard

- Heute: nächstes geplantes Training oder “Neues Training starten”.
- Heutige Proteinaufnahme und Fortschrittsbalken zum Tagesziel.
- Kurze Übersicht der letzten Trainings (Liste).

### Training

- Liste der vergangenen Trainings (Datum, Dauer, Anzahl Übungen).
- Detailansicht eines Trainings.
- “Neues Training”:
  - Auswahl aus Templates (Push/ Pull / Beine / Ganzkörper) oder “Leeres Training”.
  - Übungen hinzufügen (Suche / Favoriten).
  - Sätze mit Wiederholungen, Gewicht (UI: große +/- Buttons).

### Ernährung

- Kalendertage mit Proteinbalken.
- Tagesdetail: Liste Mahlzeiten, Summe Protein.
- “Neue Mahlzeit”:
  - Auswahl aus Favoriten oder “Custom”.

### Fortschritt

- Pro Übung: Verlauf Bestleistung und/oder Volumen.
- Wochenübersicht: Anzahl Trainings.
- Proteinverlauf: durchschnittliche tägliche Aufnahme gegenüber Ziel.

### Profil / Einstellungen

- Körperdaten (Gewicht optional, nur für Nutzer selbst).
- Protein-Tagesziel.
- Sprache, Theme (optional).
- Admin (nur Instanz-Admin)

### Nutzerübersicht.
- Einfache Einstellungen für Instanz (Name, Logo, Registrierung offen/geschlossen).

# 4. Datenmodell (grob konzeptionell)

- User
- TrainingSession
- TrainingExercise (Übungsauswahl innerhalb einer Session)
- TrainingSet (Satz mit Wiederholungen und Gewicht)
- Exercise (Stammdaten Übung)
- NutritionDay (Datum, Nutzer, Summen)
- NutritionEntry (Mahlzeit / Lebensmittel)
- FoodItem (Favorit, z. B. Magerquark: Protein pro Portion)
- Wichtig: Alle Entitäten eindeutig einem Nutzer zugeordnet (außer globalen Exercise-Definitionen, FoodItem-Vorlagen, die optional auch nutzerbezogen sein können).

# 5. Architektur-Ansatz für lokal-first & Self-Hosted

- Frontend: PWA (z. B. React, Vue, Svelte – was dir liegt)
- Speicher lokal: IndexedDB oder lokal verschlüsselte Datenbank plus Service Worker für Offline.
- Backend:
  - API (z. B. REST oder GraphQL) auf einem self-hosted Server (Docker-fähig).
  - Datenbank (TODO: file based with "*.ndjson" files for alle public definition files and separated ones for user related data to split problems with read/write access OR using a database like PostgreSQL, document based, ...)
- Sync-Modell:
  - Jede Entität mit UUID und Zeitstempeln.
  - Client hält “last synced at” pro Nutzer.
  - Periodische Sync-Requests: Änderungen seit letztem Sync senden/holen.
  - Für intensiven Code empfehle ich parallel GitHub Copilot zu nutzen, das bei Setup von Klassen, Endpoints und DB-Schemata enorm hilft (interne Infos: https://zeiss.atlassian.net/wiki/spaces/DevelopmentPlatforms/pages/97910873/GitHub+Copilot).

# 6. Open Source + Service mit Pricing

## Open Source Kern

- Code unter einer Lizenz, die auch ein kommerzielles Angebot erlaubt (z. B. MIT, Apache-2).
- Service-Idee (später)
  - Gehostete Instanzen für Studios oder Einzelpersonen:
  - kostenlose kleine Instanz (ein Nutzer, begrenzter Speicher)
  - bezahlte Instanz mit mehreren Nutzern, Backups, Updates, Support.
  - MVP-seitig genügt:
    - Self-hosted Deployment via Docker Compose.
    - Minimal-Dokumentation, wie man eine Instanz aufsetzt.