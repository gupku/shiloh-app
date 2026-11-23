// Countries shown in the "Add Country" dropdown (code = ISO 2-letter code used for the flag)
const LIST: [code: string, name: string][] = [
  ['DZ', 'Algeria'], ['AO', 'Angola'], ['AR', 'Argentina'], ['AU', 'Australia'], ['AT', 'Austria'],
  ['BS', 'Bahamas'], ['BB', 'Barbados'], ['BE', 'Belgium'], ['BJ', 'Benin'], ['BW', 'Botswana'],
  ['BR', 'Brazil'], ['BF', 'Burkina Faso'], ['BI', 'Burundi'], ['CV', 'Cabo Verde'], ['CM', 'Cameroon'],
  ['CA', 'Canada'], ['CF', 'Central African Republic'], ['TD', 'Chad'], ['CN', 'China'], ['KM', 'Comoros'],
  ['CG', 'Congo'], ['CD', 'Congo (DR)'], ['CI', "Côte d'Ivoire"], ['DK', 'Denmark'], ['DJ', 'Djibouti'],
  ['EG', 'Egypt'], ['GQ', 'Equatorial Guinea'], ['ER', 'Eritrea'], ['SZ', 'Eswatini'], ['ET', 'Ethiopia'],
  ['FR', 'France'], ['GA', 'Gabon'], ['GM', 'Gambia'], ['DE', 'Germany'], ['GH', 'Ghana'],
  ['GN', 'Guinea'], ['GW', 'Guinea-Bissau'], ['GY', 'Guyana'], ['HT', 'Haiti'], ['IN', 'India'],
  ['IE', 'Ireland'], ['IT', 'Italy'], ['JM', 'Jamaica'], ['JP', 'Japan'], ['KE', 'Kenya'],
  ['LS', 'Lesotho'], ['LR', 'Liberia'], ['LY', 'Libya'], ['MG', 'Madagascar'], ['MW', 'Malawi'],
  ['MY', 'Malaysia'], ['ML', 'Mali'], ['MR', 'Mauritania'], ['MU', 'Mauritius'], ['MA', 'Morocco'],
  ['MZ', 'Mozambique'], ['NA', 'Namibia'], ['NL', 'Netherlands'], ['NZ', 'New Zealand'], ['NE', 'Niger'],
  ['NG', 'Nigeria'], ['NO', 'Norway'], ['PK', 'Pakistan'], ['PH', 'Philippines'], ['PL', 'Poland'],
  ['PT', 'Portugal'], ['QA', 'Qatar'], ['RW', 'Rwanda'], ['ST', 'São Tomé and Príncipe'], ['SA', 'Saudi Arabia'],
  ['SN', 'Senegal'], ['SC', 'Seychelles'], ['SL', 'Sierra Leone'], ['SG', 'Singapore'], ['SO', 'Somalia'],
  ['ZA', 'South Africa'], ['KR', 'South Korea'], ['SS', 'South Sudan'], ['ES', 'Spain'], ['SD', 'Sudan'],
  ['SE', 'Sweden'], ['CH', 'Switzerland'], ['TZ', 'Tanzania'], ['TG', 'Togo'], ['TT', 'Trinidad and Tobago'],
  ['TN', 'Tunisia'], ['UG', 'Uganda'], ['AE', 'United Arab Emirates'], ['GB', 'United Kingdom'],
  ['US', 'United States'], ['ZM', 'Zambia'], ['ZW', 'Zimbabwe'],
]

export const COUNTRIES = LIST.map(([code, name]) => ({ code, name }))

// Ghana and USA flags come from the Figma file; the rest load from flagcdn.com
const LOCAL_FLAGS: Record<string, string> = { GH: '/assets/flag-ghana.png', US: '/assets/flag-usa.png' }

export const flagUrl = (code: string) => LOCAL_FLAGS[code] ?? `https://flagcdn.com/w160/${code.toLowerCase()}.png`
