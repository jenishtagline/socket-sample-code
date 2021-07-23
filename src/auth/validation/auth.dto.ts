import { IsString, IsNotEmpty, IsEmail, MaxLength, IsOptional, MinLength, IsBoolean, IsNumber } from 'class-validator'

export class SignUpForUsers {

    @IsNotEmpty()
    @IsString()
    username: String;

    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: String;

    @IsNotEmpty()
    // @IsString()
    dob: String;

    @IsNotEmpty()
    @IsString()
    gender: String;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
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