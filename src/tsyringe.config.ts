import {container} from "tsyringe";
import {ChatMessageService} from "./services/ChatMessageService";
import {GameService} from "./services/GameService";
import {UserService} from "./services/UserService";
import * as redis from "redis";
import {FriendService} from "./services/FriendService";

container.register("redis", {useValue: redis.createClient(6379, "redis")})
container.register("ChatMessageService", {useValue: new ChatMessageService()});
container.register("GameService", {useValue: new GameService(container.resolve("redis"))});
container.register("UserService", {useValue: new UserService(container.resolve("redis"))});
container.register("FriendService", {useValue: new FriendService()});

export {container}
