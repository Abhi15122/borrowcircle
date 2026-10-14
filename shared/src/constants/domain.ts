export const categories = ['Tools', 'Outdoors', 'Electronics', 'Home', 'Books', 'Sports'] as const;
export const conditions = ['Like new', 'Good', 'Well loved'] as const;
export const requestStatuses = [
  'pending',
  'approved',
  'borrowed',
  'returned',
  'rejected',
  'cancelled',
] as const;
export const requestActions = ['approve', 'reject', 'cancel', 'handover', 'return'] as const;
export type Category = (typeof categories)[number];
export type Condition = (typeof conditions)[number];
export type RequestStatus = (typeof requestStatuses)[number];
export type RequestAction = (typeof requestActions)[number];
