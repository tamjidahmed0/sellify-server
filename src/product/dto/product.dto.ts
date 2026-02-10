import {
    IsString,
    IsOptional,
    IsDecimal,
    IsUUID,
    IsUrl,
    IsInt,
} from 'class-validator';


export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDecimal()
    price: string;

    @IsOptional()
    @IsInt()
    stock?: number;

    @IsOptional()
    @IsDecimal()
    originalPrice?: string;

    @IsOptional()
    @IsUrl()
    image?: string;

    @IsUUID()
    categoryId: string[];

    @IsOptional()
    @IsString()
    slug?: string;

}
