import AuthenticationBackend from "./auth/backends/AuthenticationBackend";
import JWTAuthenticationBackend from "./auth/backends/JWTAuthenticationBackend";

let authenticationBackends: AuthenticationBackend[] = [
    new JWTAuthenticationBackend
];

export default {
    authenticationBackends,
    secretKey: process.env.SECRET_KEY,
    jwt: {
        accessExpireIn: process.env.JWT_ACCESS_EXPIRE_IN,
        refreshExpireIn: process.env.JWT_REFRESH_EXPIRE_IN,
        algorithm: process.env.JWT_ALGORITHM,
    },
}
