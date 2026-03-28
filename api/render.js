const SB_URL = 'https://mqmxmdiecibtvglidsvp.supabase.co'
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbXhtZGllY2lidHZnbGlkc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDE5MzYsImV4cCI6MjA5MDE3NzkzNn0.AZPgdnCnE_AxUNvk1dkSYQ4O6KO01_imfUvLB58KctA'

// Toimialakohtaiset defaults
const SVC_ICONS = {
  tilitoimisto: ['📒','📊','💼','📈','🏢','💡'],
  henkilosto:   ['🔍','👥','📋','⚡','🤝','📞'],
  kiinteisto:   ['🏠','📸','💰','📝','🔑','📊'],
  default:      ['⭐','🚀','💎','🔧','📊','🤝'],
}
const PAIN_ICONS = {
  tilitoimisto: ['⏳','📞','💸','📊'],
  henkilosto:   ['⏰','💸','🎯','🔄'],
  kiinteisto:   ['🏷️','📣','⏳','🔑'],
  default:      ['⏳','💸','🎯','🔄'],
}
const SVC_OPTIONS = {
  tilitoimisto: '<option>Kirjanpito</option><option>Tilinpäätös</option><option>Palkanlaskenta</option><option>Talousraportointi</option><option>Muu</option>',
  henkilosto:   '<option>Rekrytointi</option><option>Vuokratyö</option><option>Suorahaku</option><option>HR-konsultointi</option><option>Muu</option>',
  kiinteisto:   '<option>Asunnon myynti</option><option>Asunnon osto</option><option>Arviointi</option><option>Vuokraus</option><option>Muu</option>',
  default:      '<option>Palvelu 1</option><option>Palvelu 2</option><option>Palvelu 3</option><option>Muu</option>',
}

function r(html, key, val) {
  return html.split(`%%${key}%%`).join(val || '')
}

async function getTemplate(name) {
  // Haetaan template Supabase Storagesta
  const res = await fetch(`${SB_URL}/storage/v1/object/public/leadnord-pages-templates/pohja-${name}.html`, {
    headers: { 'apikey': SB_ANON }
  })
  if (res.ok) return res.text()
  return null
}

export default async function handler(req, res) {
  const slug = req.query.slug
  if (!slug || slug === 'favicon.ico') {
    return res.status(404).send('Not found')
  }

  // Hae sivu Supabasesta
  const sbRes = await fetch(
    `${SB_URL}/rest/v1/leadnord_pages?slug=eq.${slug}&status=eq.published&select=*`,
    { headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` } }
  )
  const pages = await sbRes.json()
  if (!pages || !pages.length) {
    return res.status(404).send(`<!DOCTYPE html><html lang="fi"><head><meta charset="UTF-8"><title>Sivua ei löydy</title><style>body{font-family:sans-serif;padding:48px;text-align:center;background:#faf9f7}</style></head><body><h1 style="font-size:48px">404</h1><p>Sivua ei löydy.</p><p><a href="https://leadnord.com">← Leadnord.com</a></p></body></html>`)
  }

  const page = pages[0]
  const ind = page.industry || 'default'
  const icons = SVC_ICONS[ind] || SVC_ICONS.default
  const picons = PAIN_ICONS[ind] || PAIN_ICONS.default
  const initial = (page.contact_name || page.company || 'Y').charAt(0).toUpperCase()

  // Hae template Storagesta tai käytä fallbackia
  let tmpl = await getTemplate(page.template || 'A')
  if (!tmpl) {
    // Fallback — redirect generate-functioniin
    return res.redirect(302, `${SB_URL}/functions/v1/pages-render/${slug}`)
  }

  let html = tmpl

  // Perustiedot
  html = r(html, 'YRITYS', page.company)
  html = r(html, 'TOIMIALA', page.industry)
  html = r(html, 'PAIKKAKUNTA', page.location || '')
  html = r(html, 'SLUG', page.slug)
  html = r(html, 'ASIAKASMAARA', page.client_count || '100')
  html = r(html, 'VUOSIA', page.years_in_business || '10')
  html = r(html, 'YTUNNUS', page.business_id || '')
  html = r(html, 'OSOITE', page.address || '')

  // Yhteystiedot
  html = r(html, 'CONTACT_NAME', page.contact_name || page.company)
  html = r(html, 'CONTACT_ROLE', 'Yrittäjä')
  html = r(html, 'CONTACT_PHONE', page.contact_phone || '')
  html = r(html, 'CONTACT_EMAIL', page.contact_email || '')
  html = r(html, 'CONTACT_INITIAL', initial)
  html = r(html, 'CONTACT_PHOTO', '')
  html = r(html, 'CONTACT_QUOTE', 'Olemme täällä teitä varten — ottakaa rohkeasti yhteyttä.')

  // Hero
  html = r(html, 'HERO_HEADLINE', page.hero_headline || `${page.company} — Palvelua johon voi luottaa.`)
  html = r(html, 'HERO_EM', 'Teille enemmän aikaa kasvaa.')
  html = r(html, 'HERO_SUB', page.hero_sub || '')

  // Process
  html = r(html, 'PROCESS_TITLE', 'Tunnemme teidän alan arjen.')
  html = r(html, 'PROCESS_SUB', 'Asiakkaamme haluavat keskittyä ydinbisnekseen — me hoidamme loput.')
  html = r(html, 'STEP_1_TITLE', 'Alkukartoitus')
  html = r(html, 'STEP_1_DESC', 'Käymme läpi tilanteenne. Selkeä tarjous ilman piilomaksuja.')
  html = r(html, 'STEP_1_TIME', 'Viikko 1')
  html = r(html, 'STEP_2_TITLE', 'Nopea aloitus')
  html = r(html, 'STEP_2_DESC', 'Hoitamme siirtymän saumattomasti. Teille ei tule lisätyötä.')
  html = r(html, 'STEP_2_TIME', 'Viikko 2')
  html = r(html, 'STEP_3_TITLE', 'Jatkuva palvelu')
  html = r(html, 'STEP_3_DESC', 'Yksi tuttu yhteyshenkilö, proaktiivinen ote.')
  html = r(html, 'STEP_3_TIME', 'Jatkuva')

  // Pain
  html = r(html, 'PAIN_ICON_1', picons[0]); html = r(html, 'PAIN_TITLE_1', page.pain_1 || 'Aika loppuu kesken'); html = r(html, 'PAIN_DESC_1', 'Päivittäiset kiireet vievät kaiken kapasiteetin.')
  html = r(html, 'PAIN_ICON_2', picons[1]); html = r(html, 'PAIN_TITLE_2', page.pain_2 || 'Vastaukset odottavat'); html = r(html, 'PAIN_DESC_2', 'Kysymys jää roikkumaan päiviä. Tärkeät päätökset odottavat.')
  html = r(html, 'PAIN_ICON_3', picons[2]); html = r(html, 'PAIN_TITLE_3', page.pain_3 || 'Kustannukset epäselviä'); html = r(html, 'PAIN_DESC_3', 'Tuntivelotusta sieltä täältä, yllätyslaskuja.')
  html = r(html, 'PAIN_ICON_4', picons[3]); html = r(html, 'PAIN_TITLE_4', page.pain_4 || 'Raportointi puuttuu'); html = r(html, 'PAIN_DESC_4', 'Numerot eivät kerro tarinaa.')

  // Services
  html = r(html, 'SERVICES_TITLE', 'Kaikki palvelut yhdeltä toimijalta.')
  for (let i = 1; i <= 6; i++) {
    html = r(html, `SVC_ICON_${i}`, icons[i-1])
    html = r(html, `SVC_TITLE_${i}`, page[`service_${i}`] || `Palvelu ${i}`)
    html = r(html, `SVC_DESC_${i}`, 'Luotettavasti ja ajallaan — aina.')
  }

  // Testimonial
  html = r(html, 'TESTIMONIAL_TEXT', 'Vihdoin löysimme palveluntarjoajan johon voi oikeasti luottaa. Suosittelen lämpimästi.')
  html = r(html, 'TESTIMONIAL_NAME', 'Tyytyväinen asiakas')
  html = r(html, 'TESTIMONIAL_ROLE', `Toimitusjohtaja, ${page.location || 'Suomi'}`)
  html = r(html, 'TESTIMONIAL_INITIAL', 'T')

  // FAQ
  html = r(html, 'FAQ_Q1', 'Kuinka nopeasti pääsemme aloittamaan?')
  html = r(html, 'FAQ_A1', 'Ensimmäinen tapaaminen yleensä viikon sisällä yhteydenotosta.')
  html = r(html, 'FAQ_Q2', 'Miten hinnoittelu toimii?')
  html = r(html, 'FAQ_A2', 'Kiinteä kuukausihinta — ei tuntivelotusta tai yllätyksiä.')
  html = r(html, 'FAQ_Q3', 'Voimmeko vaihtaa kesken kaiken?')
  html = r(html, 'FAQ_A3', 'Kyllä, vaihto onnistuu milloin tahansa. Hoidamme siirtymän.')
  html = r(html, 'FAQ_Q4', 'Palveletteko koko Suomea?')
  html = r(html, 'FAQ_A4', `Pääasiassa ${page.location || 'Suomi'} ja lähialueet. Etäasiakkuudet onnistuvat myös.`)

  // CTA
  html = r(html, 'CTA_HEADLINE', 'Otetaan yhteyttä tänään.')
  html = r(html, 'CTA_SUB', 'Ilmainen alkukartoitus — kerromme sopivan ratkaisun teidän tilanteeseen.')
  html = r(html, 'CTA_G1', 'Vastaus 24 tunnin sisällä')
  html = r(html, 'CTA_G2', 'Ei sitoutumista ennen tarjousta')
  html = r(html, 'CTA_G3', 'Henkilökohtainen palvelu')
  html = r(html, 'FORM_TITLE', 'Pyydä tarjous')
  html = r(html, 'FORM_SUB', 'Kerro tilanteesi — palaamme henkilökohtaisella tarjouksella.')
  html = r(html, 'FORM_BTN', 'Pyydä tarjous — maksuton →')
  html = r(html, 'SERVICE_OPTIONS', SVC_OPTIONS[ind] || SVC_OPTIONS.default)

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
  return res.status(200).send(html)
}
