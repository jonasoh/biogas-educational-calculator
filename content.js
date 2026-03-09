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
 *   symbol      — KaTeX-symbol (t.ex. "m_{dry}")
 *   unit        — fysikalisk enhet som visas bredvid inmatningen
 *   description — ledtext på en rad som visas under inmatningen
 *   placeholder — exempelvärde som visas i grått när fältet är tomt
 *   min         — lägsta tillåtna värde (använd 0.001 istället för 0
 *                 för parametrar i nämnaren för att undvika division med noll)
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

const BIOGAS_CONTENT = {

  tabs: [

    // ========================================================
    // FLIK 1 — Substratparametrar
    // ========================================================
    {
      id: "biomass-loading",
      title: "Substratberäkningar",
      intro: `I detta avsnitt beräknas grundläggande parametrar för att karakterisera biogassubstrat och -processer. 
Torrsubstans (Total Solids, TS) och glödförlust (Volatile Solids, VS) beskriver hur stor
andel av substratet som är torrsubstans respektive hur stor del av den som
är biologiskt (teoretiskt) nedbrytbar. Organisk belastning (Organic Loading Rate, OLR) och
hydraulisk retentionstid (Hydraulic Retention Time, HRT) anger sedan hur hårt reaktorn belastas och hur länge materialet
uppehåller sig inne i rötkammaren.`,

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
              symbol:      "m_{wet}",
              unit:        "g",
              description: "Ursprunglig massa av det otorkade provet",
              //placeholder: 100,
              min:         0.001
            },
            {
              id:          "m_dry",
              name:        "Torrmassa",
              symbol:      "m_{dry}",
              unit:        "g",
              description: "Provets massa efter torkning vid 105°C i 24 h",
              //placeholder: 18,
              min:         0
            },
            {
              id:          "m_ash",
              name:        "Askmassa",
              symbol:      "m_{ash}",
              unit:        "g",
              description: "Massa kvar efter glödgning vid 550°C i 4 h",
              //placeholder: 2,
              min:         0
            },
          ],

          equations: [

            // Delekvation 1: Total Solids
            {
              id:    "ts",
              title: "Torrsubstans (TS)",
              intro: `Torrsubstans (Total Solids, TS) är den del av substratet som återstår efter att
allt vatten har torkats bort. Den bestäms genom att väga ett prov före och efter torkning vid 105°C i 24 timmar.`,

              formula_latex:   "TS\\,(\\%) = \\frac{m_{dry}}{m_{wet}} \\times 100",
              formula_filled:  "TS = ({m_dry} g ÷ {m_wet} g) × 100",
              formula_calc:    "m_dry / m_wet * 100",

              result_symbol:   "TS",   // injiceras även som variabeln "TS" för delekvationer nedan
              result_unit:     "%",
              result_decimals: 1,

              typical_range: {
                min:         3,
                max:         35,
                unit:        "%",
                low_text:    "Mycket lågt TS — detta är ett extremt utspätt substrat, liknande flytande gödsel eller processvatten. Pump- och uppvärmningskostnader blir höga i förhållande till biogasutbytet.",
                normal_text: "TS är inom det typiska intervallet för vanliga biogassubstrat (flytgödsel, matavfall, energigrödor).",
                high_text:   "Högt TS — substratet är relativt torrt (t.ex. halm, torkat gödsel). Vanlig våtrötning kan vara svår; överväg förspädning eller torrötning."
              },

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
              title: "Volatile Solids (VS)",
              intro: `Volatile Solids (VS) representerar den organiska fraktionen av
torrsubstansen — den del som i princip kan brytas ned av mikroorganismer
för att producera biogas. Askan som återstår efter glödgning vid 550 °C
är den oorganiska (mineraliska) fraktionen.`,

              formula_latex:   "VS\\,(\\%) = \\frac{m_{dry} - m_{ash}}{m_{wet}} \\times 100",
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

              educational_text: `Volatile Solids (VS) är den viktigaste indikatorn på biogaspotential.
Endast den organiska fraktionen av ett substrat kan omvandlas till biogas
av anaeroba mikroorganismer; den mineraliska fraktionen (sand, salter, aska)
passerar reaktorn oförändrad och ansamlas som fasta ämnen i rötresten.

I praktiken anges det specifika metanutbytet för ett substrat (uppmätt i
laboratoriska batchförsök kallade BMP-tester, Biochemical Methane Potential)
alltid per kg VS som tillsatts, inte per kg TS eller per kg färskvikt.
Detta möjliggör rättvis jämförelse mellan substrat med olika fukt- och
askhalter.`
            },

            // Delekvation 3: VS/TS-kvot (använder TS och VS från ovan — inga extra indata behövs)
            {
              id:    "vsts",
              title: "VS/TS-kvot",
              intro: `VS/TS-kvoten anger vilken andel av torrsubstansen som är organisk.
Den beräknas automatiskt från TS- och VS-värdena ovan — inga ytterligare
indata behövs.`,

              formula_latex:   "\\frac{VS}{TS}\\,(\\%) = \\frac{VS}{TS} \\times 100",
              // {TS} och {VS} substitueras från de beräknade resultaten ovan
              formula_filled:  "VS/TS = ({VS}% ÷ {TS}%) × 100",
              formula_calc:    "VS / TS * 100",   // TS och VS injiceras automatiskt från ovan

              result_symbol:   "VS_TS",
              result_unit:     "%",
              result_decimals: 1,

              typical_range: {
                min:         60,
                max:         95,
                unit:        "%",
                low_text:    "Lågt VS/TS — stor mineralfraktion. Vanligt i rötrest, mineralkontaminerade substrat eller material med hög sand-/jordhalt. Metanutbytet per kg färskvikt blir lågt.",
                normal_text: "VS/TS-kvoten är inom det typiska intervallet för organiska biogassubstrat.",
                high_text:   "Mycket högt VS/TS — nästan helt organisk torrsubstans. Utmärkt substratkvalitet för biogasproduktion."
              },

              educational_text: `VS/TS-kvoten är ett av de enklaste och mest användbara talen vid
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
        // Organic Loading Rate (OLR)
        // -------------------------------------------------------
        {
          id: "olr",
          title: "Organic Loading Rate (OLR)",
          intro: `Organic Loading Rate (OLR) beskriver hur mycket Volatile Solids (organiskt
material) som matas in i rötkammaren per enhet reaktorvolym per dag. Det är
den viktigaste parametern för att styra hur hårt det mikrobiella samhället
belastas — ett för högt OLR kan leda till processobalans.`,

          formula_latex:   "OLR = \\frac{\\dot{m}_{VS}}{V_R}",
          formula_filled:  "OLR = {m_vs_day} kg VS/d ÷ {v_reactor} m³",
          formula_calc:    "m_vs_day / v_reactor",

          result_symbol:   "OLR",
          result_unit:     "kg VS / (m³·d)",
          result_decimals: 2,

          parameters: [
            {
              id:          "m_vs_day",
              name:        "Daglig VS-inmatning",
              symbol:      "\\dot{m}_{VS}",
              unit:        "kg VS/d",
              description: "Massa Volatile Solids som matas in i reaktorn per dag",
              placeholder: 150,
              min:         0
            },
            {
              id:          "v_reactor",
              name:        "Reaktorvolym",
              symbol:      "V_R",
              unit:        "m³",
              description: "Aktiv (flytande) volym i rötkammaren",
              placeholder: 500,
              min:         0.001
            }
          ],

          typical_range: {
            min:         1.0,
            max:         4.0,
            unit:        "kg VS/(m³·d)",
            low_text:    "OLR är lågt — reaktorn är underlastad. Detta är stabilt men den tillgängliga reaktorvolymen utnyttjas inte effektivt. Överväg att öka matningshastigheten.",
            normal_text: "OLR är inom det typiska driftsintervallet för en CSTR (Continuously Stirred Tank Reactor) som behandlar lantbrukssubstrat.",
            high_text:   "OLR är högt — reaktorn är hårt belastad. Det finns risk för processförsurning (ackumulering av flyktiga fettsyror, VFA). Övervaka pH och VFA-koncentrationer noga."
          },

          educational_text: `Organic Loading Rate (OLR) är utan tvekan den viktigaste driftsparametern
för en biogasanläggning. Den definierar förhållandet mellan mängden inmatat
substrat och reaktorns storlek.

För en väl etablerad mesofil CSTR (Continuously Stirred Tank Reactor) som
behandlar lantbrukssubstrat (gödsel, energigrödor) uppnås stabil drift
typiskt mellan 1,5 och 3,5 kg VS/(m³·d). Över 4–5 kg VS/(m³·d) ackumuleras
flyktiga fettsyror (VFA, Volatile Fatty Acids) ofta snabbare än metanogenerna
kan förbruka dem, vilket leder till pH-sänkning och potentiellt processhaveri.

OLR hänger nära samman med Hydraulic Retention Time (HRT): om du känner till
HRT och VS-koncentrationen i inmatningen kan du beräkna OLR, och omvänt.
Båda parametrarna måste beaktas tillsammans vid dimensionering eller
felsökning av en anläggning.`
        },

        // -------------------------------------------------------
        // Hydraulic Retention Time (HRT)
        // -------------------------------------------------------
        {
          id: "hrt",
          title: "Hydraulic Retention Time (HRT)",
          intro: `Hydraulic Retention Time (HRT) är den genomsnittliga tid som material
uppehåller sig inne i rötkammaren innan det avlägsnas som rötrest. Den
avgör hur fullständigt substratet bryts ned och därmed hur mycket biogas
som produceras per enhet inmatat substrat.`,

          formula_latex:   "HRT = \\frac{V_R}{\\dot{V}_{feed}}",
          formula_filled:  "HRT = {v_reactor} m³ ÷ {q_feed} m³/d",
          formula_calc:    "v_reactor / q_feed",

          result_symbol:   "HRT",
          result_unit:     "dygn",
          result_decimals: 1,

          parameters: [
            {
              id:          "v_reactor",
              name:        "Reaktorvolym",
              symbol:      "V_R",
              unit:        "m³",
              description: "Aktiv (flytande) volym i rötkammaren",
              placeholder: 500,
              min:         0.001
            },
            {
              id:          "q_feed",
              name:        "Daglig matningsvolym",
              symbol:      "\\dot{V}_{feed}",
              unit:        "m³/d",
              description: "Volym substrat som tillsätts reaktorn per dag",
              placeholder: 25,
              min:         0.001
            }
          ],

          typical_range: {
            min:         15,
            max:         40,
            unit:        "dygn",
            low_text:    "Kort HRT — material passerar snabbt genom rötkammaren. Substratnedbrytningen blir ofullständig och det finns risk att långsamväxande metanogener tvättas ut. Överväg att minska matningshastigheten eller öka reaktorvolymen.",
            normal_text: "HRT är inom det typiska intervallet för mesofila CSTR-biogasanläggningar.",
            high_text:   "Långt HRT — materialet har lång uppehållstid, vilket gynnar hög nedbrytningseffektivitet. Den stora reaktorvolymen i förhållande till matningshastigheten kan dock tyda på underutnyttjad kapacitet."
          },

          educational_text: `Hydraulic Retention Time (HRT) är en grundläggande dimensioneringsparameter
för varje kontinuerligt matad rötkammare. Den anger hur länge en vattenmolekyl
(eller löst substrat) i genomsnitt uppehåller sig i reaktorn innan den lämnar
med efflödet.

För en enkel CSTR utan recirkulation är HRT lika med slamuppehållstiden
(SRT, Sludge Retention Time) — den tid som mikroorganismerna tillbringar i
reaktorn. Detta är viktigt eftersom de långsammast växande mikroorganismerna
i den anaeroba nedbrytningskedjan (acetokiastiska metanogener) har en minsta
fördelningstid på ungefär 5–7 dygn. Om HRT sjunker under detta tröskelvärde
tvättas metanogenerna ut snabbare än de kan reproducera sig, och processen
kollapsar.

I praktiken drivs mesofila anläggningar (35 °C) typiskt vid HRT på 20–30 dygn,
medan termofila anläggningar (55 °C) kan drivas vid kortare HRT på 10–20 dygn
eftersom de mikrobiella tillväxthastigheterna är högre vid högre temperaturer.`
        }

      ] // slut på ekvationer: Flik 1
    }, // slut på Flik 1

    // ========================================================
    // FLIK 2 — Processstabilitetsparametrar
    // ========================================================
    {
      id: "process-stability",
      title: "Processstabilitet",
      intro: `En välmående anaerob rötkammare upprätthåller en noggrann balans mellan
de olika mikrobiella samhällen som är inblandade. Detta avsnitt behandlar
de parametrar som används för att bedöma och övervaka processstabiliteten:
pH, temperatur och fri ammoniak (NH₃). Störningar i någon av dessa kan
snabbt leda till processhaveri om de inte åtgärdas.`,

      equations: [

        // -------------------------------------------------------
        // Fri ammoniak (NH₃)
        // -------------------------------------------------------
        {
          id: "nh3",
          title: "Fri ammoniak (NH₃)",
          intro: `Total Ammonia Nitrogen (TAN) i rötresten finns i två former: joniserat
ammonium (NH₄⁺) och ojoniserad fri ammoniak (NH₃). Endast fri ammoniak är
direkt hämmande för metanogena arkéer. Den andel av TAN som existerar som
fri NH₃ beror på både pH och temperatur, vilket är anledningen till att
detta jämviktsläge är så kritiskt att övervaka.`,

          formula_latex:   "NH_3\\,(\\text{mg/L}) = TAN \\times \\frac{1}{1 + 10^{\\,pK_a - pH}}",
          formula_filled:  "NH₃ = {tan} mg/L × 1 ÷ (1 + 10^({pka} − {pH}))",
          formula_calc:    "tan / (1 + Math.pow(10, pka - pH))",

          result_symbol:   "NH₃",
          result_unit:     "mg N/L",
          result_decimals: 0,

          parameters: [
            {
              id:          "tan",
              name:        "Total Ammonia Nitrogen (TAN)",
              symbol:      "TAN",
              unit:        "mg N/L",
              description: "Totalt ammoniumkväve uppmätt i rötresten",
              placeholder: 3000,
              min:         0
            },
            {
              id:          "pH",
              name:        "pH",
              symbol:      "pH",
              unit:        "—",
              description: "pH i rötresten (typiskt 7,0–8,5 i stabila biogasanläggningar)",
              placeholder: 7.8,
              min:         0
            },
            {
              id:          "pka",
              name:        "pKa för ammonium",
              symbol:      "pK_a",
              unit:        "—",
              description: "Syradissociationskonstant för NH₄⁺ (se temperaturkorrigering nedan)",
              placeholder: 9.25,
              min:         0
            }
          ],

          typical_range: {
            min:         0,
            max:         400,
            unit:        "mg N/L",
            low_text:    "Fri ammoniak är mycket låg — ingen hämning av metanogenesen förväntas.",
            normal_text: "Fri ammoniak understiger vanligen citerade hämningsgränser. De flesta metanogener tolererar upp till 150–400 mg NH₃-N/L utan signifikant hämning.",
            high_text:   "Fri ammoniak överstiger 400 mg N/L — signifikant hämning av acetokiastiska metanogener är trolig. Överväg att minska kväveinput, späda ut rötresten eller använda struvitfällning för att sänka TAN."
          },

          educational_text: `Hämning från fri ammoniak är en av de vanligaste orsakerna till
processobalans i biogasanläggningar som tar emot kvävrika substrat som
grisflytgödsel, fjäderfägödsel eller matavfall.

Jämvikten mellan NH₃ och NH₄⁺ styrs av Henderson–Hasselbalch-kemin. Vid
de pH-värden som är typiska för anaeroba rötkammare (7,5–8,2) existerar
endast en liten fraktion av TAN som fri NH₃ — men även denna lilla fraktion
kan vara betydelsefull om TAN-koncentrationerna är höga (t.ex.
4 000–8 000 mg N/L).

pKa för systemet NH₄⁺/NH₃ är ungefär 9,25 vid 25 °C men minskar med
stigande temperatur. Vid 35 °C (mesofilt) är pKa ≈ 9,09; vid 55 °C
(termofilt) är pKa ≈ 8,60. Använd temperaturkorrigeringsformeln nedan för
att beräkna rätt pKa för din processtemperatur.

Rapporterade hämningsgränser varierar kraftigt mellan studier
(150–1 500 mg NH₃-N/L), delvis eftersom de mikrobiella samhällena kan
anpassa sig till förhöjda ammoniak­koncentrationer över tid. Ändå ger
konsekvent övervakning av fri ammoniak en tidig varning om potentiell
hämning, länge innan biogasutbytet minskar märkbart.`
        },

        // -------------------------------------------------------
        // pKa-temperaturkorrigering
        // -------------------------------------------------------
        {
          id: "pka-temp",
          title: "pKa-temperaturkorrigering",
          intro: `Syradissociationskonstanten (pKa) för ammonium–ammoniak-jämvikten förändras
med temperaturen. Denna ekvation låter dig beräkna rätt pKa att använda i
beräkningen av fri ammoniak ovan, givet din rötkammares driftstemperatur.`,

          formula_latex:   "pK_a(T) = 0.09018 + \\frac{2729.92}{T + 273.15}",
          formula_filled:  "pKa = 0.09018 + 2729.92 ÷ ({T_celsius} + 273.15)",
          formula_calc:    "0.09018 + 2729.92 / (T_celsius + 273.15)",

          result_symbol:   "pKa",
          result_unit:     "—",
          result_decimals: 3,

          parameters: [
            {
              id:          "T_celsius",
              name:        "Temperatur",
              symbol:      "T",
              unit:        "°C",
              description: "Rötkammarens driftstemperatur",
              placeholder: 37,
              min:         0
            }
          ],

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
  55 °C → pKa ≈ 8,60

Använd pKa-värdet från denna ekvation som indata till beräkningen av fri
ammoniak ovan för att få en temperaturkorrigerad uppskattning av hämmande
fri ammoniak.`
        }

      ] // slut på ekvationer: Flik 2
    } // slut på Flik 2

  ] // slut på tabs

}; // slut på BIOGAS_CONTENT
