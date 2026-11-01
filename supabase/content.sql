-- =====================================================================
-- NOIR FASHION — starting text for the information pages (Dutch).
-- Run AFTER schema.sql. Every page can be edited later in the admin
-- dashboard (Instellingen → Pagina's). Text in [IN TE VULLEN: ...] is a
-- placeholder: it is highlighted on the website until you replace it.
-- Existing pages are never overwritten when you re-run this file.
-- =====================================================================

insert into public.content_pages (slug, title, body) values
('over-ons', 'Over NOIR FASHION', $txt$
NOIR FASHION is een zorgvuldig samengestelde webshop voor luxe mode, designerkleding en premium streetwear.

## Wat wij doen
Wij selecteren items van gevestigde luxe-, designer- en streetwearmerken. NOIR FASHION is geen eigen kledinglijn: wij verkopen producten van bestaande modemerken.

Wij zijn geen officiële verkoper, dealer of partner van de merken die wij aanbieden. Merknamen worden uitsluitend gebruikt om aan te geven om welk product het gaat.

## Onze werkwijze
Bij elk item vermelden wij eerlijk de staat waarin het verkeert: nieuw met labels, nieuw zonder labels, of tweedehands in uitstekende of goede staat.

Je betaalt niet via de website. Na het plaatsen van je bestelling nemen wij persoonlijk contact met je op om de bestelling te bevestigen en de betaling en levering of afhaling af te spreken.

## Ons verhaal
[IN TE VULLEN: vertel hier in een paar zinnen wie er achter NOIR FASHION zit en waarom je bent begonnen.]
$txt$),

('verzending', 'Verzending & afhalen', $txt$
Na het plaatsen van je bestelling nemen wij persoonlijk contact met je op om de betaling en de levering of afhaling te bespreken.

## Hoe het werkt
- Je plaatst je bestelling via de website. Je betaalt nog niets.
- Wij nemen contact met je op via telefoon, WhatsApp, Snapchat of e-mail.
- Samen spreken we af of je het item laat verzenden of komt afhalen.
- Eventuele verzendkosten bespreken wij vooraf persoonlijk met je. Er worden geen kosten automatisch toegevoegd.

## Verzenden
[IN TE VULLEN: met welke vervoerder je verzendt, naar welke landen, en wat de verzendkosten zijn.]

## Afhalen
[IN TE VULLEN: of afhalen mogelijk is en in welke plaats of regio. Vermeld geen privéadres op de website.]

## Levertijd
Wij doen geen toezeggingen over een vaste leverdatum. De verwachte levertijd stemmen wij persoonlijk met je af.
$txt$),

('retourneren', 'Retourneren', $txt$
[IN TE VULLEN — LAAT DIT CONTROLEREN: de retourvoorwaarden hieronder zijn een opzet en geen juridisch advies. Laat ze controleren voordat de webshop live gaat.]

## Jouw rechten
Bij aankopen op afstand heb je als consument volgens Nederlands en Europees recht in veel gevallen een herroepingsrecht van 14 dagen na ontvangst. Of en hoe dit van toepassing is, hangt onder meer af van de status van de verkoper. Wettelijke rechten die op jouw aankoop van toepassing zijn, worden door deze voorwaarden nooit beperkt.

## Retour aanmelden
Neem binnen [IN TE VULLEN: termijn] contact met ons op via de contactpagina en vermeld je bestelnummer.

## Voorwaarden
- [IN TE VULLEN: in welke staat een item retour moet komen, bijvoorbeeld ongedragen en met originele labels.]
- [IN TE VULLEN: wie de retourkosten betaalt.]

## Terugbetaling
[IN TE VULLEN: hoe en binnen welke termijn het aankoopbedrag wordt terugbetaald, bijvoorbeeld via Tikkie of contant.]
$txt$),

('privacy', 'Privacybeleid', $txt$
[IN TE VULLEN — LAAT DIT CONTROLEREN: dit privacybeleid is een opzet en garandeert niet dat aan de AVG (GDPR) wordt voldaan. Laat het controleren en vul de ontbrekende gegevens aan.]

## Wie is verantwoordelijk
NOIR FASHION, bereikbaar via [IN TE VULLEN: e-mailadres voor privacyvragen].

## Welke gegevens wij verwerken
Als je een bestelling plaatst, verwerken wij:
- je volledige naam en telefoonnummer (verplicht);
- je Snapchat-gebruikersnaam en e-mailadres (alleen als je die zelf invult);
- eventuele opmerkingen bij je bestelling;
- de producten, maten, aantallen en prijzen van je bestelling.

## Waarvoor wij ze gebruiken
Uitsluitend om contact met je op te nemen over je bestelling, de betaling en de levering of afhaling af te spreken en onze administratie bij te houden.

## Bewaartermijn
[IN TE VULLEN: hoe lang je bestelgegevens worden bewaard.]

## Delen met derden
Wij verkopen je gegevens niet. Voor het hosten van de website en de database gebruiken wij dienstverleners (Vercel en Supabase). [IN TE VULLEN: overige partijen, bijvoorbeeld een e-maildienst.]

## Cookies
De webshop slaat je winkelwagen op in je eigen browser (lokale opslag). Er worden geen tracking- of advertentiecookies gebruikt. [IN TE VULLEN: aanpassen als je later analytics toevoegt.]

## Jouw rechten
Je hebt het recht om je gegevens in te zien, te laten corrigeren of te laten verwijderen. Neem hiervoor contact met ons op. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.
$txt$),

('algemene-voorwaarden', 'Algemene voorwaarden', $txt$
[IN TE VULLEN — LAAT DIT CONTROLEREN: deze voorwaarden zijn een opzet en geen juridisch advies. Laat ze controleren voordat de webshop live gaat.]

## 1. Over NOIR FASHION
NOIR FASHION is de naam van deze webshop. NOIR FASHION is geen officiële verkoper of partner van de merken die worden aangeboden.

## 2. Bestellen
Een bestelling via de website is een verzoek tot aankoop. De bestelling is pas definitief nadat wij persoonlijk contact met je hebben opgenomen en de bestelling hebben bevestigd.

## 3. Prijzen
Alle prijzen zijn in euro's. Verzendkosten worden niet automatisch berekend; deze worden vooraf persoonlijk met je besproken.

## 4. Betalen
Betaling verloopt niet via de website. Na bevestiging spreken wij de betaling met je af via Tikkie of contant.

## 5. Levering en afhalen
Levering of afhaling wordt persoonlijk met je afgesproken. Zie de pagina Verzending & afhalen.

## 6. Staat van producten
Bij elk product vermelden wij de staat zo nauwkeurig mogelijk. [IN TE VULLEN: aanvullende afspraken.]

## 7. Retourneren
Zie de pagina Retourneren. Wettelijke rechten van consumenten blijven altijd van toepassing.

## 8. Contact en klachten
[IN TE VULLEN: hoe klanten een klacht kunnen indienen en binnen welke termijn je reageert.]
$txt$),

('maattabel', 'Maattabel', $txt$
Merken hanteren elk hun eigen pasvorm. Bij ieder product vermelden wij de maat zoals die op het label staat. Twijfel je? Neem gerust contact met ons op, dan meten wij het item voor je op.

## Algemene indicatie bovenkleding (cm)
- XS — borstomtrek 82–88
- S — borstomtrek 88–94
- M — borstomtrek 94–100
- L — borstomtrek 100–106
- XL — borstomtrek 106–112
- XXL — borstomtrek 112–118

Dit is een algemene indicatie en geen officiële maattabel van een merk. Oversized modellen, zoals veel items van Fear of God Essentials, vallen bewust ruimer.

## Tips
- Vergelijk de opgegeven maat met een vergelijkbaar kledingstuk dat je goed past.
- Vraag ons gerust om exacte afmetingen, zoals borstbreedte en lengte.
$txt$),

('authenticiteit', 'Authenticiteit', $txt$
[IN TE VULLEN — LAAT DIT CONTROLEREN: beschrijf hier alleen wat je daadwerkelijk doet. Beloof niets wat je niet kunt waarmaken.]

## Onze aanpak
[IN TE VULLEN: hoe je items inkoopt en controleert, bijvoorbeeld controle van labels, stiksels, materialen en aankoopbewijzen.]

## Geen officiële verkoper
NOIR FASHION is geen officiële verkoper of partner van de merken die wij aanbieden. Merknamen worden uitsluitend gebruikt om het product te beschrijven.

## Vragen over een item
Wil je extra foto's of informatie over een specifiek item voordat je bestelt? Neem contact met ons op via de contactpagina.
$txt$),

('veelgestelde-vragen', 'Veelgestelde vragen', $txt$
### Hoe plaats ik een bestelling?
Voeg je items toe aan je winkelwagen en klik op Bestelling plaatsen. Vul je naam en telefoonnummer in en verstuur je bestelling. Je betaalt nog niets via de website.

### Hoe betaal ik?
Na je bestelling nemen wij persoonlijk contact met je op. De betaling spreken we samen af via Tikkie of contant.

### Is mijn bestelling direct definitief?
Nee. Je bestelling is ontvangen, maar nog niet betaald en nog niet definitief bevestigd. Wij nemen contact met je op om de bestelling te bevestigen.

### Heb ik Snapchat nodig om te bestellen?
Nee. Alleen je naam en telefoonnummer zijn verplicht. Snapchat en e-mail zijn optioneel.

### Hoe wordt mijn bestelling geleverd?
Levering of afhaling spreken wij persoonlijk met je af. Eventuele verzendkosten bespreken wij vooraf met je.

### Zijn de producten nieuw?
Bij ieder product staat de staat vermeld: nieuw met labels, nieuw zonder labels, of tweedehands in uitstekende of goede staat.

### Zijn jullie een officiële verkoper van deze merken?
Nee. NOIR FASHION is een zelfstandige webshop en geen officiële verkoper of partner van de aangeboden merken.

### Kan ik een item retourneren?
Lees de pagina Retourneren voor de voorwaarden. Je wettelijke rechten als consument blijven altijd van toepassing.
$txt$)
on conflict (slug) do nothing;
