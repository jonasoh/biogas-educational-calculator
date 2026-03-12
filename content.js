/**
 * ============================================================
 * BIOGAS PLANT CALCULATOR — INNEHÅLLSFIL
 * ============================================================
 *
 * Det här är filen du redigerar för att ändra ekvationer, text,
 * typiska intervall och förklaringar. Du behöver INTE röra
 * app.js, style.css eller index.html för att lägga till eller
 * ändra innehåll.
 *
 * HUR DU LÄGGER TILL EN NY FLIK:
 *   Kopiera ett befintligt flikobjekt { id, title, intro, equations: [...] }
 *   och klistra in det i den översta "tabs"-arrayen.
 *
 * HUR DU LÄGGER TILL EN NY EKVATION:
 *   Kopiera ett befintligt ekvationsobjekt och klistra in det i
 *   "equations"-arrayen för den flik där du vill att det ska visas.
 *   Fyll sedan i fälten (se fältbeskrivningarna nedan).
 *
 * EKVATIONSFÄLT FÖRKLARADE:
 *   id              — ett kort unikt namn, inga mellanslag (t.ex. "ts")
 *   title           — visas som kortets rubrik
 *   intro           — stycke som visas ovanför formeln
 *   formula_latex   — formeln i KaTeX-syntax (för snygg rendering)
 *   formula_filled  — samma formel men med {param_id}-platshållare
 *                     så att appen kan visa de ifyllda värdena
 *   formula_calc    — ett enkelt matematiskt uttryck med param-id:n
 *                     t.ex.  "m_dry / m_wet * 100"
 *                     Tillåtna operatorer: + - * / ( ) ** Math.pow Math.log10
 *   result_symbol   — symbol som visas bredvid resultatet (t.ex. "TS")
 *   result_unit     — enhet som visas bredvid resultatet (t.ex. "%")
 *   result_decimals — antal decimaler att visa (standard 2)
 *   parameters      — array med inmatningsfält (se nedan)
 *   typical_range   — definierar låg/normal/hög-band och deras text
 *   educational_text — lång förklaring som visas efter resultatet
 *
 * PARAMETERFÄLT:
 *   id          — kort unikt namn som matchar formula_calc-uttrycket
 *   name        — fullt visningsnamn
 *   unit        — fysikalisk enhet som visas bredvid inmatningen
 *   description — ledtext på en rad som visas under inmatningen
 *   placeholder — exempelvärde som visas i grått när fältet är tomt
 *   min         — lägsta tillåtna värde (använd 0.001 istället för 0
 *                 för parametrar i nämnaren för att undvika division med noll)
 *   step        — stegstorlek vid pil upp/ned i inmatningsfältet
 *                 (t.ex. 1, 0.1, 0.01 — utelämna för fri inmatning)
 *   decimals    — avrunda visad siffra till N decimaler när fältet
 *                 lämnas (t.ex. 1 → "3.1", 2 → "3.14")
 *
 * TYPISKT INTERVALL:
 *   min, max    — gränserna för den "normala" zonen
 *   unit        — enhetsetikett för intervallbeskrivningen
 *   low_text    — text som visas när resultatet < min
 *   normal_text — text som visas när min ≤ resultatet ≤ max
 *   high_text   — text som visas när resultatet > max
 *   Sätt typical_range till null om ingen vägledning behövs.
 *
 * KATEX SNABBREFERENS (för formula_latex):
 *   Bråk:           \frac{a}{b}
 *   Subskript:      a_{sub}
 *   Superskript:    a^{exp}
 *   Multiplikation: \times
 *   Grekiska:       \alpha \beta \gamma \mu \rho
 *   Mellanslag:     \quad eller \;
 *   Exempel: "TS = \\frac{m_{dry}}{m_{wet}} \\times 100"
 * ============================================================
 */

const CALCULATOR_CONTENT = {

  tabs: [

    // ========================================================
    // FLIK 1 — Substratparametrar
    // ========================================================
    {
      id: "biomass-loading",
      title: "Driftparametrar",
      intro: `I detta avsnitt beräknas grundläggande parametrar för att karakterisera biogassubstrat och -processer. 
Torrsubstans (Total Solids, TS) och glödförlust (Volatile Solids, VS) beskriver hur stor
andel av substratet som är torrsubstans respektive hur stor del av den som
är biologiskt (teoretiskt) nedbrytbar. Organisk belastning (Organic Loading Rate, OLR) och
hydraulisk retentionstid (Hydraulic Retention Time, HRT) anger sedan hur hårt reaktorn belastas och hur länge materialet
uppehåller sig inne i rötkammaren.

Du kan läsa mer om dessa beräkningar i <a href="assets/handbok.pdf?p=72#page=72">handboken på s 72–74</a>. `,

      equations: [

        // -------------------------------------------------------
        // Torrsubstansgrupp: TS, VS, VS/TS-kvot
        //
        // HUR GRUPPER FUNGERAR i content.js:
        //   En grupp har delade "parameters" på toppnivå (anges
        //   en gång av studenten) och en "equations"-underarray. Varje
        //   delekvations result_symbol är automatiskt tillgänglig som
        //   en variabel i formula_calc för efterföljande delekvationer
        //   — så VS/TS kan använda TS och VS utan extra indata.
        // -------------------------------------------------------
        {
          id:    "dry-matter",
          title: "Torrsubstansbestämning",
          intro: `Dessa tre storheter bestäms alltid tillsammans från samma laboratorieprov.
Man väger det färska provet, torkar det vid 105°C och väger igen (ger
torrsubstans, TS), glödgar sedan det torra provet vid 550°C och väger
askan (ger glödförlusten, VS). 

Ange de tre massorna nedan för att beräkna värdena.`,

          // Delade indata — anges en gång, används av alla delekvationer nedan
          parameters: [
            {
              id:          "m_wet",
              name:        "Våtvikt",
              unit:        "g",
              description: "Ursprunglig massa av det otorkade provet",
              //placeholder: 100,
              min: 0,
              step: 1,
              decimals: 1
            },
            {
              id:          "m_dry",
              name:        "Torrvikt",
              unit:        "g",
              description: "Provets massa efter torkning vid 105°C i 24 h",
              //placeholder: 18,
              min: 0,
              step: 1,
              decimals: 1
            },
            {
              id:          "m_ash",
              name:        "Askvikt",
              unit:        "g",
              description: "Massa kvar efter glödgning vid 550°C i 4 h",
              //placeholder: 2,
              min: 0,
              step: 0.1,
              decimals: 3
            },
          ],

          equations: [

            // Delekvation 1: Total Solids
            {
              id:    "ts",
              title: "Torrsubstans (TS)",
              intro: `Torrsubstans (Total Solids, TS) är den del av substratet som återstår efter att
allt vatten har torkats bort. Den bestäms genom att väga ett prov före och efter torkning vid 105°C i 24 timmar.`,

              formula_latex:   "TS\\,(\\%) = \\frac{m_{torr}}{m_{våt}} \\times 100",
              formula_filled:  "TS = ({m_dry} g ÷ {m_wet} g) × 100",
              formula_calc:    "m_dry / m_wet * 100",

              result_symbol:   "TS",   // injiceras även som variabeln "TS" för delekvationer nedan
              result_unit:     "%",
              result_decimals: 1,

              /*typical_range: {
                min:         5,
                max:         20,
                unit:        "%",
                low_text:    "Mycket lågt TS, typiskt för exempelvis flytgödsel.",
                normal_text: "",
                high_text:   "Högt TS — substratet är relativt torrt (t.ex. halm, torkat gödsel). Vanlig våtrötning kan vara svår; överväg förspädning eller torrötning."
              },*/ 

              educational_text: `Total Solids (TS) är en av de mest grundläggande karakteriseringsparametrarna
inom biogasteknik. Eftersom biogasanläggningar typiskt hanterar substrat med
vitt skilda vattenhalter — från flytande nötflytgödsel (3–10 % TS) till torrt
halm (80–90 % TS) — är det avgörande att känna till TS-halten för att kunna
beräkna massbalanser, dimensionera pumpar och omrörare samt utforma
värmeväxlare.

Mätningen är i sig enkel: ett avvägt prov torkas vid 105 °C tills massan
stabiliseras och vägs sedan igen. Den förlorade massan är vatten; den
kvarvarande massan är Total Solids. Observera att vid 105 °C avlägsnas
endast fritt vatten — kristallvatten och flyktiga föreningar fångas inte
fullt ut, men för praktiskt biogasarbete ger denna standardmetod konsekventa
och jämförbara resultat.

Vid jämförelse av substrat eller uppföljning av en anläggning över tid ska
TS alltid anges på färskviktsbasis (FM, Fresh Matter), enligt denna ekvation.`
            },

            // Delekvation 2: Volatile Solids
            {
              id:    "vs",
              title: "Glödförlust (Volatile Solids, VS)",
              intro: `Volatile Solids (VS) representerar den organiska fraktionen av
torrsubstansen — den del som i princip kan brytas ned av mikroorganismer
för att producera biogas. Askan som återstår efter glödgning vid 550 °C
är den oorganiska fraktionen (mineralfraktionen).`,

              formula_latex:   "VS\\,(\\%) = \\frac{m_{torr} - m_{aska}}{m_{våt}} \\times 100",
              formula_filled:  "VS = (({m_dry} g − {m_ash} g) ÷ {m_wet} g) × 100",
              formula_calc:    "(m_dry - m_ash) / m_wet * 100",

              result_symbol:   "VS",   // injiceras även som variabeln "VS" för VS/TS nedan
              result_unit:     "%",
              result_decimals: 1,

              typical_range: {
                min:         2,
                max:         33,
                unit:        "%",
                low_text:    "Mycket lågt VS — substratet har en stor mineralfraktion eller är kraftigt utspätt. Biogasutbytet per kg färskvikt blir begränsat.",
                normal_text: "VS-halten är inom det typiska intervallet för organiska biogassubstrat.",
                high_text:   "Mycket högt VS — substratet är både torrt och starkt organiskt. Utmärkt biogaspotential per kg färskvikt."
              },

              educational_text: `Volatile Solids (VS) är den viktigaste parametern för att bedöma biogaspotential.
Endast den organiska fraktionen av ett substrat kan omvandlas till biogas
av anaeroba mikroorganismer; mineralfraktionen (sand, salter, etc.)
passerar reaktorn oförändrad och ansamlas som fasta ämnen i rötresten.

Det specifika metanutbytet för ett substrat (uppmätt i
så kallade BMP-tester, Biochemical Methane Potential) anges
alltid per kg VS som tillsatts, inte per kg TS eller per kg färskvikt.
Detta möjliggör rättvis jämförelse mellan substrat med olika fukt- och
askhalter.`
            },

            // Delekvation 3: VS/TS-kvot
            {
              id:    "vsts",
              title: "VS (% av TS)",
              intro: `VS som % av TS anger vilken andel av torrsubstansen som är organisk.
Den beräknas automatiskt från TS- och VS-värdena ovan.`,

              formula_latex:   "\\frac{VS}{TS}\\,(\\%) = \\frac{VS}{TS} \\times 100",
              // {TS} och {VS} substitueras från de beräknade resultaten ovan
              formula_filled:  "VS/TS = ({VS}% ÷ {TS}%) × 100",
              formula_calc:    "VS / TS * 100",

              result_symbol:   "VS_TS",
              result_unit:     "%",
              result_decimals: 1,

              typical_range: null /*{
                min:         60,
                max:         95,
                unit:        "%",
                low_text:    "Lågt VS/TS — stor mineralfraktion. Vanligt i rötrest, mineralkontaminerade substrat eller material med hög sand-/jordhalt. Metanutbytet per kg färskvikt blir lågt.",
                normal_text: "VS/TS-kvoten är inom det typiska intervallet för organiska biogassubstrat.",
                high_text:   "Mycket högt VS/TS — nästan helt organisk torrsubstans. Utmärkt substratkvalitet för biogasproduktion."
              }*/,

              educational_text: `VS som % av TS är ett av de enklaste och mest användbara talen vid
substratkvalificering. Typiska värden sträcker sig från ungefär 60 % för
rötrest eller jordförorenade material upp till 95 % för rena energigrödor
som majsensilage eller odlade gräs.

En praktisk tumregel: om du känner till TS-halten och VS/TS-kvoten för ditt
substrat kan du snabbt uppskatta dess biokemiska metanpotential (BMP,
Biochemical Methane Potential) genom att multiplicera ett litteraturvärde
för BMP (typiskt angivet i NL CH₄/kg VS) med VS-halten.

Observera att VS/TS alltid måste vara ≤ 100 %. Om din beräkning ger ett
värde över 100 %, kontrollera laboratoriemätningarna — askmassan kan inte
överstiga torrmassan.`
            }

          ] // slut på delekvationer för torrsubstansgruppen
        },

        // -------------------------------------------------------
        // Hydraulic Retention Time (HRT)
        // -------------------------------------------------------
        {
          id: "hrt",
          title: "Retentionstid (Hydraulic Retention Time, HRT)",
          intro: `Retentionstiden är den genomsnittliga tid som material
uppehåller sig inne i rötkammaren innan det avlägsnas som rötrest. En
längre retentionstid gör att materialet får längre tid för att brytas ned.
HRT anges i dygn.`,

          formula_latex:   "HRT = \\frac{V_{reaktor}}{V_{inmatat\\ substrat}}",
          formula_filled:  "HRT = {v_reactor} m³ ÷ {q_feed} m³/d",
          formula_calc:    "v_reactor / q_feed",

          result_symbol:   "HRT",
          result_unit:     "dygn",
          result_decimals: 1,

          parameters: [
            {
              id:          "v_reactor",
              name:        "Reaktorvolym",
              unit:        "m³",
              description: "Aktiv volym i rötkammaren",
              //placeholder: 500,
              min: 0,
              step: 10,
              decimals: 0
            },
            {
              id:          "q_feed",
              name:        "Daglig matningsvolym",
              unit:        "m³/d",
              description: "Volym substrat som tillsätts reaktorn per dag",
              //placeholder: 25,
              min: 0,
              step: 5,
              decimals: 0
            }
          ],

          typical_range: {
            min:         15,
            max:         40,
            unit:        "dygn",
            low_text:    "Låg HRT. material passerar snabbt genom rötkammaren. Substratnedbrytningen blir ofullständig.",
            normal_text: "HRT är inom det typiska intervallet.",
            high_text:   "Hög HRT. materialet har lång uppehållstid, vilket gynnar hög nedbrytningseffektivitet men eventuellt leder till minskad volumetrisk produktion."
          },

          educational_text: `Retentionstiden är en grundläggande parameter
för en kontinuerligt matad rötkammare. Den anger hur länge en vattenmolekyl
(eller löst substrat) i genomsnitt uppehåller sig i reaktorn innan den lämnar
med utflödet, men används ofta som ett mått på hur länge substratet i genomsnitt
bryts ned i reaktorn.`
        }, // Slut på HRT-delen

        // -------------------------------------------------------
        // Organic Loading Rate (OLR) — grupp med två beräkningsvägar
        // -------------------------------------------------------
        {
          id: "olr",
          title: "Organisk belastning (Organic Loading Rate, OLR)",
          intro: `Den organiska belastningen beskriver hur mycket VS (organiskt
material) som matas in i rötkammaren per enhet reaktorvolym per dag. Det är
den viktigaste parametern för att styra hur hårt processen
belastas. OLR anges typiskt i kg VS per m³ per dygn.

OLR kan beräknas på två ekvivalenta sätt som visas nedan.`,

          parameters: [], // Inga delade parametrar — varje beräkningsväg har egna

          equations: [

            // Beräkningsväg 1: via inmatat flöde och reaktorvolym
            {
              id:    "olr_mass",
              title: "Via inmatat flöde och reaktorvolym",
              intro: `Den klassiska definitionen: inmatad VS-massa per dygn dividerat med reaktorvolymen.`,

              parameters: [
                {
                  id:          "m_wet_substrate",
                  name:        "Våtvikt per dag",
                  unit:        "ton",
                  description: "Mängd substrat som matas in i reaktorn per dag",
                  min: 0,
                  step: 5,
                  decimals: 0
                },
                {
                  id:          "vs_percentage",
                  name:        "VS-halt substrat",
                  unit:        "%",
                  description: "Procentandel VS i det inmatade substratet (av våtvikt)",
                  min: 0,
                  step: 1,
                  decimals: 1
                },
                {
                  id:          "v_reactor",
                  name:        "Reaktorvolym",
                  unit:        "m³",
                  description: "Aktiv (flytande) volym i rötkammaren",
                  min:         0.001
                }
              ],

              formula_latex:   "OLR = \\frac{\\dot{m}_{våt} \\times VS\\,(\\%)}{V_R} \\times 10",
              formula_filled:  "OLR = {m_wet_substrate} ton/d × {vs_percentage} % ÷ {v_reactor} m³ × 10",
              formula_calc:    "m_wet_substrate * vs_percentage / 100 / v_reactor * 1000",

              result_symbol:   "OLR",
              result_unit:     "kg VS / (m³·d)",
              result_decimals: 2,

              typical_range: {
                min:         1.0,
                max:         4.0,
                unit:        "kg VS/(m³·d)",
                low_text:    "Reaktorn är lågt belastad, vilket kan innebära att den tillgängliga reaktorvolymen inte utnyttjas effektivt.",
                normal_text: "OLR är inom det typiska driftsintervallet.",
                high_text:   "Reaktorn är hårt belastad. Det finns risk för störning pga. ackumulering av flyktiga fettsyror, VFA."
              },

              educational_text: `Den organiska belastningen är en mycket viktig parameter
för en biogasanläggning. Den definierar förhållandet mellan mängden inmatat
substrat och reaktorns storlek.

Här kunde man skriva något om olika typiska värden.`
            },

            // Beräkningsväg 2: via VS-halt och HRT
            {
              id:    "olr_hrt",
              title: "Via VS-halt substrat och HRT",
              intro: `OLR kan även beräknas direkt från substratets VS-halt och
retentionstid, under antagandet att substratets densitet är
ungefär 1 000 kg/m³. (Nu blir det multiplicerat med 10 eftersom vi anger VS i %... så det är 100 i nämnaren och 1000 i täljaren. Vet inte om man borde förklara det eller skriva ut ekvationen i två steg?).`,

              parameters: [
                {
                  id:          "vs_percentage",
                  name:        "VS-halt substrat",
                  unit:        "%",
                  description: "Procentandel VS i det inmatade substratet (av våtvikt)",
                  min: 0,
                  step: 1,
                  decimals: 1
                },
                {
                  id:          "hrt_olr",
                  name:        "HRT",
                  unit:        "dygn",
                  description: "Hydraulisk retentionstid",
                  min:         0.1,
                  step:        1,
                  decimals:    1
                }
              ],

              formula_latex:   "OLR = \\frac{VS\\,(\\%) \\times 10}{HRT}",
              formula_filled:  "OLR = {vs_percentage} % × 10 ÷ {hrt_olr} d",
              formula_calc:    "vs_percentage * 10 / hrt_olr",

              result_symbol:   "OLR_HRT",
              result_unit:     "kg VS / (m³·d)",
              result_decimals: 2,

              //educational_text: null //``
            }

          ] // slut på OLR-ekvationer
        },


      ] // slut på ekvationer: Flik 1
    }, // slut på Flik 1

    // ========================================================
    // FLIK 2 — Kväve
    // ========================================================
    {
      id: "nitrogen",
      title: "Kväve",
      intro: `Kväve är en viktig näring för mikroorganismer i biogasanläggningar. 
Kväve används för att syntetisera protein och DNA, och påverkar därmed mikrobernas tillväxt och aktivitet. 
För mycket kväve kan dock vara toxiskt för vissa mikroorganismer, vilket kan leda till störningar i processen.

Läs mer i <a href="assets/handbok.pdf?p=76#page=76">handboken s. 76–79</a>.`,

      equations: [

        // -------------------------------------------------------
        // TAN & fri ammoniak (NH₃) — grupp med pKa-korrigering först
        // -------------------------------------------------------
        {
          id: "ammonia-group",
          title: "Total Ammonia Nitrogen (TAN) och fri ammoniak (NH₃)",
          intro: `Den totala mängden ammoniumkväve (Total Ammonia Nitrogen, TAN) i reaktorn
finns i två former: ammonium (NH₄⁺) och ojoniserad s.k. fri ammoniak (NH₃).
Den fria ammoniaken är direkt hämmande för mikroorganismer. Andelen NH₃ av
TAN beror på pH och temperatur — och eftersom pKa själv är temperaturberoende
beräknas den i steget nedan, varefter NH₃-halten beräknas automatiskt.`,

          // Delade indata — anges en gång, används av båda delekvationerna
          parameters: [
            {
              id:          "T_celsius",
              name:        "Temperatur",
              unit:        "°C",
              description: "Processens driftstemperatur",
              //placeholder: 37,
              min:         0
            },
            {
              id:          "tan",
              name:        "Ammoniumkväve (TAN)",
              unit:        "mg N/L",
              description: "Totalt ammoniumkväve uppmätt i reaktorn",
              //placeholder: 3000,
              min:         0
            },
            {
              id:          "pH",
              name:        "pH i reaktorn",
              unit:        "",
              description: "",
              //placeholder: 7.8,
              min:         0
            }
          ],

          equations: [

            // Delekvation 1: pKa-temperaturkorrigering
            {
              id: "pka-temp",
              title: "pKa-temperaturkorrigering",
              intro: `Syradissociationskonstanten (pKa) för ammonium–ammoniak-jämvikten anger hur stor andel av ammoniumkvävet som är i joniserad resp. ojoniserad form. pKa minskar
med stigande temperatur. Vi måste beräkna pKa för att kunna beräkna fri ammoniak.`,

              formula_latex:   "pK_a = 0.09018 + \\frac{2729.92}{T + 273.15}",
              formula_filled:  "pKa = 0.09018 + 2729.92 ÷ ({T_celsius} + 273.15)",
              formula_calc:    "0.09018 + 2729.92 / (T_celsius + 273.15)",

              result_symbol:   "pKa",
              result_unit:     "",
              result_decimals: 3,

              typical_range: {
                min:         8.50,
                max:         9.30,
                unit:        "—",
                low_text:    "Mycket hög temperatur (termofilt eller däröver). Vid lägre pKa existerar en större andel av TAN som hämmande fri NH₃.",
                normal_text: "pKa är inom det förväntade intervallet för mesofil (35 °C) till termofil (55 °C) rötning.",
                high_text:   "Låg temperatur — pKa är högt, vilket innebär att en mindre andel av TAN existerar som fri NH₃. Psykrofil rötning eller rötning vid omgivningstemperatur."
              },

              educational_text: `pKa för ammoniumjonen varierar med temperaturen enligt van't Hoff-ekvationen.
Formeln som används här (Emerson m.fl., 1975) är välciterad i vatten- och
avloppsbehandlingslitteraturen och ger noggranna resultat i det temperatur­
intervall som är relevant för biogasanläggningar (15–60 °C).

Referensvärden:
  25 °C → pKa ≈ 9,25
  35 °C → pKa ≈ 9,09
  37 °C → pKa ≈ 9,06
  55 °C → pKa ≈ 8,60`
            },

            // Delekvation 2: Fri ammoniak (NH₃) — använder pKa från ovan
            {
              id: "nh3",
              title: "Fri ammoniak (NH₃)",
              intro: `Med pKa beräknat ovan och uppmätt TAN och pH kan nu andelen fri ammoniak beräknas.`,

              formula_latex:   "NH_3\\,(\\text{mg/L}) = \\frac{TAN}{1 + 10^{\\,pK_a - pH}}",
              formula_filled:  "NH₃ = {tan} mg/L ÷ (1 + 10^({pKa} − {pH}))",
              formula_calc:    "tan / (1 + Math.pow(10, pKa - pH))",

              result_symbol:   "NH₃",
              result_unit:     "mg N/L",
              result_decimals: 0,

              typical_range: {
                min:         0,
                max:         400,
                unit:        "mg N/L",
                low_text:    "",
                normal_text: "Fri ammoniak inom normalspannet. Låg risk för processtörningar.",
                high_text:   "Hög nivå av fri ammoniak. Detta kan leda till störning i processen."
              },

              educational_text: `Hämning från fri ammoniak är en av de vanligaste orsakerna till
processobalans i biogasanläggningar som tar emot kväverika substrat som hönsgödsel och slaktavfall (chansar här).

Här kan man skriva något mer säkert.`
            }

          ] // slut på delekvationer för ammoniakgruppen
        },

        // -------------------------------------------------------
        // Kvävemineralisering
        // -------------------------------------------------------
        {
          id: "n-mineralization",
          title: "Kvävemineralisering (ML)",
          intro: `Under rötningsprocessen omvandlas en del av det organiska kvävet i substratet
till ammoniumkväve (NH₄⁺-N) — en process som kallas kvävemineralisering. Graden
av mineralisering anger hur stor andel av substratets organiska kväve som
frigjorts som ammonium i rötresten. Detta är viktigt för att förstå rötresten
som gödselmedel, eftersom mineraliserat kväve är direkt växttillgängligt.`,

          formula_latex:   "ML\\,(\\%) = \\frac{NH_4^+\\text{-}N_{rötrest} - NH_4^+\\text{-}N_{substrat}}{\\text{Org-}N_{substrat}} \\times 100",
          formula_filled:  "ML = ({tan_digestate} − {tan_substrate}) ÷ {org_n_substrate} × 100",
          formula_calc:    "(tan_digestate - tan_substrate) / org_n_substrate * 100",

          result_symbol:   "ML",
          result_unit:     "%",
          result_decimals: 1,

          parameters: [
            {
              id:          "tan_digestate",
              name:        "NH₄⁺-N i rötrest",
              unit:        "mg N/kg våtvikt",
              description: "",
              min:         0,
              step:        50,
              decimals:    0
            },
            {
              id:          "tan_substrate",
              name:        "NH₄⁺-N i substrat",
              unit:        "mg N/kg våtvikt",
              description: "",
              min:         0,
              step:        10,
              decimals:    0
            },
            {
              id:          "org_n_substrate",
              name:        "Organiskt kväve i substrat",
              unit:        "mg N/kg våtvikt",
              description: "",
              min:         0,
              step:        50,
              decimals:    0
            }
          ],

          typical_range: {
            min:         20,
            max:         50,
            unit:        "%",
            low_text:    "Låg mineralisering — en stor del av kvävet finns kvar i organisk form i rötresten. Kvävet är ännu inte växttillgängligt och kräver vidare nedbrytning i marken.",
            normal_text: "Mineraliseringsgraden är inom det typiska intervallet för anaerob rötning av lantbrukssubstrat.",
            high_text:   "Hög mineralisering — en stor andel av det organiska kvävet har omvandlats till ammonium. Rötresten har ett högt innehåll av direkt växttillgängligt kväve."
          },

          educational_text: `Kvävemineraliseringen är ett ytterligare mått på effektiviteten i biogasprocessen. Värdet kan även användas för att beräkna hur mycket ammoniumkväve som kan bildas när man tillför ett nytt substrat till sin substratmix.`
        }

      ] // slut på ekvationer: Flik 2
    } // slut på Flik 2

  ] // slut på tabs

}; // slut på CALCULATOR_CONTENT
