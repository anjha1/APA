
export enum AgentType {
  ORCHESTRATOR = 'ORCHESTRATOR',
  SHOPPING = 'SHOPPING',
  FOOD_DELIVERY = 'FOOD_DELIVERY',
  COMMUNICATION = 'COMMUNICATION',
  PHARMACY = 'PHARMACY',
  CALLING = 'CALLING'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  PLANNING = 'PLANNING',
  VALIDATING = 'VALIDATING',
  EXECUTING = 'EXECUTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REQUIRES_APPROVAL = 'REQUIRES_APPROVAL'
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  BLOCKED = 'BLOCKED'
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  avatar?: string;
  isSpecialized?: boolean;
  type?: 'tutor' | 'interviewer' | 'personal';
  promptOverride?: string;
}

export interface TaskItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Task {
  id: string;
  description: string;
  type: AgentType;
  status: TaskStatus;
  result?: string;
  timestamp: number;
  platform?: string;
  platformLink?: string;
  price?: number;
  riskLevel: RiskLevel;
  feedback?: 'positive' | 'negative';
  items?: TaskItem[];
  deliveryAddress?: string;
  deliveryInstructions?: string;
  transactionId?: string;
  paymentMethod?: string;
  contactPhone?: string;
  source?: 'Command Center' | 'Calling Agent';
  callRefId?: string;
}

export interface CallLog {
  id: string;
  recipient: string;
  phone?: string;
  duration: string;
  purpose: string;
  timestamp: number;
  status: 'COMPLETED' | 'MISSED' | 'FAILED';
  voiceUsed?: string;
  transcript?: { role: 'user' | 'assistant', content: string, timestamp: number }[];
}

export interface DetailedProfile {
  fullName: string;
  email?: string;
  avatar?: string;
  houseNo: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  altPhone: string;
  contacts: Contact[];
  agentDefaultMessage: string;
  defaultVoice: string;
}

export interface UserPreferences {
  name: string;
  address: string;
  phone: string;
  paymentMethod: string;
  spendingLimit: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tasks?: Task[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
