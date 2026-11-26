export type FormFactor = 'vertical' | 'horizontal' | 'clamshell' | 'unknown'

// Generic illustrations identify a form factor, not the exact physical device.
const forms: Record<string, FormFactor> = {
  'RG DS': 'clamshell', 'RG DS Plus': 'clamshell', 'RG35XXSP': 'clamshell', 'RG34XXSP': 'clamshell',
  'RG35XX': 'vertical', 'RG35XX 2024': 'vertical', 'RG35XX Plus': 'vertical', 'RG35XX Pro': 'vertical',
  'RG300': 'vertical', 'RG280V': 'vertical', 'RG351V': 'vertical', 'RG353V': 'vertical', 'RG353VS': 'vertical', 'RG40XX V': 'vertical', 'RG405V': 'vertical', 'RG406V': 'vertical', 'RG477V': 'vertical',
  'RG28XX': 'horizontal', 'RG34XX': 'horizontal', 'RG35XX H': 'horizontal', 'RG40XX H': 'horizontal', 'RG280M': 'horizontal', 'RG300X': 'horizontal', 'RG350': 'horizontal', 'RG350M': 'horizontal', 'RG350P': 'horizontal', 'RG351M': 'horizontal', 'RG351MP': 'horizontal', 'RG351P': 'horizontal', 'RG353M': 'horizontal', 'RG353P': 'horizontal', 'RG353PS': 'horizontal', 'RG405M': 'horizontal', 'RG406H': 'horizontal', 'RG476H': 'horizontal', 'RG477M': 'horizontal', 'RG503': 'horizontal', 'RG505': 'horizontal', 'RG552': 'horizontal', 'RG556': 'horizontal', 'RG557': 'horizontal', 'RG ARC-D': 'horizontal', 'RG ARC-S': 'horizontal', 'RG Cube': 'horizontal', 'RG CubeXX': 'horizontal', 'Win600': 'horizontal',
}
export function getFormFactor(manufacturer: string, model: string): FormFactor {
  if (manufacturer.trim().toLowerCase() !== 'anbernic') return 'unknown'
  const name = Object.keys(forms).find(key => key.toLowerCase() === model.trim().toLowerCase())
  return name ? forms[name] : 'unknown'
}
