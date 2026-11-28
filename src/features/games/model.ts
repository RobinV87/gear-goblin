export interface GameInput {
  title: string
  system: string
  deviceIds: string[]
}

export interface Game extends GameInput {
  id: string
}

export function gameIdentity(title: string, system: string) {
  return JSON.stringify([title, system].map(value => value.trim().replace(/\s+/g, ' ').toLowerCase()))
}
