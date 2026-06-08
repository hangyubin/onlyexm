import { openDB, type IDBPDatabase } from 'idb';

export interface Question {
  id: number;
  content: string;
  type: string;
  options: { id: number; optionKey: string; content: string; isCorrect: boolean }[];
  infectionTag?: string;
  answer: string;
  analysis: string;
}

export interface UserProgress {
  id?: number;
  userId: number;
  questionId: number;
  isCorrect: boolean;
  lastPracticeTime: number;
  pendingSync: boolean;
}

export type SyncStatus = 'PENDING' | 'SUCCESS';

export interface PracticeRecord {
  id?: number;
  userId: number;
  questionId: number;
  userAnswer: string | string[];
  isCorrect: boolean;
  timestamp: number;
  syncStatus: SyncStatus;
}

const DB_NAME = 'OfflineExamDB';
const DB_VERSION = 1;

export class OfflineDBManager {
  private db: IDBPDatabase | null = null;

  async openDB(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('questions')) {
          const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
          questionStore.createIndex('type', 'type');
          questionStore.createIndex('infectionTag', 'infectionTag');
        }

        if (!db.objectStoreNames.contains('userProgress')) {
          const progressStore = db.createObjectStore('userProgress', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          progressStore.createIndex('userId', 'userId');
          progressStore.createIndex('questionId', 'questionId');
        }

        if (!db.objectStoreNames.contains('practiceRecords')) {
          const recordStore = db.createObjectStore('practiceRecords', { 
            keyPath: 'id',
            autoIncrement: true 
          });
          recordStore.createIndex('syncStatus', 'syncStatus');
          recordStore.createIndex('userId', 'userId');
          recordStore.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }

  async syncQuestions(questions: Question[]): Promise<void> {
    await this.openDB();
    if (!this.db) return;
    
    const tx = this.db.transaction('questions', 'readwrite');
    
    for (const question of questions) {
      await tx.store.put(question);
    }
    
    await tx.done;
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    await this.openDB();
    if (!this.db) return undefined;
    return this.db.get('questions', id);
  }

  async getAllQuestions(): Promise<Question[]> {
    await this.openDB();
    if (!this.db) return [];
    return this.db.getAll('questions');
  }

  async getQuestionsByType(type: string): Promise<Question[]> {
    await this.openDB();
    if (!this.db) return [];
    const tx = this.db.transaction('questions', 'readonly');
    return tx.store.getAll(IDBKeyRange.only(type));
  }

  async getQuestionsByTag(tag: string): Promise<Question[]> {
    await this.openDB();
    if (!this.db) return [];
    const tx = this.db.transaction('questions', 'readonly');
    return tx.store.getAll(IDBKeyRange.only(tag));
  }

  async savePractice(userId: number, questionId: number, isCorrect: boolean): Promise<void> {
    await this.openDB();
    if (!this.db) return;

    const tx = this.db.transaction(['userProgress', 'practiceRecords'], 'readwrite');

    const progressStore = tx.objectStore('userProgress');
    const allProgress = await progressStore.getAll();
    const existingProgress = allProgress.filter((p: UserProgress) => p.userId === userId);
    
    const questionProgress = existingProgress.find((p: UserProgress) => p.questionId === questionId);
    
    if (questionProgress) {
      await progressStore.put({
        ...questionProgress,
        isCorrect,
        lastPracticeTime: Date.now(),
        pendingSync: true,
      });
    } else {
      await progressStore.add({
        userId,
        questionId,
        isCorrect,
        lastPracticeTime: Date.now(),
        pendingSync: true,
      });
    }

    const recordStore = tx.objectStore('practiceRecords');
    await recordStore.add({
      userId,
      questionId,
      userAnswer: '',
      isCorrect,
      timestamp: Date.now(),
      syncStatus: 'PENDING',
    });

    await tx.done;
  }

  async savePracticeRecord(record: Omit<PracticeRecord, 'id'>): Promise<number> {
    await this.openDB();
    if (!this.db) return 0;
    const result = await this.db.add('practiceRecords', record);
    return typeof result === 'number' ? result : 0;
  }

  async getPendingSync(): Promise<PracticeRecord[]> {
    await this.openDB();
    if (!this.db) return [];
    const tx = this.db.transaction('practiceRecords', 'readonly');
    return tx.store.getAll(IDBKeyRange.only('PENDING'));
  }

  async getPendingProgress(): Promise<UserProgress[]> {
    await this.openDB();
    if (!this.db) return [];
    const tx = this.db.transaction('userProgress', 'readonly');
    const allProgress = await tx.store.getAll();
    return allProgress.filter((p: UserProgress) => p.pendingSync);
  }

  async markSynced(ids: number[]): Promise<void> {
    await this.openDB();
    if (!this.db) return;

    const tx = this.db.transaction('practiceRecords', 'readwrite');
    const store = tx.objectStore('practiceRecords');
    
    for (const id of ids) {
      const record = await store.get(id);
      if (record) {
        await store.put({ ...record, syncStatus: 'SUCCESS' as SyncStatus });
      }
    }
    
    await tx.done;
  }

  async markProgressSynced(userId: number, questionIds: number[]): Promise<void> {
    await this.openDB();
    if (!this.db) return;

    const tx = this.db.transaction('userProgress', 'readwrite');
    const store = tx.objectStore('userProgress');
    const allProgress = await store.getAll();
    
    for (const progress of allProgress as UserProgress[]) {
      if (progress.userId === userId && questionIds.includes(progress.questionId)) {
        await store.put({ ...progress, pendingSync: false });
      }
    }
    
    await tx.done;
  }

  async clearOldData(days: number = 30): Promise<void> {
    await this.openDB();
    if (!this.db) return;

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const tx = this.db.transaction('practiceRecords', 'readwrite');
    const store = tx.objectStore('practiceRecords');
    const allRecords = await store.getAll();
    
    for (const record of allRecords as PracticeRecord[]) {
      if (record.timestamp < cutoffTime) {
        await store.delete(record.id!);
      }
    }
    
    await tx.done;
  }

  async getUserProgress(userId: number): Promise<UserProgress[]> {
    await this.openDB();
    if (!this.db) return [];
    const tx = this.db.transaction('userProgress', 'readonly');
    const allProgress = await tx.store.getAll();
    return allProgress.filter((p: UserProgress) => p.userId === userId);
  }

  async getUserProgressByQuestion(userId: number, questionId: number): Promise<UserProgress | undefined> {
    await this.openDB();
    if (!this.db) return undefined;
    const tx = this.db.transaction('userProgress', 'readonly');
    const allProgress = await tx.store.getAll();
    return allProgress.find((p: UserProgress) => p.userId === userId && p.questionId === questionId);
  }

  async getPracticeRecords(userId: number): Promise<PracticeRecord[]> {
    await this.openDB();
    if (!this.db) return [];
    const tx = this.db.transaction('practiceRecords', 'readonly');
    const allRecords = await tx.store.getAll();
    return allRecords.filter((r: PracticeRecord) => r.userId === userId);
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.openDB();
    if (!this.db) return;
    await this.db.delete('questions', id);
  }

  async clearAll(): Promise<void> {
    await this.openDB();
    if (!this.db) return;
    
    const tx = this.db.transaction(['questions', 'userProgress', 'practiceRecords'], 'readwrite');
    await tx.objectStore('questions').clear();
    await tx.objectStore('userProgress').clear();
    await tx.objectStore('practiceRecords').clear();
    await tx.done;
  }

  async getStats(): Promise<{
    questionsCount: number;
    pendingSyncCount: number;
    totalPracticeCount: number;
  }> {
    await this.openDB();
    if (!this.db) {
      return { questionsCount: 0, pendingSyncCount: 0, totalPracticeCount: 0 };
    }

    const questionsCount = await this.db.count('questions');
    const totalPracticeCount = await this.db.count('practiceRecords');
    
    const tx = this.db.transaction('practiceRecords', 'readonly');
    const pendingRecords = await tx.store.getAll(IDBKeyRange.only('PENDING'));

    return { 
      questionsCount, 
      pendingSyncCount: pendingRecords.length, 
      totalPracticeCount 
    };
  }
}

export const offlineDB = new OfflineDBManager();
