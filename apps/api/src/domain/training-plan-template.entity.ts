import { BaseEntity } from './base.entity';
import { WorkoutTemplate } from './training-session.entity';

export interface TrainingPlanTemplate extends BaseEntity {
  userId: string;
  name: string;
  templateType: WorkoutTemplate;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reminderDaysBefore: number;
  note: string | null;
  active: boolean;
}

export type TemplateReminderStatus = 'expiring' | 'expired';

export interface TrainingPlanTemplateReminder {
  templateId: string;
  templateName: string;
  endDate: string;
  daysRemaining: number;
  status: TemplateReminderStatus;
}
