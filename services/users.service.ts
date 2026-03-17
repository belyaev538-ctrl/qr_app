import { updateUserStoreId } from '../lib/firestore';

export async function setUserStoreId(uid: string, storeId: string): Promise<void> {
  await updateUserStoreId(uid, storeId);
}
