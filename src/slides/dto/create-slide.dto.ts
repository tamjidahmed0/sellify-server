import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSlideDto {
    @IsString()
    @IsNotEmpty()
    badge: string;

    @IsString()
    @IsNotEmpty()
    title: string;
    
    @IsString()
    @IsNotEmpty()
    image:string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    link: string;
}