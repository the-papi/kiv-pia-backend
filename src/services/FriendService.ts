import {getCustomRepository, getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {FriendRequest} from "../entity/FriendRequest";
import {UserRepository} from "../repositories/User";

export class FriendService implements types.FriendService {
    async sendFriendRequest(requester: User, foreignUserId: number): Promise<boolean> {
        let friendRequestRepository = getRepository(FriendRequest);
        let userRepository = getRepository(User);

        console.log("==================", Promise.resolve(requester.id));

        try {
            let friendRequest = new FriendRequest();
            let potentialFriend = await userRepository.findOne({id: foreignUserId});
            if (await friendRequestRepository.createQueryBuilder("friendRequest")
                .innerJoin("friendRequest.requester", "requester")
                .innerJoin("friendRequest.potentialFriend", "potentialFriend")
                .where("requester.id = :id", {id: requester.id})
                .where("potentialFriend.id = :id", {id: potentialFriend.id})
                .getCount()
            ) {
                // Friend request already sent
                return false;
            }

            console.log("==================", Promise.resolve(potentialFriend.id));

            if (await userRepository.createQueryBuilder("user")
                .innerJoin("user.friends", "friends")
                .where("user.id = :id", {id: requester.id})
                .where("friends.id = :id", {id: foreignUserId})
                .getCount()) {
                // Already in friend list
                return false;
            }

            friendRequest.requester = Promise.resolve(requester);
            friendRequest.potentialFriend = Promise.resolve(potentialFriend);

            await friendRequestRepository.save(friendRequest);
            return true;
        } catch (e) {
            return false;
        }
    }

    async acceptFriendRequest(requestId: number): Promise<boolean> {
        let userRepository = getCustomRepository(UserRepository);
        let friendRequestRepository = getRepository(FriendRequest);
        let request = await friendRequestRepository.findOne({id: requestId});

        if (!request) {
            return false;
        }

        try {
            await userRepository.addFriend(request.requester, request.potentialFriend);
        } catch (e) {
            return false;
        }

        await friendRequestRepository.remove(request);

        return true;
    }

    async getFriendRequests(forUser: User): Promise<FriendRequest[]> {
        let friendRequestRepository = getRepository(FriendRequest);

        return friendRequestRepository.createQueryBuilder("friendRequest")
            .innerJoin("friendRequest.potentialFriend", "potentialFriend")
            .where("potentialFriend.id = :id", {id: forUser.id})
            .getMany();
    }
}
