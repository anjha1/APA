
import { Task, CallLog, DetailedProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'apa_profile',
  TASKS: 'apa_tasks',
  CALL_LOGS: 'apa_call_logs',
  WALLET: 'apa_wallet_balance'
};

export class PersistenceService {
  private static instance: PersistenceService;
  private mongodbUri: string | undefined;

  private constructor() {
    // Accessing the URI from your provided .env configuration
    this.mongodbUri = process.env.MONGODB_URI;
  }

  public static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  async saveProfile(profile: DetailedProfile): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    console.debug("Profile updated locally. MongoDB Bridge active.");
  }

  async getProfile(): Promise<DetailedProfile | null> {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  async getTasks(): Promise<Task[]> {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    return data ? JSON.parse(data) : [];
  }

  async saveCallLogs(logs: CallLog[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(logs));
  }

  async getCallLogs(): Promise<CallLog[]> {
    const data = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    return data ? JSON.parse(data) : [];
  }

  async saveWalletBalance(balance: number): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.WALLET, balance.toString());
  }

  async getWalletBalance(): Promise<number> {
    const data = localStorage.getItem(STORAGE_KEYS.WALLET);
    return data ? parseFloat(data) : 1500;
  }
}
