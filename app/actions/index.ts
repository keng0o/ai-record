








}  return plainSession;    const plainSession = JSON.parse(JSON.stringify(session));  // ここでクラスインスタンスの場合も plain なオブジェクトに変換    const session = await SomeSessionCreationLogic(userId);  // 既存のセッション生成ロジックexport async function createSession(userId: string) {