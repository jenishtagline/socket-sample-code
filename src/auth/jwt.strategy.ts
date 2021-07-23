import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { jwtConstants } from "src/common/jwt.constants";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
            secretOrKey: jwtConstants.secret
        })
    }

    async validate(payload) {
        const user = await this.authService.validateUser(payload)
        console.log('user :>> ', user);
        if (!user) {
            throw new HttpException("Invalid User", HttpStatus.UNAUTHORIZED)
        }
        return { email: user.email, _id: user._id }
    }
}