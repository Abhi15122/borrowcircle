import { communityToday, type BorrowRequestDto, type RequestAction } from '@borrowcircle/shared';
export const actionLabels: Record<RequestAction, string> = {
  approve: 'Approve',
  reject: 'Reject',
  cancel: 'Cancel request',
  handover: 'Confirm handover',
  return: 'Confirm return',
};
export function permittedActions(
  request: BorrowRequestDto,
  view: 'borrowing' | 'lending',
): RequestAction[] {
  if (view === 'borrowing')
    return ['pending', 'approved'].includes(request.status) ? ['cancel'] : [];
  if (request.status === 'pending')
    return request.startDate >= communityToday() ? ['approve', 'reject'] : ['reject'];
  if (
    request.status === 'approved' &&
    !request.item.onLoan &&
    communityToday() >= request.startDate &&
    communityToday() <= request.endDate
  )
    return ['handover'];
  return request.status === 'borrowed' ? ['return'] : [];
}
