import {container} from "tsyringe";
import {LobbyService} from "./services/LobbyService";
import {ChatMessageService} from "./services/ChatMessageService";
import {GameService} from "./services/GameService";
import {UserService} from "./services/UserService";

container.register("ChatMessageService", {useValue: new ChatMessageService()});
container.register("GameService", {useValue: new GameService()});
container.register("LobbyService", {useValue: new LobbyService()});
container.register("UserService", {useValue: new UserService()});

export {container}
