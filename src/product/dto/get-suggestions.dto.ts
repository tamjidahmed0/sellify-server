import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class GetSuggestionsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  q: string;
}