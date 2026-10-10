# Prva smena – evidencija točenja goriva

Mobilna aplikacija za evidentičara na pumpi: beleži koje je vozilo, kada, na kom točionom mestu (1–8) i koliko litara sipalo, a beleži i dnevne totalizatore.
Radi i bez interneta. Pravi PDF izveštaje (dnevne, nedeljne, za izabrani period i po obrascu QF-E-003) koji se mogu sačuvati i podeliti.

## Za koga je
- **Evidentičar u smeni** (Puzović Ivica): unosi dolaske vozila na telefonu, brzo traži vozila i pravi izveštaje.
- **Administrator / rukovodilac**: pomoću lozinke ulazi u admin panel i pregleda sve izveštaje, i sa drugog uređaja.

## Glavne funkcije i iskustvo

### 1. Početna – „Prva smena“ (unos vozila)
- Gornji deo sa fotografijom radnog mesta i naslovom „Prva smena“.
- Izbor datuma sa strelicama ◀ ▶ i oznakom „Danas“. Svi ekrani prate izabrani datum.
- Brojač „DOŠLO“ prikazuje koliko je vozila stiglo tog dana.
- Kartica „Unesi vozilo“ ima:
  - polje za garažni broj (npr. 7000),
  - dugmad za mesto sipanja 1–8,
  - polje za litre (npr. 23,45),
  - vreme dolaska, koje se upisuje samo, a može se i ručno promeniti,
  - polje za napomenu (nije obavezno),
  - dugme „Sačuvaj dolazak“.
- Kada se unese garažni broj koji nije na spisku, vozilo se samo dodaje na spisak, na mesto koje mu pripada po redosledu brojeva.
- Na dnu stranice nalaze se **Totalizatori 1–8**: početno i završno stanje za svako točiono mesto. Aplikacija sama računa razliku i ukupnu razliku. Dugme „Sačuvaj totalizatore“ odmah pamti unos za taj dan.
- Na samom dnu stoji potpis: „Aplikaciju dizajnirao i uradio EVIDENTIČAR Puzović Ivica“.

### 2. Vozila (pregled i pretraga)
- Pretraga po garažnom broju. Rezultat prikazuje sva točenja tog vozila: datum, vreme, mesto sipanja i litre.
- Spisak svih vozila, poređan po garažnom broju. Početni spisak se preuzima iz priloženog Excel fajla.
- Dugme „+ Dodaj vozilo“ dodaje novo vozilo na pravo mesto u spisku.
- Pogrešan unos točenja može se izmeniti ili obrisati.

### 3. Izveštaj
- **Stigli – redom po vremenu (N)**: vozila koja su stigla izabranog dana, poslednje sipano je na vrhu, a u zagradi stoji ukupan broj.
- **Statistika mesta sipanja**: broj vozila po svakoj pumpi 1–8, sa grafikonom i označenom najkorišćenijom pumpom.
- **Nedeljni pregled** (ponedeljak–nedelja, za nedelju izabranog datuma): ukupno vozila, najprometniji dani (npr. „21.09.2026. – 5 sipanih vozila“), dugmad „Nedeljni PDF“ i „Podeli“.
- **Grafikon po danima (14 dana)**: broj vozila po danu.
- **Izvezi izveštaj za period** (Od – Do): PDF sa datumima, ukupnim brojem vozila, tabelom „Stigli po vremenu“ (redni broj, garažni broj, vreme, mesto sipanja, napomena) i statistikom mesta sipanja sa najkorišćenijom pumpom. Dugmad su „Izvezi izveštaj“ i „Podeli“.
- **Detaljni izveštaj – obrazac QF-E-003**: PDF koji što vernije prati Excel listu „Lista točenja goriva – Novi Beograd“:
  - zaglavlje sa datumom i smenom,
  - totalizatori 1–8 (početno stanje, razlika, završno stanje i ukupna razlika),
  - tabela EVRODIZEL sa kolonama G.br., točena količina i vreme točenja, popunjena za svako vozilo koje je točilo,
  - mesta za potpis na dnu: „Evidentičar Puzović Ivica“ i prazno polje „Radnik Knez Petrol-a“.
  - Kvačica „Uključi potpis na kraju izveštaja“ određuje da li će potpis biti u PDF-u. Aplikacija pamti izbor.

### 4. Admin panel
- Ulaz lozinkom **puzopb**.
- Pregled svih dana i svih izveštaja sa svih uređaja (podaci stižu kada uređaj ima internet). Svaki izveštaj se može preuzeti kao PDF i podeliti.

### Rad bez interneta i deljenje
- Aplikacija se instalira na telefon sa početnog ekrana i radi bez interneta: unos, pretraga, izveštaji i PDF-ovi.
- Kada se internet vrati, podaci se sami šalju na server. Na ekranu se vidi stanje: „Sačuvano na uređaju“ ili „Sinhronizovano“.
- „Podeli“ otvara sistemski meni telefona (Viber, WhatsApp, e-mail…) sa PDF fajlom.

## Tok korišćenja
1. Evidentičar otvori aplikaciju. Datum je današnji, a na početku smene unese i sačuva totalizatore.
2. Kada vozilo stigne, unese garažni broj, izabere mesto 1–8, upiše litre i sačuva. Vreme se upisuje samo.
3. Kada treba proveriti neko vozilo, otvori „Vozila“ i ukuca garažni broj.
4. Na kraju smene otvori „Izveštaj“, napravi PDF po obrascu QF-E-003 (sa potpisom ili bez njega) i podeli ga.
5. Rukovodilac ulazi u admin panel lozinkom i pregleda izveštaje.

## UI/UX utisak
- Prati priložene skice: beo osnovni ekran, crveni okviri i strelice za datum, narandžasto-žute kartice za unos i brojač, crveno dugme „+ Dodaj vozilo“, plava dugmad za PDF i deljenje.
- Krupni, uski i snažni naslovi (VOZILA, Izveštaj, Prva smena) i veliki brojevi za datum. Sve je prilagođeno radu jednom rukom na telefonu.
- Velika dugmad za izbor pumpe 1–8 i brojevna tastatura za garažni broj i litre.
- Donja navigacija ima tri kartice: Smena, Vozila, Izveštaj. Admin panel se otvara iz posebnog ulaza.
- Ceo interfejs je na srpskom jeziku (latinica).

## Faze izrade
**Faza 1 – MVP (radi se sada)**
- Ekrani: Prva smena (unos vozila + totalizatori), Vozila (pretraga, spisak, dodavanje), Izveštaj (svi delovi opisani iznad).
- Svi PDF izveštaji: nedeljni, za period i detaljni QF-E-003 sa kvačicom za potpis. Deljenje preko telefona.
- Rad bez interneta i automatsko slanje na server kada se internet vrati.
- Admin panel sa lozinkom „puzopb“.
- Početni spisak vozila iz Excel fajla.

**Faza 2**
- Izvoz u Excel (.xlsx) u istom obrascu QF-E-003.
- Druga i treća smena: izbor smene i odvojeni izveštaji.
- Kolone „Ispravnost“ i „Kartice“ iz Excel obrasca.

**Faza 3**
- Desktop verzija za računar (Electron) sa ažuriranjem preko GitHub-a.
- Više korisnika (evidentičara) sa posebnim nalozima.
- Automatsko slanje dnevnog izveštaja e-mailom.

## Pretpostavke
- Telefonska verzija se pravi kao web aplikacija koja se instalira na telefon i radi bez interneta. Ona se ažurira sama čim ima internet, pa u fazi 1 ne treba ažuriranje preko GitHub-a. Electron desktop verzija prebačena je u fazu 3.
- Jedno točenje beleži: garažni broj, mesto sipanja (1–8), litre, vreme i napomenu (nije obavezna).
- Totalizatori se unose jednom dnevno (početno i završno stanje po pumpi), a mogu se ispraviti i ponovo sačuvati.
- Gorivo je samo EVRODIZEL, kao u Excel obrascu.
- Zaglavlje obrasca je fiksno: „QF-E-003, Lista točenja goriva – Novi Beograd, SP Novi Beograd“. Smena je „Prva smena“, do 15h.
- Izveštaj „Stigli po vremenu“ prikazuje ukupan broj vozila u zagradi, kao na skici („Stigli – redom po vremenu (4)“).
- Nedelja traje od ponedeljka do nedelje.
- Lozinka za admin panel je „puzopb“. Ista je za sve i nema korisničkih naloga.
- Svi uređaji šalju podatke u istu zajedničku bazu.
- Spisak vozila se uvozi jednom iz priloženog Excel fajla. Posle toga se dopunjuje pri unosu ili ručno.
- Fotografija na početnoj je ona sa skice (radno mesto sa računarom). Ako nije dostupna u dobrom kvalitetu, koristi se slična fotografija.
- Interfejs je na srpskom, latinicom. PDF-ovi su takođe na latinici.
