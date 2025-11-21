export type ResourceType = 'Video' | 'Reading' | 'Practice' | 'Other';
export type ResourceStatus = 'To Do' | 'In Progress' | 'Completed';
export type AccessLevel = 'viewer' | 'editor';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type ResourceLength = 'Short (<10m)' | 'Medium (10-30m)' | 'Long (>30m)';

export interface Flashcard {
  front: string;
  back: string;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  flashcards: Flashcard[];
  lastUpdated: string;
}

export interface Resource {
  id: string;
  boardId: string;
  url: string;
  title: string;
  description: string;
  type: ResourceType;
  status: ResourceStatus;
  difficulty: DifficultyLevel;
  length: ResourceLength;
  tags: string[];
  thumbnailUrl?: string; // For YouTube etc.
  createdAt: string;
  aiAnalysis?: AIAnalysis;
}

export interface SharedUser {
  email: string;
  accessLevel: AccessLevel;
}

export interface Board {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  ownerId: string;
  sharedWith: SharedUser[];
  publicAccess: AccessLevel | 'none';
}

export interface FilterState {
  search: string;
  type: ResourceType | 'All';
  status: ResourceStatus | 'All';
  difficulty: DifficultyLevel | 'All';
  length: ResourceLength | 'All';
  tags: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export interface UserAccount extends UserProfile {
  passwordHash: string; // In real app, this is a hash. Here we simulate.
  createdAt: string;
}