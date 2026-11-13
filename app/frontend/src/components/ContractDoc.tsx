import type { Contract } from '../api'
import { fmt, useApp } from '../state'

const USE: Record<string, [string, string]> = {
  household: ['Shtëpiak', 'Household'], commercial: ['Komercial', 'Commercial'], institution: ['Institucion', 'Institution'],
}
const date = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.')

/** The printable service contract. The wording is a model for the pilot and says so. */
export default function ContractDoc({ k }: { k: Contract }) {
  const { t } = useApp()
  const use = t(...USE[k.use_type])
  const tariff = k.tariff !== null
    ? t(`Tarifa shtëpiake e miratuar nga ARRU për vitin 2026 është ${fmt(k.tariff, 2)} €/m³.`, `The household tariff approved by ARRU for 2026 is ${fmt(k.tariff, 2)} €/m³.`)
    : t('Zbatohet tarifa e miratuar nga ARRU për këtë kategori.', 'The tariff approved by ARRU for this category applies.')

  return (
    <article className="contract">
      <header className="contract-head">
        <div>
          <p className="contract-org">{t('Kompania Rajonale e Ujësjellësit "Mitrovica" Sh.A.', 'Regional Water Company "Mitrovica" J.S.C.')}</p>
          <h1>{t('Kontratë për furnizim me ujë të pijshëm', 'Drinking water supply contract')}</h1>
        </div>
        <dl className="contract-meta">
          <dt>{t('Nr. i kontratës', 'Contract no.')}</dt><dd className="num">{k.number}</dd>
          <dt>{t('Kodi i konsumatorit', 'Customer code')}</dt><dd className="num">{k.customer_code}</dd>
          <dt>{t('Lidhur më', 'Signed on')}</dt><dd className="num">{date(k.created)} {k.created.slice(11, 16)}</dd>
        </dl>
      </header>

      <section>
        <h2>{t('Palët', 'The parties')}</h2>
        <div className="contract-parties">
          <div>
            <h3>{t('Furnizuesi', 'Supplier')}</h3>
            <p>{t('KRU "Mitrovica" Sh.A., njësia Mitrovicë, zona pilot DMA01 (Kçiq i Madh dhe Kçiq i Vogël).', 'KRU "Mitrovica" J.S.C., Mitrovica unit, pilot zone DMA01 (Kçiq i Madh and Kçiq i Vogël).')}</p>
          </div>
          <div>
            <h3>{t('Konsumatori', 'Customer')}</h3>
            <dl className="kv">
              <dt>{t('Emri', 'Name')}</dt><dd>{k.full_name}</dd>
              <dt>{t('Numri personal', 'Personal no.')}</dt><dd className="num">{k.personal_no}</dd>
              <dt>{t('Telefoni', 'Phone')}</dt><dd className="num">{k.phone}</dd>
              {k.email && <><dt>Email</dt><dd>{k.email}</dd></>}
            </dl>
          </div>
        </div>
      </section>

      <section>
        <h2>{t('Vendi i furnizimit', 'Place of supply')}</h2>
        <dl className="kv">
          <dt>{t('Adresa', 'Address')}</dt><dd>{k.address}, {k.village}</dd>
          <dt>{t('Ndërtesa në GIS', 'Building in GIS')}</dt><dd className="num">{k.building || t('caktohet në terren', 'to be set in the field')}</dd>
          <dt>{t('Shfrytëzimi', 'Use')}</dt><dd>{use}, {k.persons} {t(k.persons === 1 ? 'person' : 'persona', k.persons === 1 ? 'person' : 'people')}</dd>
          <dt>{t('Fillimi i furnizimit', 'Supply starts')}</dt><dd className="num">{date(k.start_date)}</dd>
        </dl>
      </section>

      <section>
        <h2>{t('Kushtet', 'Terms')}</h2>
        <ol className="clauses">
          <li>{t('Furnizuesi siguron ujë të pijshëm 24 orë në ditë, me presion ndërmjet 1,5 dhe 7 bar në pikën e lidhjes, sipas Rregullës ARRU 02/2016.', 'The supplier provides drinking water 24 hours a day, at a pressure between 1.5 and 7 bar at the connection, under ARRU Rule 02/2016.')}</li>
          <li>{t('Ujëmatësi vendoset nga furnizuesi në kufirin e pronës dhe vulosur. Konsumatori e mbron nga ngrirja dhe dëmtimi dhe nuk e prek vulën.', 'The supplier installs and seals the meter at the property boundary. The customer protects it from frost and damage and does not touch the seal.')}</li>
          <li>{t('Konsumi lexohet çdo muaj dhe faturohet sipas leximit. ', 'Use is read every month and billed on the reading. ') + tariff}</li>
          <li>{t('Konsumatori lejon qasjen e lexuesit dhe të ekipit teknik te ujëmatësi në orar pune.', 'The customer gives the meter reader and the technical crew access to the meter during working hours.')}</li>
          <li>{t('Lidhjet pa ujëmatës, anashkalimi i ujëmatësit dhe shitja e ujit palëve të treta janë të ndaluara.', 'Unmetered connections, bypassing the meter and selling water to third parties are forbidden.')}</li>
          <li>{t('Të dhënat personale përpunohen vetëm për furnizim dhe faturim, sipas Ligjit nr. 06/L-082 për mbrojtjen e të dhënave personale.', 'Personal data is processed only for supply and billing, under Law No. 06/L-082 on the protection of personal data.')}</li>
          <li>{t('Kontrata ruhet në regjistrin digjital të KRU-së. Nuk mund të ndryshohet ose fshihet; çdo ndryshim bëhet me aneks të ri.', 'The contract is kept in the KRU digital register. It cannot be changed or deleted; any change is made with a new annex.')}</li>
        </ol>
      </section>

      <section className="contract-sign">
        <div>
          <h3>{t('Nënshkrimi i konsumatorit', 'Customer signature')}</h3>
          {k.signature ? <img src={k.signature} alt={t(`Nënshkrimi i ${k.full_name}`, `Signature of ${k.full_name}`)} /> : <p className="note">…</p>}
          <p>{k.full_name}</p>
        </div>
        <div>
          <h3>{t('Për furnizuesin', 'For the supplier')}</h3>
          <p className="stamp">{t('Nënshkruar elektronikisht nga sistemi', 'Signed electronically by the system')}<br />{date(k.created)}</p>
          <p>KRU "Mitrovica" Sh.A.</p>
        </div>
      </section>

      <footer className="contract-foot">
        <p><b>{t('Gjurma SHA-256', 'SHA-256 fingerprint')}</b> <code>{k.hash}</code></p>
        <p><b>{t('Lidhur me kontratën e mëparshme', 'Linked to the previous contract')}</b> <code>{k.prev_hash}</code></p>
        <p className="note">{t('Prototip i hackathonit: teksti i kontratës është model dhe duhet miratuar nga KRU para përdorimit.', 'Hackathon prototype: the contract wording is a model and must be approved by KRU before use.')}</p>
      </footer>
    </article>
  )
}
