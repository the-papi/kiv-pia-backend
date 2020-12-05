import {Container} from "typedi";
import {LobbyService} from "./services/implementation/LobbyService";
import {ChatMessageService} from "./services/implementation/ChatMessageService";
import {GameService} from "./services/implementation/GameService";
import {UserService, UserServiceInterfacee} from "./services/implementation/UserService";
// import {UserService} from "./services/implementation/UserService";

Container.set("ChatMessageService", new ChatMessageService());
Container.set("GameService", new GameService());
Container.set("LobbyService", new LobbyService());
// Container.set("UserService", new UserService());
// Container.set(UserServiceInterfacee, Container.get(UserService))

export default Container
