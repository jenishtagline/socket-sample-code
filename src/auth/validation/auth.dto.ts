import { IsString, IsNotEmpty, IsEmail, MaxLength, IsOptional, MinLength, IsBoolean, IsNumber } from 'class-validator'

export class SignUpForUsers {

    // @IsNotEmpty()
    @IsOptional()
    @IsString()
    username: String;

    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: String;

    // @IsNotEmpty()
    @IsOptional()
    // @IsString()
    dob: String;

    // @IsNotEmpty()
    @IsOptional()
    @IsString()
    gender: String;

    @IsOptional()
    @IsString()
    // @MinLength(8)
    password: String;

}

export class LoginForUsers {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: String;

    @IsNotEmpty()
    @MinLength(8)
    password: String;
}

export class VerificationForUsers {
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: String;

    @IsNumber()
    @IsNotEmpty()
    otp: Number;

    @IsString()
    @IsNotEmpty()
    fcmToken: String;

    @IsString()
    @IsNotEmpty()
    deviceuuid: String;

    @IsString()
    @IsNotEmpty()
    deviceType: String;
}

export class GetUsers {

    @IsString()
    @IsNotEmpty()
    userId: String;

    // @IsString()
    // @IsNotEmpty()
    // deviceType: String;
}
export class ConnectionRequest {

    @IsString()
    @IsNotEmpty()
    userId: String;

    @IsString()
    @IsNotEmpty()
    connectionId: String;

    @IsString()
    @IsNotEmpty()
    status: String;

    // @IsString()
    // @IsNotEmpty()
    // deviceType: String;
}