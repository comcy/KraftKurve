export interface BaseEntity {
  id: string;           // UUID v4
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
  version: number;      // incremented on every write (migration support)
}
