import {getCustomRepository, getRepository} from "typeorm";
import * as types from "./types"
import {User} from "../entity/User";
import {FriendRequest} from "../entity/FriendRequest";
import {UserRepository} from "../repositories/User";
import * as apollo from "apollo-server";

export class FriendService implements types.FriendService {

    /**
     * @inheritDoc
     */
    async sendFriendRequest(pubSub: apollo.PubSub, requester: User, foreignUserId: number): Promise<boolean> {
        let friendRequestRepository = getRepository(FriendRequest);
        let userRepository = getRepository(User);

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

            await pubSub.publish("FRIEND_REQUEST", {
                requesterId: requester.id,
                potentialFriendId: potentialFriend.id
            })

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * @inheritDoc
     */
    async acceptFriendRequest(pubSub: apollo.PubSub, userId: number): Promise<boolean> {
        let userRepository = getCustomRepository(UserRepository);
        let friendRequestRepository = getRepository(FriendRequest);
        let request = await friendRequestRepository.createQueryBuilder("friendRequest")
            .innerJoin("friendRequest.requester", "requester")
            .where("requester.id = :id", {id: userId})
            .getOne();

        if (!request) {
            return false;
        }

        try {
            await userRepository.addFriend(request.requester, request.potentialFriend);
        } catch (e) {
            return false;
        }

        await friendRequestRepository.remove(request);

        await pubSub.publish("UPDATED_FRIEND_STATUS", {
            requesterId: userId,
            potentialFriendId: (await request.potentialFriend).id
        })

        return true;
    }

    /**
     * @inheritDoc
     */
    async rejectFriendRequest(pubSub: apollo.PubSub, userId: number): Promise<boolean> {
        let friendRequestRepository = getRepository(FriendRequest);
        let request = await friendRequestRepository.createQueryBuilder("friendRequest")
            .innerJoin("friendRequest.requester", "requester")
            .where("requester.id = :id", {id: userId})
            .getOne();

        if (!request) {
            return false;
        }

        await friendRequestRepository.remove(request);

        return true;
    }

    /**
     * @inheritDoc
     */
    async removeFriend(pubSub: apollo.PubSub, user1Id: number, user2Id: number): Promise<void> {
        let userRepository = getCustomRepository(UserRepository);
        await userRepository.removeFriend(userRepository.findOne(user1Id), userRepository.findOne(user2Id));

        await pubSub.publish("UPDATED_FRIEND_STATUS", {
            requesterId: user1Id,
            potentialFriendId: user2Id
        })
    }

    /**
     * @inheritDoc
     */
    async getFriendRequests(forUser: User): Promise<FriendRequest[]> {
        let friendRequestRepository = getRepository(FriendRequest);

        return friendRequestRepository.createQueryBuilder("friendRequest")
            .innerJoin("friendRequest.potentialFriend", "potentialFriend")
            .where("potentialFriend.id = :id", {id: forUser.id})
            .getMany();
    }

    /**
     * @inheritDoc
     */
    async getFriendStatus(contextUser: User, foreignUser: User): Promise<types.FriendStatus> {
        let friendRequestRepository = getRepository(FriendRequest);
        let userRepository = getRepository(User);

        if (await friendRequestRepository.createQueryBuilder("friendRequest")
            .innerJoin("friendRequest.potentialFriend", "potentialFriend")
            .innerJoin("friendRequest.requester", "requester")
            .where("requester.id = :foreignUserId", {foreignUserId: foreignUser.id})
            .andWhere("potentialFriend.id = :contextUserId", {contextUserId: contextUser.id})
            .getOne()) {
            return types.FriendStatus.PendingRequest;
        }

        if (await userRepository.createQueryBuilder("user")
            .innerJoin("user.friends", "friends")
            .where("user.id = :userId", {userId: contextUser.id})
            .andWhere("friends.id = :friendId", {friendId: foreignUser.id})
            .getOne()) {
            return types.FriendStatus.Friend;
        }

        return types.FriendStatus.NotFriend;
    }
}
