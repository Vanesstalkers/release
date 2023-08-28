(class LobbySession extends lib.user.session() {
  constructor(data = {}) {
    super(data);
    this.preventSaveFields(['lobbyId']); // если сохранять lobbyId в БД, то поломается логика со связанными сессиями в initSession
  }
});
