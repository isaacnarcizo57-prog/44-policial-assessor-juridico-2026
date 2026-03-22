import { z } from 'zod';

export enum IncidentCategory {
  THEFT = 'theft',
  ASSAULT = 'assault',
  VANDALISM = 'vandalism',
  TRAFFIC = 'traffic',
  OTHER = 'other',
}

export const IncidentCategoryLabels: Record<IncidentCategory, string> = {
  [IncidentCategory.THEFT]: 'Roubo / Furto',
  [IncidentCategory.ASSAULT]: 'Agressão',
  [IncidentCategory.VANDALISM]: 'Dano à Propriedade',
  [IncidentCategory.TRAFFIC]: 'Infração de Trânsito',
  [IncidentCategory.OTHER]: 'Outra Ocorrência',
};

export const PersonSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Nome muito curto'),
  rg: z.string().optional(),
  role: z.string().min(2, 'Papel obrigatório'),
  details: z.string().optional(),
});

export type Person = z.infer<typeof PersonSchema>;

export const OccurrenceSchema = z.object({
  id: z.string(),
  category: z.nativeEnum(IncidentCategory),
  location: z.string().optional(),
  exactLocation: z.string().optional(),
  vtr: z.string().min(1, 'VTR obrigatória'),
  guarnicao: z.string().optional(),
  narrative: z.string().min(10, 'Narrativa muito curta'),
  involvedPersons: z.array(PersonSchema),
  evidence: z.array(z.string()), // base64 or URLs
  legalAnalysis: z.string().optional(),
  createdAt: z.string(),
  status: z.enum(['pending', 'investigating', 'resolved']),
  ownerId: z.string(),
});

export type Occurrence = z.infer<typeof OccurrenceSchema>;

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['lead', 'customer', 'archived']),
  ownerId: z.string(),
  createdAt: z.string(),
});

export type Contact = z.infer<typeof ContactSchema>;
