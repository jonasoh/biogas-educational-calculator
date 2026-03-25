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

/* ============================================================
   Substratdata för Samrötningsfliken
   Källa: Avfall Sverige U2009:14 – Substrathandbok för biogasproduktion
   ts      = torrsubstanshalt (% av våtvikt)
   vs_ts   = VS/TS-kvot (fraktion, 0–1)
   bmp     = biometanpotential (Nm³ CH₄ / ton VS)
   cn      = C/N-kvot
   ============================================================ */
const CODIGESTION_SUBSTRATES = [
  {
    id: "notflytgodsel",
    name: "Nötflytgödsel",
    ts: 9, vs_ts: 0.80, bmp: 213, cn: 13,
    note: "Typiskt bassubstrat. Kan orsaka svämtäcke. Redan delvis nedbrutet (dåligt gasutbyte)"
  },
  {
    id: "svingodsel",
    name: "Svingödsel",
    ts: 8, vs_ts: 0.80, bmp: 268, cn: 5,
    note: "Kan innehålla sand som sedimenterar, kan orsaka skumning."
  },
  // C/N-kvot i hästgödsel approximerat från Lallement 2023, On-Farm Composting Handbook 1992, väldigt varierande.
  {
    id: "hastgodsel",
    name: "Hästgödsel",
    ts: 30, vs_ts: 0.80, bmp: 170, cn: 40,
    note: "Hög TS-halt pga strö. Kan innehålla sand och grus som sedimenterar. God kolkälla vid samrötning med kväverika substrat."
  },
  {
    id: "honsgodsel",
    name: "Hönsgödsel",
    ts: 42, vs_ts: 0.76, bmp: 247, cn: 7,
    note: "Kan orsaka svämtäcke pga fjädrar, kan innehålla sand, grus och skal som sedimenterar. Ej lämpligt som ensamt substrat pga högt kväveinnehåll."
  },
  {
    id: "slakteriavfall_magtarm",
    name: "Slakteriavfall (mag/tarm)",
    ts: 16, vs_ts: 0.83, bmp: 434, cn: 30,
    note: "Energirikt substrat med högt gasutbyte. Lämpar sig mindre bra som ensamt substrat, risk för sjunkande pH."
  },
  {
    id: "returprodukt_mejeri",
    name: "Returprodukt (mejeri)",
    ts: 20, vs_ts: 0.95, bmp: 520, cn: 8,
    note: "Mycket högt gasutbyte. Låg alkalinitet – bör samrötas med t.ex. gödsel."
  },
  // C/N-kvot uppskattad
  {
    id: "vall",
    name: "Vall",
    ts: 33, vs_ts: 0.88, bmp: 300, cn: 20,
    note: "Bra energiinnehåll. Kräver mekanisk sönderdelning. Lågt innehåll av vissa spårämnen."
  },
  {
    id: "halm",
    name: "Halm",
    ts: 78, vs_ts: 0.91, bmp: 207, cn: 90,
    note: "Mycket hög TS-halt och C/N-kvot. Kräver förbehandling för effektiv nedbrytning. Risk för svämtäcke."
  },
];

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
        // Utrötningsgrad
        // -------------------------------------------------------
        {
          id: "degradation-efficiency",
          title: "Utrötningsgrad",
          intro: `Utrötningsgraden anger hur stor del av det organiska materialet som gått in i
processen som brutits ned och omvandlats till biogas. Det är skillnaden i
organiskt innehåll mellan ingående och utgående material, angiven i procent.`,

          formula_latex:   "E\\,(\\%) = \\left(1 - \\frac{TS_{utgående} \\times VS_{utgående}}{TS_{substrat} \\times VS_{substrat}}\\right) \\times 100",
          formula_filled:  "E = (1 − ({ts_out} × {vs_out}) ÷ ({ts_in} × {vs_in})) × 100",
          formula_calc:    "(1 - (ts_out * vs_out) / (ts_in * vs_in)) * 100",

          result_symbol:   "E",
          result_unit:     "%",
          result_decimals: 1,

          parameters: [
            {
              id:          "ts_in",
              name:        "TS substrat (ingående)",
              unit:        "%",
              description: "TS-halt i substratet, % av våtvikt",
              min:         0.001,
              step:        1,
              decimals:    1
            },
            {
              id:          "vs_in",
              name:        "VS substrat (ingående)",
              unit:        "%",
              description: "VS-halt i substratet, % av TS",
              min:         0.001,
              step:        1,
              decimals:    1
            },
            {
              id:          "ts_out",
              name:        "TS rötrest (utgående)",
              unit:        "%",
              description: "TS-halt i rötresten, % av våtvikt",
              min:         0,
              step:        1,
              decimals:    1
            },
            {
              id:          "vs_out",
              name:        "VS rötrest (utgående)",
              unit:        "%",
              description: "VS-halt i rötresten, % av TS",
              min:         0,
              step:        1,
              decimals:    1
            }
          ],

          /*typical_range: {
            min:         40,
            max:         70,
            unit:        "%",
            low_text:    "Låg utrötningsgrad — en stor del av det organiska materialet har inte brutits ned. Det kan tyda på kort retentionstid, låg temperatur eller substrat som är svårnedbrytbart.",
            normal_text: "Utrötningsgraden är inom det typiska intervallet för anaerob rötning.",
            high_text:   "Hög utrötningsgrad — en stor del av det organiska materialet har omvandlats till biogas. Kontrollera att beräkningsunderlagen är rimliga."
          },*/

          educational_text: `Utrötningsgraden är ett viktigt mått på hur effektivt rötkammaren bryter
ned det organiska materialet. Typiska värden för välskötta anläggningar
ligger mellan 40 och 70 %, beroende på substrat och driftbetingelser.
Lättnedbrytbara substrat som matavfall och energigrödor ger ofta högre
utrötningsgrad än exempelvis halm och fibröst material.

Observera att formeln bygger på ett förenklat antagande om att volymen in
och ut är densamma. I praktiken minskar volymen något till följd av
gasbildningen, vilket innebär att den beräknade utrötningsgraden är en
något underskattning av den verkliga nedbrytningen.`
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

              formula_latex:   "OLR = \\frac{m_{våt} \\times VS\\,(\\%)}{V_R} \\times 10",
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
    }, // slut på Flik 2

    // ========================================================
    // FLIK 3 — Processutvärdering
    // ========================================================
    {
      id: "process-evaluation",
      title: "Processutvärdering",
      intro: `Här beräknas nyckeltal för att utvärdera hur effektivt biogasanläggningen
omvandlar substrat till metan. De två viktigaste måtten är den
substratspecifika metanproduktionen (SMP) och den volumetriska
metanproduktionen.`,

      equations: [

        // -------------------------------------------------------
        // SMP — Substratspecifik metanproduktion
        // -------------------------------------------------------
        {
          id: "smp",
          title: "Specifik metanproduktion (SMP)",
          intro: `SMP mäter hur mycket metan anläggningen producerar per enhet organiskt
material (VS) som matas in.`,

          formula_latex:   "SMP = \\frac{V_{CH_4}}{m_{våt} \\times VS\\,(\\%)} \\times 100",
          formula_filled:  "SMP = {v_ch4} m³ CH₄ ÷ ({m_wet_smp} ton × {vs_smp} %) × 100",
          formula_calc:    "v_ch4 / (m_wet_smp * vs_smp) * 100",

          result_symbol:   "SMP",
          result_unit:     "m³ CH₄/ton VS",
          result_decimals: 0,

          parameters: [
            {
              id:          "v_ch4",
              name:        "Metanvolym",
              unit:        "m³ CH₄",
              description: "Uppmätt metanproduktion under perioden (normalt per dygn)",
              min:         0,
              step:        10,
              decimals:    0
            },
            {
              id:          "m_wet_smp",
              name:        "Våtvikt per dag",
              unit:        "ton",
              description: "Mängd substrat som matas in under samma period",
              min:         0.001,
              step:        1,
              decimals:    1
            },
            {
              id:          "vs_smp",
              name:        "VS-halt substrat",
              unit:        "%",
              description: "Procentandel VS i det inmatade substratet (av våtvikt)",
              min:         0.001,
              step:        1,
              decimals:    1
            }
          ],

          /*typical_range: {
            min:         150,
            max:         350,
            unit:        "m³ CH₄/ton VS",
            low_text:    "Lågt SMP-värde. Anläggningen utnyttjar substratet dåligt — möjliga orsaker är kort retentionstid, processstörning eller att ett svårnedbrytbart substrat används.",
            normal_text: "SMP är inom det typiska intervallet för gårdsbiogasanläggningar.",
            high_text:   "Högt SMP-värde. Substratet bryts ned effektivt, eller så matas ett lättnedbrytbart substrat med hög biogaspotential in."
          },*/

          educational_text: `…`
        },

        // -------------------------------------------------------
        // MP_vol — Volumetrisk metanproduktion
        // -------------------------------------------------------
        {
          id: "mp-vol",
          title: "Volumetrisk metanproduktion",
          intro: `Den volumetriska metanproduktionen anger hur mycket metan som
produceras per kubikmeter aktiv reaktorvolym och dag.`,

          formula_latex:   "MP_{vol} = \\frac{V_{CH_4}}{V_R}",
          formula_filled:  "MP_vol = {v_ch4_daily} m³ CH₄/d ÷ {v_reactor} m³",
          formula_calc:    "v_ch4_daily / v_reactor",

          result_symbol:   "MP_vol",
          result_unit:     "m³ CH₄/(m³·d)",
          result_decimals: 2,

          parameters: [
            {
              id:          "v_ch4_daily",
              name:        "Daglig metanvolym",
              unit:        "m³ CH₄/d",
              description: "Uppmätt metanproduktion per dygn",
              min:         0,
              step:        10,
              decimals:    0
            },
            {
              id:          "v_reactor",
              name:        "Aktiv reaktorvolym",
              unit:        "m³",
              description: "Flytande volym i rötkammaren",
              min:         0.001,
              step:        10,
              decimals:    0
            }
          ],

          /*typical_range: {
            min:         0.3,
            max:         1.5,
            unit:        "m³ CH₄/(m³·d)",
            low_text:    "Låg volumetrisk produktion. Reaktorutrymmet utnyttjas ineffektivt — reaktorn kan vara underdimensionerad i förhållande till biogaspotentialen, eller processen störs.",
            normal_text: "MP_vol är inom det typiska intervallet för mesofila gårdsbiogasanläggningar.",
            high_text:   "Hög volumetrisk produktion. Reaktorn belastas hårt — kontrollera att OLR och processtabilitet är godtagbara."
          },*/

          educational_text: `Den volumetriska metanproduktionen är ett praktiskt nyckeltal för att
bedöma om reaktorn dimensionerats rätt i förhållande till tillgängligt
substrat.

…`
        }

      ] // slut på ekvationer: Flik 3
    }, // slut på Flik 3

    // ========================================================
    // FLIK 4 — Samrötning
    // Obs: Denna flik renderas av codigestion.js (type: "codigestion").
    // Lägg inte till ett "equations"-fält här.
    // ========================================================
    {
      id:    "codigestion",
      type:  "codigestion",
      title: "Samrötning",
      intro: `Samrötning innebär att två eller flera substrat rötas tillsammans i samma biogasreaktor. Genom att kombinera substrat kan man förbättra C/N-kvoten, öka biogasutbytet, …

Välj ett primärt substrat och ange andelen av ett sekundärt substrat för att se hur blandningen påverkar torrsubstanshalt, VS-halt, C/N-kvot och metanproduktion. Alla beräkningar avser ett intag på 1 ton (1 000 kg) våtvikt.

Här bör man väl säga något om begräsningarna med beräkningen redan nu?`,

      // -----------------------------------------------------------
      // Standardinställningar
      // -----------------------------------------------------------
      defaults: {
        substrate1:  "notflytgodsel", // id för förhandsvalt primärsubstrat
        proportion2: 20,              // standardandel (%) för kosubstrat
      },

      // -----------------------------------------------------------
      // Färger
      // -----------------------------------------------------------
      colors: {
        substrate1: "#2a6b3c", // primärsubstrat (grön)
        substrate2: "#a39d4b", // kosubstrat (orange)
      },

      // -----------------------------------------------------------
      // Etiketter
      // -----------------------------------------------------------
      labels: {
        // Substratväljarkort
        substrate1_heading:      "Substrat 1 (bassubstrat)",
        substrate2_heading:      "Substrat 2 (kosubstrat)",
        proportion_label:        "Andel:",
        substrate2_blank_option: "— Välj kosubstrat —",
        empty_hint_s2:           "Välj ett kosubstrat för att se egenskaper.",

        // Egenskapstabell
        prop_ts:       "TS-halt",
        prop_vs_ts:    "VS/TS",
        prop_bmp:      "BMP",
        prop_cn:       "C/N-kvot",
        prop_bmp_unit: "Nm³/ton VS",

        // Resultattabell
        results_heading: "Jämförelse: monosubstrat vs samrötning (per ton inmatat våtvikt)",
        col_parameter:   "Parameter",
        col_mono:        "Monorötning",
        col_codig:       "Samrötning",
        col_change:      "Förändring",
        row_ts:          "TS-halt (%)",
        row_vs:          "VS (kg/ton)",
        row_cn:          "C/N-kvot",
        row_ch4:         "CH₄ (Nm³/ton)",

        // Diagram
        chart1_title:      "Substratbidrag (%)",
        chart2_title:      "Metanproduktion (Nm³/ton)",
        chart3_title:      "TS-halt (%)",
        chart1_categories: ["Våtvikt", "TS", "VS", "CH₄"],
        chart2_y_label:    "Nm³ CH₄ / ton",
        chart3_y_label:    "TS (%)",
        chart_mono_bar:    "Monorötning",
        chart_codig_bar:   "Samrötning",

        // Kommentarsruta
        no_warnings: "Inga varningar – substratblandningen ser rimlig ut utifrån de valda parametrarna.",
        disclaimer:  "Beräkningarna är förenklade och baserade på litteraturvärden från bl.a. Avfall Sveriges handbok <a href='https://www.biogodsel.se/media/1huf5snm/u2009-14_substrathandbok.pdf' target='_blank' rel='noopener noreferrer'>Substrathandbok för biogasproduktion</a>. Verkliga resultat varierar beroende på substratets kvalitet, driftparametrar, m.m.",
      },

      // -----------------------------------------------------------
      // Varningsregler — utvärderas av codigestion.js
      //
      // context:   "mono"  = inget kosubstrat valt
      //            "codig" = kosubstrat valt
      // variable:  nyckel i calc-objektet från calculateCodigestion()
      // operator:  "<" eller ">"
      // threshold: numeriskt gränsvärde
      // text:      varningstext; {value} ersätts med beräknat värde (1 decimal),
      //            {abs_value} med absolutvärdet, {name} med substrat 1:s namn
      // -----------------------------------------------------------

      // OBS - improviserade mha LLM.
      warnings: [
        // Monosubstratvarninga
        { context: "mono", variable: "cn_mono",     operator: "<", threshold: 15,
          text: "C/N-kvoten för {name} är {value} (< 15) – risk för ammoniakinhibering vid monosubstrat." },
        { context: "mono", variable: "cn_mono",     operator: ">", threshold: 30,
          text: "C/N-kvoten för {name} är {value} (> 30) – kvävebegränsning kan försämra processen." },
        { context: "mono", variable: "ts_mono_pct", operator: ">", threshold: 15,
          text: "TS-halten ({value} %) är hög för ett monosubstrat – kan kräva spädning." },
        // Samrötningsvarningar
        { context: "codig", variable: "ts_codig_pct",  operator: ">", threshold: 15,
          text: "TS-halten i blandningen är {value} % (> 15 %) – risk för dålig omrörning och bryggor i reaktorn." },
        { context: "codig", variable: "cn_codig",       operator: "<", threshold: 15,
          text: "C/N-kvoten i blandningen är {value} (< 15) – förhöjd risk för ammoniakinhibering." },
        { context: "codig", variable: "cn_codig",       operator: ">", threshold: 30,
          text: "C/N-kvoten i blandningen är {value} (> 30) – kvävebegränsning kan begränsa gasproduktionen." },
        { context: "codig", variable: "ch4_change_pct", operator: ">", threshold: 10,
          text: "Metanproduktionen ökar med {abs_value} % jämfört med monosubstrat – positiv synergieffekt." },
        { context: "codig", variable: "ch4_change_pct", operator: "<", threshold: -5,
          text: "Metanproduktionen minskar med {abs_value} % jämfört med monosubstrat – kontrollera substratandelen." },
      ],
    }

  ] // slut på tabs

}; // slut på CALCULATOR_CONTENT
