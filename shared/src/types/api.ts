import type { Category, Condition, RequestStatus } from '../constants/domain.js';
export interface UserDto {
  id: string;
  name: string;
}
export interface ItemDto {
  id: string;
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  pickupArea: string;
  imageUrl: string;
  owner: UserDto;
  archived: boolean;
  onLoan: boolean;
}
export interface ItemDetailDto extends ItemDto {
  reservedDates: string[];
}
export interface BorrowRequestDto {
  id: string;
  item: ItemDto;
  borrower: UserDto;
  owner: UserDto;
  startDate: string;
  endDate: string;
  note: string;
  status: RequestStatus;
  createdAt: string;
  handedOverAt: string | null;
  returnedAt: string | null;
}
export interface PageDto<T> {
  data: T[];
  page: number;
  total: number;
  pages: number;
}
export interface ApiErrorDto {
  error: { message: string; fields?: Record<string, string> };
}
