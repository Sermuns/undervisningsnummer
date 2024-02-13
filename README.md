# Undervisningsnummer

Webbapplikation för att se antalet föreläsningar, lektioner, etc som har passerat i en kurs på Linköping universitet.

## Exempel på användning

Jag läser kursen Datorkonstruktion, TSEA83, och vill veta hur många föreläsningar jag har missat. Jag går till [un.samake.se](https://un.samake.se) och skriver in kurskoden TSEA83. Jag ser att den senaste föreläsningen var föreläsning 9, och nästa föreläsning är på onsdag.

![skärmdump på exempelanvändning](./media/screenshot.png)

## Teknisk information

Hemsidans design är rent HTML och CSS. Funktionaliteten i hemsidan åstadkomms genom en kombination av backend-skript på [Lysator](https://www.lysator.liu.se)s server, och frontend-skript i JavaScript. Backend-skriptet ```fetch_object_id.py``` omvandlar en fritextsökning på kurskod till deras proprietära "object-id"-format från [TimeEdit](https://cloud.timeedit.net/liu/web/schema/ri1Q7.html). Frontend-skriptet använder sig av detta object-id för att hämta schemainformation från TimeEdit, och räkna ut hur många föreläsningar som har passerat.

## För att köra lokalt

1. Klona detta repository
2. Starta skriptet ```run_local_server.py```, vilket startar en lokal server på port 3000.
3. Gå till [localhost:3000](http://localhost:3000) i din webbläsare för att se hemsidan.

> Skapa gärna en pull request om du vill förbättra hemsidan!