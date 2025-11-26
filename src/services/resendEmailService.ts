import { Resend } from 'resend';
import { EmailConfig } from '../models/EmailConfig';
import { EmailTemplate } from '../models/EmailTemplate';
import { EmailVariable } from '../models/EmailVariable';
import { IBooking } from '../models/Booking';
import { SimpleTemplateProcessor } from './simpleTemplateProcessor';
import { DEFAULT_LOGO_DATA_URL } from '../assets/defaultLogoData';
import path from 'path';
import fs from 'fs';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  cc?: string[];
}
