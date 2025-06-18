// central locale aggregator

import zh from './zh-CN';
import en from './en';

const messages = {
  'zh-CN': zh,
  en,
} as const;

export type Locale = keyof typeof messages;
export type MessageSchema = (typeof messages)[Locale];

export default messages;
