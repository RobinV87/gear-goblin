import { z } from 'zod'
export const settingsSchema = z.object({ theme: z.enum(['workshop', 'light', 'green', 'system']), largeText: z.boolean(), reduceMotion: z.boolean(), view: z.enum(['grid', 'list']) }).strict()
export type AppSettings = z.infer<typeof settingsSchema>
export const defaultSettings: AppSettings = { theme: 'workshop', largeText: false, reduceMotion: false, view: 'grid' }
