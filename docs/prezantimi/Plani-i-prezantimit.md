# Plani i prezantimit: DMA Kçiq

**Hackathoni UPF i KRU "Mitrovica", 13–14 nëntor 2026**
**Kohëzgjatja:** 6 minuta prezantim, 90 sekonda demo live dhe pastaj pyetjet.
**Gjuha:** shqip.

Prezantimi është në Google Slides. Shënimet e folësit janë te çdo slajd, në pjesën "Speaker notes".

## Qëllimi

Juria duhet të dalë me tri gjëra në mendje:

1. **Ku humbet uji.** Në Kçiq humbet rreth dy të tretat e ujit, kryesisht nga presioni i lartë në pjesën e poshtme të fshatit.
2. **Paneli punon sot.** Është i hapur, live, punon në telefon dhe kalon në të dhënat reale të KRU-së sapo ngarkohen skedarët.
3. **Kërkesa jonë.** Pilot 6-mujor në DMA01, me paketën Standard (41 786 €) dhe tri eksporte të dhënash nga KRU.

## Struktura dhe koha

| # | Slajdi | Koha | Mesazhi kryesor |
|---|---|---|---|
| 1 | Titulli | 0:15 | Kush jemi dhe çfarë sjellim |
| 2 | Problemi | 0:40 | 64% UPF në njësinë Mitrovicë, 7,4 milion m³ në vit |
| 3 | Pse Kçiq | 0:35 | Zonë e mbyllur, 4 276 banorë, kuota nga 510 deri në 673 m |
| 4 | Paneli | 0:30 | Gjashtë mjete në një vend |
| | **Demo live** | **1:30** | Harta, një ndërtesë, regjistrimi me kontratë |
| 5 | Bilanci i ujit | 0:30 | 65,5% UPF, ILI 5,8 |
| 6 | Rrjedha e natës | 0:30 | Alarmi gjen rrjedhjen e re pas dy netësh |
| 7 | Presioni dhe PRV | 0:40 | Një PRV kthehet për 11 muaj |
| 8 | Faturimi dhe GIS | 0:30 | 24 anomali, 18 banesa pa kontratë, regjistrim digjital |
| 9 | Të dhënat reale | 0:30 | Ngarko eksportin dhe paneli kalon në të dhëna reale |
| 10 | Plani 6-mujor | 0:35 | Faza, buxheti, objektivat |
| 11 | Kërkesa | 0:25 | Çfarë na duhet nga KRU |

Gjithsej janë rreth 7:30 me demon. Nëse koha shkurtohet në 5 minuta, hiqni slajdet 6 dhe 8 dhe shkurtoni demon në 60 sekonda.

## Skenari i demos (90 sekonda)

Hapeni panelin para se të filloni, në një skedë të dytë të shfletuesit, te faqja **Harta GIS**. Mbajeni gati edhe në telefon për pyetjet.

1. **Harta (30 s).**
   - Ngjyrosni sipas **Presioni tani** dhe tregoni pjesën e kuqe, ku presioni është mbi 7 bar.
   - Kalojeni te **Pas PRV** dhe tregoni si zhduket e kuqja.
2. **Një ndërtesë (30 s).**
   - Kërkoni `B-84` dhe tregoni panelin anësor: kuota, presioni tani dhe me PRV, konsumatorët, konsumi 12-mujor.
   - Thoni se kjo banesë nuk ka konsumator në faturim.
3. **Regjistrimi (30 s).**
   - Shtypni **Regjistro konsumator këtu**. Formulari e merr ndërtesën vetë.
   - Plotësoni emrin, nënshkruani me gisht dhe dërgoni.
   - Tregoni kontratën me numër, hash SHA-256 dhe shenjën "E verifikuar".

**Rezervë:** nëse rrjeti bie, përdorni pamjet e ekranit te `docs/screenshots/after/`. Ato janë edhe në slajdet 4 dhe 8.

## Ndarja e roleve

| Pjesa | Kush | Shënim |
|---|---|---|
| Slajdet 1–4 | Folësi kryesor | Mban kohën |
| Demo | Personi te laptopi | Klikon ndërsa folësi shpjegon |
| Slajdet 5–11 | Folësi kryesor | |
| Pyetjet | Të gjithë | Pyetjet teknike i merr ai që ka shkruar kodin |

## Pyetjet që mund të vijnë

**A janë të vërteta këto shifra?**
Kufiri, ndërtesat, kuotat, popullsia, tarifa dhe UPF-ja e njësisë janë të vërteta, nga Geoportali, OSM, EU-DEM, ASK, ARRU dhe Raporti Vjetor 2025. Rrjedhat, presionet dhe faturimi për Kçiqin janë model i kalibruar me 64%-shin e njësisë Mitrovicë. Paneli e shkruan këtë në çdo faqe. Sapo KRU ngarkon eksportet, shifrat bëhen reale.

**Çfarë të dhënash ju duhen?**
Tri skedarë:
- eksporti i faturimit (kodi, fshati, koordinatat, konsumi mujor);
- të dhënat e loggerëve ose të SCADA-s;
- rrjeti i tubave nga GIS-i, si GeoJSON.
Formatet janë te faqja "Të dhënat e KRU-së", me shabllone CSV.

**Sa kushton?**
- **Minimal:** 11 540 €, vetëm matja.
- **Standard:** 41 786 €, i rekomanduar. Përfshin matjen, gjetjen e rrjedhjeve dhe një PRV.
- **I avancuar:** 58 214 €.
Çmimet janë pa TVSH, doganë dhe transport.

**Pse PRV dhe jo vetëm riparime?**
Brezi A ka presion deri në 10,8 bar, mbi kufirin 7 bar të ARRU-së. Pa ulur presionin, rrjedhjet e riparuara kthehen. Një PRV në 3 bar kursen rreth 176 m³ në ditë dhe kthehet për rreth 11 muaj.

**A është e ligjshme kontrata digjitale?**
Teksti është model dhe duhet miratuar nga KRU dhe ARRU. Teknikisht, kontratat nuk mund të ndryshohen ose fshihen (zinxhir hash-esh, regjistër vetëm për shtim). Të dhënat personale shihen vetëm me çelësin privat të nënshkruesit, në frymën e Ligjit 06/L-082.

**A mund të zgjerohet në zona të tjera?**
Po. Zona përkufizohet nga kufiri, ndërtesat dhe sensorët e saj. E njëjta metodë vlen për çdo DMA të ardhshme të njësisë.

## Lista para prezantimit

- [ ] Paneli hapet në `http://localhost:8000` dhe treguesit live lëvizin.
- [ ] Gjuha është shqip (butoni poshtë në menynë anësore).
- [ ] Baza e të dhënave nuk ka kontrata provë të mbetura, ose ato janë të qarta për jurinë.
- [ ] Google Slides është në modalitetin "Present", me shënimet e folësit në ekranin tjetër.
- [ ] Ngarkuesi i laptopit është i lidhur dhe njoftimet janë të fikura.
